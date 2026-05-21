import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';

/**
 * İzleme & Analitik Controller
 * API kullanım logları, health check, platform istatistikleri
 */

// ============================================
// API Usage Logs - API Kullanım Logları
// ============================================

/**
 * API kullanım loglarını listele
 */
export const listApiUsageLogs = asyncHandler(async (req: Request, res: Response) => {
  const {
    firm_id,
    endpoint,
    method,
    status_code,
    start_date,
    end_date,
    page = 1,
    limit = 50,
  } = req.query;

  const where: any = {};
  if (firm_id) where.firm_id = firm_id;
  if (endpoint) where.endpoint = { contains: endpoint as string };
  if (method) where.method = method;
  if (status_code) where.status_code = parseInt(status_code as string);
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date as string);
    if (end_date) where.created_at.lte = new Date(end_date as string);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    prisma.apiUsageLog.findMany({
      where,
      include: {
        firm: { select: { id: true, name: true } },
      },
      orderBy: { created_at: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.apiUsageLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Belirli bir firmanın API kullanım özetini al
 */
export const getFirmApiUsage = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;
  const { days = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(days));

  const [usage, topEndpoints, errorStats] = await Promise.all([
    // Toplam kullanım
    prisma.apiUsageLog.groupBy({
      by: ['method'],
      where: {
        firm_id,
        created_at: { gte: daysAgo },
      },
      _count: true,
    }),
    // En çok kullanılan endpointler
    prisma.apiUsageLog.groupBy({
      by: ['endpoint'],
      where: {
        firm_id,
        created_at: { gte: daysAgo },
      },
      _count: true,
      orderBy: { _count: { endpoint: 'desc' } },
      take: 10,
    }),
    // Hata istatistikleri
    prisma.apiUsageLog.groupBy({
      by: ['status_code'],
      where: {
        firm_id,
        created_at: { gte: daysAgo },
        status_code: { gte: 400 },
      },
      _count: true,
    }),
  ]);

  res.json({
    success: true,
    data: {
      period_days: Number(days),
      total_requests: usage.reduce((sum, u) => sum + u._count, 0),
      by_method: usage.map(u => ({ method: u.method, count: u._count })),
      top_endpoints: topEndpoints.map(e => ({ endpoint: e.endpoint, count: e._count })),
      error_count: errorStats.reduce((sum, e) => sum + e._count, 0),
      error_by_status: errorStats.map(e => ({ status: e.status_code, count: e._count })),
    },
  });
});

// ============================================
// Health Check - Sağlık Kontrolü
// ============================================

/**
 * Platform geneli sağlık durumunu al
 */
export const getPlatformHealth = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.query;

  // Son health logları al (created_at kullan)
  const recentLogs = await prisma.firmHealthLog.findMany({
    where: firm_id ? { firm_id: firm_id as string } : {},
    orderBy: { created_at: 'desc' },
    take: 24,
  });

  if (recentLogs.length === 0) {
    return res.json({
      success: true,
      data: {
        status: 'UNKNOWN',
        last_check: null,
        checks: [],
        message: 'Henüz sağlık kontrolü yapılmadı',
      },
    });
  }

  const latestLog = recentLogs[0];
  const statusCounts = recentLogs.reduce((acc, log) => {
    acc[log.status] = (acc[log.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
  if (statusCounts.UNHEALTHY > 0) overallStatus = 'UNHEALTHY';
  else if (statusCounts.DEGRADED > 3) overallStatus = 'DEGRADED';

  res.json({
    success: true,
    data: {
      status: overallStatus,
      last_check: latestLog.created_at,
      check_history: statusCounts,
      checks: recentLogs.slice(0, 10),
    },
  });
});

/**
 * Firma sağlık durumunu kontrol et
 */
export const checkFirmHealth = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.body;

  if (!firm_id) {
    throw new AppError('Firma ID gerekli', 400);
  }

  const firm = await prisma.firm.findUnique({
    where: { id: firm_id },
    select: { id: true, name: true, dolibarr_url: true, dolibarr_api_key: true },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  const checks: any[] = [];
  let overallStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';

  // Database bağlantısı
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.push({ name: 'database', status: 'HEALTHY', message: 'Bağlantı OK' });
  } catch {
    checks.push({ name: 'database', status: 'UNHEALTHY', message: 'Bağlantı hatası' });
    overallStatus = 'UNHEALTHY';
  }

  // Dolibarr API
  checks.push({
    name: 'dolibarr_api',
    status: firm.dolibarr_url ? 'HEALTHY' : 'DEGRADED',
    message: firm.dolibarr_url ? 'Dolibarr URL yapılandırılmış' : 'Dolibarr URL yok',
  });

  // Aktif kullanıcı
  const activeUsers = await prisma.user.count({
    where: { firm_id, is_active: true },
  });
  checks.push({
    name: 'active_users',
    status: activeUsers > 0 ? 'HEALTHY' : 'DEGRADED',
    message: `${activeUsers} aktif kullanıcı`,
  });

  // Son 24 saat API istekleri
  const recentRequests = await prisma.apiUsageLog.count({
    where: {
      firm_id,
      created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  });
  checks.push({
    name: 'api_requests_24h',
    status: recentRequests > 0 ? 'HEALTHY' : 'DEGRADED',
    message: `${recentRequests} istek / 24 saat`,
  });

  // Log kaydet
  await prisma.firmHealthLog.create({
    data: {
      firm_id,
      status: overallStatus,
      response_time_ms: 0,
      dolibarr_api_reachable: !!firm.dolibarr_url,
      dolibarr_db_connected: true,
    },
  });

  res.json({
    success: true,
    data: {
      firm_id,
      status: overallStatus,
      checked_at: new Date(),
      checks,
    },
  });
});

/**
 * Sağlık loglarını temizle
 */
export const cleanupHealthLogs = asyncHandler(async (req: Request, res: Response) => {
  const { days = 90, firm_id } = req.body;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - Number(days));

  const where: any = { created_at: { lt: cutoffDate } };
  if (firm_id) where.firm_id = firm_id;

  const result = await prisma.firmHealthLog.deleteMany({ where });

  res.json({
    success: true,
    message: `${result.count} sağlık logu silindi`,
    data: { deleted_count: result.count },
  });
});

// ============================================
// Platform Statistics
// ============================================

/**
 * Detaylı platform istatistikleri
 */
export const getPlatformStatistics = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - Number(days));

  const [
    totalFirms,
    activeFirms,
    totalUsers,
    activeUsers,
    totalApiCalls,
    errorCount,
    avgDuration,
    topFirms,
  ] = await Promise.all([
    prisma.firm.count(),
    prisma.firm.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count(),
    prisma.user.count({ where: { is_active: true } }),
    prisma.apiUsageLog.count({ where: { created_at: { gte: daysAgo } } }),
    prisma.apiUsageLog.count({
      where: {
        created_at: { gte: daysAgo },
        status_code: { gte: 400 },
      },
    }),
    prisma.apiUsageLog.aggregate({
      where: { created_at: { gte: daysAgo } },
      _avg: { duration_ms: true },
    }),
    prisma.apiUsageLog.groupBy({
      by: ['firm_id'],
      where: { created_at: { gte: daysAgo } },
      _count: true,
      orderBy: { _count: { firm_id: 'desc' } },
      take: 10,
    }),
  ]);

  const firmIds = topFirms.map(f => f.firm_id).filter(Boolean);
  const firms = await prisma.firm.findMany({
    where: { id: { in: firmIds as string[] } },
    select: { id: true, name: true },
  });
  const firmMap = new Map(firms.map(f => [f.id, f.name]));

  res.json({
    success: true,
    data: {
      period_days: Number(days),
      summary: {
        total_firms: totalFirms,
        active_firms: activeFirms,
        total_users: totalUsers,
        active_users: activeUsers,
        total_api_calls: totalApiCalls,
        error_count: errorCount,
        error_rate: totalApiCalls > 0 ? (errorCount / totalApiCalls * 100).toFixed(2) : '0',
        avg_response_time_ms: avgDuration._avg.duration_ms || 0,
      },
      top_firms: topFirms.map(f => ({
        firm_id: f.firm_id,
        firm_name: firmMap.get(f.firm_id as string) || 'Bilinmeyen',
        api_calls: f._count,
      })),
    },
  });
});

/**
 * Realtime metrikler
 */
export const getRealtimeMetrics = asyncHandler(async (req: Request, res: Response) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [recentRequests, activeSessions, errorRate] = await Promise.all([
    prisma.apiUsageLog.count({ where: { created_at: { gte: fiveMinutesAgo } } }),
    prisma.session.count({ where: { is_active: true, expires_at: { gt: new Date() } } }),
    prisma.apiUsageLog.aggregate({
      where: {
        created_at: { gte: fiveMinutesAgo },
        status_code: { gte: 400 },
      },
      _count: true,
    }),
  ]);

  const totalRequests = recentRequests;
  const errorCount = errorRate._count;
  const rate = totalRequests > 0 ? (errorCount / totalRequests * 100).toFixed(2) : '0';

  res.json({
    success: true,
    data: {
      timestamp: new Date(),
      requests_last_5min: totalRequests,
      active_sessions: activeSessions,
      error_rate_percent: rate,
      status: parseFloat(rate) < 5 ? 'HEALTHY' : parseFloat(rate) < 20 ? 'DEGRADED' : 'UNHEALTHY',
    },
  });
});

/**
 * Dashboard özet verileri
 */
export const getDashboardData = asyncHandler(async (req: Request, res: Response) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    totalFirms,
    activeFirms,
    todayNewFirms,
    totalUsers,
    todayNewUsers,
    activeUsers,
    openTickets,
    apiCallsToday,
    apiCallsMonth,
    errorsToday,
  ] = await Promise.all([
    prisma.firm.count(),
    prisma.firm.count({ where: { status: 'ACTIVE' } }),
    prisma.firm.count({ where: { created_at: { gte: today } } }),
    prisma.user.count(),
    prisma.user.count({ where: { created_at: { gte: today } } }),
    prisma.user.count({ where: { is_active: true } }),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.apiUsageLog.count({ where: { created_at: { gte: today } } }),
    prisma.apiUsageLog.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
    prisma.apiUsageLog.count({
      where: {
        created_at: { gte: today },
        status_code: { gte: 400 },
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      overview: {
        total_firms: totalFirms,
        active_firms: activeFirms,
        new_firms_today: todayNewFirms,
        total_users: totalUsers,
        new_users_today: todayNewUsers,
        active_users: activeUsers,
      },
      support: { open_tickets: openTickets },
      api: {
        calls_today: apiCallsToday,
        calls_this_month: apiCallsMonth,
        errors_today: errorsToday,
        error_rate_today: apiCallsToday > 0 ? (errorsToday / apiCallsToday * 100).toFixed(2) : '0',
      },
    },
  });
});

/**
 * CSV export
 */
export const exportApiUsageReport = asyncHandler(async (req: Request, res: Response) => {
  const { start_date, end_date, firm_id } = req.query;

  if (!start_date || !end_date) {
    throw new AppError('Başlangıç ve bitiş tarihi gerekli', 400);
  }

  const where: any = {
    created_at: {
      gte: new Date(start_date as string),
      lte: new Date(end_date as string),
    },
  };
  if (firm_id) where.firm_id = firm_id;

  const logs = await prisma.apiUsageLog.findMany({
    where,
    include: { firm: { select: { name: true } } },
    orderBy: { created_at: 'desc' },
    take: 10000,
  });

  const csvHeader = 'Tarih,Firma,Endpoint,Metod,Status,Response Time (ms),IP Adresi\n';
  const csvRows = logs.map(log => [
    log.created_at.toISOString(),
    log.firm?.name || 'N/A',
    log.endpoint,
    log.method,
    log.status_code,
    log.duration_ms,
    log.ip_address || 'N/A',
  ].join(',')).join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="api_usage_${start_date}_${end_date}.csv"`);
  res.send(csvHeader + csvRows);
});