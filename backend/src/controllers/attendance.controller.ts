import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';
import { validateBody, validateQuery } from '../middleware/validation.middleware';
import { createDolibarrService } from '../services/dolibarr.service';
import { CheckMethod, AttendanceStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();

// ============================================
// Validation Schemas
// ============================================

const checkInSchema = z.object({
  user_id: z.string().uuid().optional(), // SaaS user_id (opsiyonel)
  dolibarr_user_id: z.number().int().positive().optional(), // Dolibarr user ID
  check_in_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).default('MANUAL'),
  check_in_location: z.string().optional(),
  check_in_latitude: z.number().optional(),
  check_in_longitude: z.number().optional(),
  check_in_address: z.string().optional(),
  notes: z.string().optional(),
});

const checkOutSchema = z.object({
  record_id: z.string().uuid(), // AttendanceRecord ID
  check_out_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).default('MANUAL'),
  check_out_location: z.string().optional(),
  check_out_latitude: z.number().optional(),
  check_out_longitude: z.number().optional(),
  check_out_address: z.string().optional(),
  notes: z.string().optional(),
});

const attendanceQuerySchema = z.object({
  user_id: z.string().uuid().optional(),
  dolibarr_user_id: z.number().int().positive().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  status: z.enum(['PENDING', 'COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

const approveSchema = z.object({
  record_id: z.string().uuid(),
  approved: z.boolean(),
  notes: z.string().optional(),
});

const bulkAttendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih formatı gerekli (YYYY-MM-DD)'),
  entries: z.array(z.object({
    user_id: z.string().min(1, 'Kullanıcı ID gerekli'),
    check_in_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Geçerli datetime formatı gerekli'),
    check_in_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).default('MANUAL'),
    check_out_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/).optional().nullable(),
    check_out_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).optional().nullable(),
  })).min(1, 'En az bir kayıt gerekli'),
});

// ============================================
// Check In - Giriş Kaydı
// ============================================

/**
 * @route POST /api/tenant/attendance/checkin
 * @desc Personel giriş kaydı oluştur
 */
export const checkIn = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = checkInSchema.parse(req.body);

  // Dolibarr user ID'yi belirle
  let dolibarrUserId = validated.dolibarr_user_id;
  let userId = validated.user_id;

  if (!dolibarrUserId && !userId) {
    res.status(400).json({ success: false, error: 'user_id veya dolibarr_user_id gerekli' });
    return;
  }

  // Eğer SaaS user_id verildiyse, Dolibarr ID'yi bul
  if (userId && !dolibarrUserId) {
    const user = await prisma.user.findFirst({
      where: { id: userId, firm_id: firmId },
      select: { dolibarr_user_id: true },
    });
    if (!user?.dolibarr_user_id) {
      res.status(400).json({ success: false, error: 'Kullanıcı için Dolibarr ID bulunamadı' });
      return;
    }
    dolibarrUserId = user.dolibarr_user_id;
  }

  // Bugün için açık bir giriş kaydı var mı kontrol et
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingRecord = await prisma.attendanceRecord.findFirst({
    where: {
      firm_id: firmId,
      user_id: userId || '',
      check_in_time: { gte: today },
      check_out_time: null,
    },
  });

  if (existingRecord) {
    res.status(400).json({
      success: false,
      error: 'Açık bir giriş kaydı mevcut. Önce çıkış yapmalısınız.',
      record_id: existingRecord.id,
    });
    return;
  }

  // Dolibarr'a da kayıt ekle (opsiyonel, module aktifse)
  let dolibarrRecordId: number | null = null;
  try {
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    if (firm?.dolibarr_url) {
      const dolibarr = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key, firmId);
      const now = new Date();
      const dolibarrResult = await dolibarr.createAttendanceRecord({
        fk_user: dolibarrUserId!,
        date_start: now.toISOString().split('T')[0],
        time_start: now.toTimeString().slice(0, 5),
        location: validated.check_in_location,
      });
      if (dolibarrResult.success && dolibarrResult.data?.id) {
        dolibarrRecordId = dolibarrResult.data.id;
      }
    }
  } catch (err) {
    console.error('Dolibarr attendance sync error:', err);
    // Hata olsa da devam et, SaaS tarafında kayıt oluştur
  }

  // SaaS veritabanında kayıt oluştur
  const record = await prisma.attendanceRecord.create({
    data: {
      firm_id: firmId,
      user_id: userId || '',
      dolibarr_user_id: dolibarrUserId || null,
      check_in_time: new Date(),
      check_in_method: validated.check_in_method as CheckMethod,
      check_in_location: validated.check_in_location || null,
      check_in_latitude: validated.check_in_latitude ? new Decimal(validated.check_in_latitude) : null,
      check_in_longitude: validated.check_in_longitude ? new Decimal(validated.check_in_longitude) : null,
      check_in_address: validated.check_in_address || null,
      check_in_ip: req.ip || req.socket.remoteAddress || null,
      check_in_device: req.headers['user-agent'] || null,
      status: AttendanceStatus.PENDING,
      notes: validated.notes || null,
      is_auto_generated: false,
    },
  });

  res.status(201).json({
    success: true,
    message: 'Giriş kaydı oluşturuldu',
    data: {
      id: record.id,
      check_in_time: record.check_in_time,
      check_in_method: record.check_in_method,
      status: record.status,
      dolibarr_record_id: dolibarrRecordId,
    },
  });
});

// ============================================
// Check Out - Çıkış Kaydı
// ============================================

/**
 * @route POST /api/tenant/attendance/checkout
 * @desc Personel çıkış kaydı oluştur
 */
export const checkOut = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = checkOutSchema.parse(req.body);
  const { record_id } = validated;

  // Kaydı bul
  const record = await prisma.attendanceRecord.findFirst({
    where: {
      id: record_id,
      firm_id: firmId,
    },
  });

  if (!record) {
    res.status(404).json({ success: false, error: 'Giriş kaydı bulunamadı' });
    return;
  }

  if (record.check_out_time) {
    res.status(400).json({ success: false, error: 'Bu kayıt için zaten çıkış yapılmış' });
    return;
  }

  const now = new Date();

  // Toplam çalışma saatini hesapla
  let totalHours = 0;
  if (record.check_in_time) {
    const diffMs = now.getTime() - record.check_in_time.getTime();
    totalHours = diffMs / (1000 * 60 * 60);
  }

  // Gece boyunca devam eden kayıt mı?
  const isOvernight = record.check_in_time &&
    record.check_in_time.getDate() !== now.getDate();

  // Dolibarr'a çıkış kaydı ekle
  try {
    const firm = await prisma.firm.findUnique({ where: { id: firmId } });
    if (firm?.dolibarr_url && record.dolibarr_user_id) {
      const dolibarr = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key, firmId);
      // Dolibarr'daki kullanıcı için çıkış kaydı oluştur
      // Not: Dolibarr attendance modülü farklı ID'ler kullanır
      await dolibarr.createAttendanceRecord({
        fk_user: record.dolibarr_user_id,
        date_start: record.check_in_time?.toISOString().split('T')[0] || now.toISOString().split('T')[0],
        time_start: record.check_in_time?.toTimeString().slice(0, 5) || '00:00',
        date_end: now.toISOString().split('T')[0],
        time_end: now.toTimeString().slice(0, 5),
        location: validated.check_out_location,
      });
    }
  } catch (err) {
    console.error('Dolibarr checkout sync error:', err);
  }

  // Kaydı güncelle
  const updated = await prisma.attendanceRecord.update({
    where: { id: record_id },
    data: {
      check_out_time: now,
      check_out_method: validated.check_out_method as CheckMethod,
      check_out_location: validated.check_out_location || null,
      check_out_latitude: validated.check_out_latitude ? new Decimal(validated.check_out_latitude) : null,
      check_out_longitude: validated.check_out_longitude ? new Decimal(validated.check_out_longitude) : null,
      check_out_address: validated.check_out_address || null,
      check_out_ip: req.ip || req.socket.remoteAddress || null,
      check_out_device: req.headers['user-agent'] || null,
      total_hours: new Decimal(totalHours.toFixed(2)),
      is_overnight: isOvernight,
      status: AttendanceStatus.COMPLETED,
      notes: validated.notes || record.notes,
    },
  });

  res.json({
    success: true,
    message: 'Çıkış kaydı oluşturuldu',
    data: {
      id: updated.id,
      check_in_time: updated.check_in_time,
      check_out_time: updated.check_out_time,
      total_hours: updated.total_hours,
      status: updated.status,
    },
  });
});

// ============================================
// Quick Check Out - Hızlı Çıkış (son açık kaydı bul)
// ============================================

/**
 * @route POST /api/tenant/attendance/quick-checkout
 * @desc Son açık giriş kaydına çıkış yap
 */
export const quickCheckOut = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;
  const userId = (req as any).user?.id;

  if (!firmId || !userId) {
    res.status(401).json({ success: false, error: 'Yetkilendirme hatası' });
    return;
  }

  // Kullanıcının açık kaydını bul
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const openRecord = await prisma.attendanceRecord.findFirst({
    where: {
      firm_id: firmId,
      user_id: userId,
      check_in_time: { gte: today },
      check_out_time: null,
    },
  });

  if (!openRecord) {
    res.status(404).json({ success: false, error: 'Açık giriş kaydı bulunamadı' });
    return;
  }

  const now = new Date();
  let totalHours = 0;
  if (openRecord.check_in_time) {
    const diffMs = now.getTime() - openRecord.check_in_time.getTime();
    totalHours = diffMs / (1000 * 60 * 60);
  }

  const isOvernight = openRecord.check_in_time &&
    openRecord.check_in_time.getDate() !== now.getDate();

  const updated = await prisma.attendanceRecord.update({
    where: { id: openRecord.id },
    data: {
      check_out_time: now,
      check_out_method: CheckMethod.MANUAL,
      check_out_ip: req.ip || req.socket.remoteAddress || null,
      check_out_device: req.headers['user-agent'] || null,
      total_hours: new Decimal(totalHours.toFixed(2)),
      is_overnight: isOvernight,
      status: AttendanceStatus.COMPLETED,
    },
  });

  res.json({
    success: true,
    message: 'Çıkış kaydı oluşturuldu',
    data: {
      id: updated.id,
      check_in_time: updated.check_in_time,
      check_out_time: updated.check_out_time,
      total_hours: updated.total_hours,
      status: updated.status,
    },
  });
});

// ============================================
// List Attendance Records - Kayıtları Listele
// ============================================

/**
 * @route GET /api/tenant/attendance
 * @desc Personel giriş-çıkış kayıtlarını listele
 */
export const listAttendance = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = attendanceQuerySchema.parse(req.query);
  const { user_id, dolibarr_user_id, start_date, end_date, status, page, limit } = validated;

  const where: any = { firm_id: firmId };

  if (user_id) where.user_id = user_id;
  if (dolibarr_user_id) where.dolibarr_user_id = dolibarr_user_id;
  if (status) where.status = status;

  if (start_date || end_date) {
    where.check_in_time = {};
    if (start_date) where.check_in_time.gte = new Date(start_date);
    if (end_date) where.check_in_time.lte = new Date(end_date + 'T23:59:59.999Z');
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { check_in_time: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  // Kullanıcı bilgilerini çek
  const userIds = [...new Set(records.map(r => r.user_id).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, surname: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  res.json({
    success: true,
    data: {
      records: records.map(r => ({
        id: r.id,
        user: r.user_id ? userMap.get(r.user_id) || null : null,
        dolibarr_user_id: r.dolibarr_user_id,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        total_hours: r.total_hours,
        status: r.status,
        check_in_method: r.check_in_method,
        check_out_method: r.check_out_method,
        check_in_location: r.check_in_location,
        check_out_location: r.check_out_location,
        is_overnight: r.is_overnight,
        notes: r.notes,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    },
  });
});

// ============================================
// Get Today's Attendance - Bugünkü Durum
// ============================================

/**
 * @route GET /api/tenant/attendance/today
 * @desc Bugünkü giriş-çıkış durumunu getir
 */
export const getTodayAttendance = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Bugünkü kayıtları al
  const records = await prisma.attendanceRecord.findMany({
    where: {
      firm_id: firmId,
      check_in_time: { gte: today, lt: tomorrow },
    },
    orderBy: { check_in_time: 'desc' },
  });

  // Kullanıcı bilgilerini çek
  const userIds = [...new Set(records.map(r => r.user_id).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, surname: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  // İstatistikler
  const checkedIn = records.filter(r => !r.check_out_time).length;
  const checkedOut = records.filter(r => r.check_out_time).length;
  const late = records.filter(r => {
    // 09:00'dan sonra giriş yapanlar geç sayılır (örnek)
    if (!r.check_in_time) return false;
    const hour = r.check_in_time.getHours();
    return hour >= 9;
  }).length;

  res.json({
    success: true,
    data: {
      records: records.map(r => ({
        id: r.id,
        user: r.user_id ? userMap.get(r.user_id) || null : null,
        dolibarr_user_id: r.dolibarr_user_id,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        total_hours: r.total_hours,
        status: r.status,
        check_in_method: r.check_in_method,
        check_out_method: r.check_out_method,
        check_in_location: r.check_in_location,
        check_out_location: r.check_out_location,
      })),
      stats: {
        total_records: records.length,
        checked_in: checkedIn,
        checked_out: checkedOut,
        late_arrivals: late,
      },
    },
  });
});

// ============================================
// Get User Attendance - Kullanıcının Kayıtları
// ============================================

/**
 * @route GET /api/tenant/attendance/user/:userId
 * @desc Belirli kullanıcının giriş-çıkış kayıtlarını getir
 */
export const getUserAttendance = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;
  const { userId } = req.params;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const { start_date, end_date, page = 1, limit = 20 } = req.query;

  const where: any = {
    firm_id: firmId,
    user_id: userId,
  };

  if (start_date || end_date) {
    where.check_in_time = {};
    if (start_date) where.check_in_time.gte = new Date(start_date as string);
    if (end_date) where.check_in_time.lte = new Date(end_date as string + 'T23:59:59.999Z');
  }

  const [records, total] = await Promise.all([
    prisma.attendanceRecord.findMany({
      where,
      orderBy: { check_in_time: 'desc' },
      skip: ((Number(page) - 1) * Number(limit)),
      take: Number(limit),
    }),
    prisma.attendanceRecord.count({ where }),
  ]);

  // Toplam saat hesapla
  const totalHours = records.reduce((sum, r) => {
    return sum + (r.total_hours ? parseFloat(r.total_hours.toString()) : 0);
  }, 0);

  res.json({
    success: true,
    data: {
      records: records.map(r => ({
        id: r.id,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        total_hours: r.total_hours,
        status: r.status,
        check_in_method: r.check_in_method,
        check_out_method: r.check_out_method,
        check_in_location: r.check_in_location,
        check_out_location: r.check_out_location,
        is_overnight: r.is_overnight,
        notes: r.notes,
      })),
      summary: {
        total_records: total,
        total_hours: totalHours.toFixed(2),
        average_hours: total > 0 ? (totalHours / total).toFixed(2) : '0.00',
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

// ============================================
// Approve/Reject Attendance - Onayla/Reddet
// ============================================

/**
 * @route POST /api/tenant/attendance/approve
 * @desc Giriş-çıkış kaydını onayla veya reddet
 */
export const approveAttendance = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;
  const adminId = (req as any).user?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = approveSchema.parse(req.body);
  const { record_id, approved, notes } = validated;

  const record = await prisma.attendanceRecord.findFirst({
    where: { id: record_id, firm_id: firmId },
  });

  if (!record) {
    res.status(404).json({ success: false, error: 'Kayıt bulunamadı' });
    return;
  }

  const updated = await prisma.attendanceRecord.update({
    where: { id: record_id },
    data: {
      status: approved ? AttendanceStatus.APPROVED : AttendanceStatus.REJECTED,
      approved_by: adminId,
      approved_at: new Date(),
      notes: notes || record.notes,
    },
  });

  res.json({
    success: true,
    message: approved ? 'Kayıt onaylandı' : 'Kayıt reddedildi',
    data: {
      id: updated.id,
      status: updated.status,
      approved_by: updated.approved_by,
      approved_at: updated.approved_at,
    },
  });
});

// ============================================
// Get Attendance Summary - Özet Rapor
// ============================================

/**
 * @route GET /api/tenant/attendance/summary
 * @desc Çalışma özet raporunu getir
 */
export const getAttendanceSummary = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const {
    user_id,
    start_date,
    end_date,
    period = 'month'
  } = req.query;

  // Tarih aralığını hesapla
  const now = new Date();
  let periodStart: Date;
  let periodEnd: Date;

  switch (period) {
    case 'week':
      periodStart = new Date(now);
      periodStart.setDate(now.getDate() - 7);
      periodEnd = now;
      break;
    case 'month':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = now;
      break;
    case 'year':
      periodStart = new Date(now.getFullYear(), 0, 1);
      periodEnd = now;
      break;
    default:
      periodStart = start_date ? new Date(start_date as string) : new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = end_date ? new Date(end_date as string) : now;
  }

  const where: any = {
    firm_id: firmId,
    check_in_time: { gte: periodStart, lte: periodEnd },
    status: { in: ['COMPLETED', 'APPROVED'] },
  };

  if (user_id) where.user_id = user_id;

  const records = await prisma.attendanceRecord.findMany({
    where,
    orderBy: { check_in_time: 'desc' },
  });

  // Kullanıcı bilgilerini çek
  const userIds = [...new Set(records.map(r => r.user_id).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, surname: true },
  });
  const userMap = new Map(users.map(u => [u.id, u]));

  // İstatistikler
  const totalHours = records.reduce((sum, r) => {
    return sum + (r.total_hours ? parseFloat(r.total_hours.toString()) : 0);
  }, 0);

  const totalOvertime = records.reduce((sum, r) => {
    return sum + (r.overtime_hours ? parseFloat(r.overtime_hours.toString()) : 0);
  }, 0);

  res.json({
    success: true,
    data: {
      period: {
        start: periodStart,
        end: periodEnd,
        label: `${periodStart.toLocaleDateString('tr-TR')} - ${periodEnd.toLocaleDateString('tr-TR')}`,
      },
      summary: {
        total_records: records.length,
        total_hours: totalHours.toFixed(2),
        total_overtime: totalOvertime.toFixed(2),
        average_hours: records.length > 0 ? (totalHours / records.length).toFixed(2) : '0.00',
        users_count: userIds.length,
      },
      by_user: Object.entries(
        records.reduce((acc, r) => {
          const key = r.user_id || 'unknown';
          if (!acc[key]) acc[key] = { records: 0, hours: 0 };
          acc[key].records++;
          acc[key].hours += r.total_hours ? parseFloat(r.total_hours.toString()) : 0;
          return acc;
        }, {} as Record<string, { records: number; hours: number }>)
      ).map(([uid, data]) => ({
        user: userMap.get(uid) || null,
        user_id: uid,
        records_count: data.records,
        total_hours: data.hours.toFixed(2),
      })),
    },
  });
});

// ============================================
// Bulk Attendance - Toplu Giriş-Çıkış
// ============================================

/**
 * @route POST /api/tenant/attendance/bulk
 * @desc Toplu giriş-çıkış kayıtları oluştur
 */
export const bulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = bulkAttendanceSchema.parse(req.body);
  const { date, entries } = validated;

  const results: { user_id: string; success: boolean; record_id?: string; error?: string }[] = [];

  // Her kayıt için işlem yap
  for (const entry of entries) {
    try {
      // Kullanıcının dolibarr_user_id'sini bul
      const user = await prisma.user.findFirst({
        where: { id: entry.user_id, firm_id: firmId },
        select: { dolibarr_user_id: true },
      });

      const dolibarrUserId = user?.dolibarr_user_id || null;
      const checkInTime = new Date(entry.check_in_time);

      // Çıkış saati varsa hesapla
      let checkOutTime: Date | null = null;
      let totalHours: Decimal | null = null;
      let isOvernight = false;

      if (entry.check_out_time) {
        checkOutTime = new Date(entry.check_out_time);
        const diffMs = checkOutTime.getTime() - checkInTime.getTime();
        totalHours = new Decimal((diffMs / (1000 * 60 * 60)).toFixed(2));
        isOvernight = checkInTime.getDate() !== checkOutTime.getDate();
      }

      // Kayıt oluştur
      const record = await prisma.attendanceRecord.create({
        data: {
          firm_id: firmId,
          user_id: entry.user_id,
          dolibarr_user_id: dolibarrUserId,
          check_in_time: checkInTime,
          check_in_method: entry.check_in_method as CheckMethod,
          check_out_time: checkOutTime,
          check_out_method: (entry.check_out_method as CheckMethod) || null,
          total_hours: totalHours,
          is_overnight: isOvernight,
          is_auto_generated: true, // Toplu kayıt olduğunu işaretle
          status: checkOutTime ? AttendanceStatus.COMPLETED : AttendanceStatus.PENDING,
        },
      });

      results.push({
        user_id: entry.user_id,
        success: true,
        record_id: record.id,
      });
    } catch (err) {
      console.error(`Bulk attendance error for user ${entry.user_id}:`, err);
      results.push({
        user_id: entry.user_id,
        success: false,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  res.status(201).json({
    success: true,
    message: `${successCount} kayıt oluşturuldu${failCount > 0 ? `, ${failCount} kayıt başarısız` : ''}`,
    data: {
      results,
      summary: {
        total: entries.length,
        success: successCount,
        failed: failCount,
      },
    },
  });
});

// ============================================
// Bulk Check In - Toplu Giriş (Sadece Giriş)
// ============================================

const bulkCheckInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih formatı gerekli (YYYY-MM-DD)'),
  entries: z.array(z.object({
    user_id: z.string().min(1, 'Kullanıcı ID gerekli'),
    check_in_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Geçerli datetime formatı gerekli'),
    check_in_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).default('MANUAL'),
  })).min(1, 'En az bir kayıt gerekli'),
});

/**
 * @route POST /api/tenant/attendance/bulk-checkin
 * @desc Toplu giriş kayıtları oluştur
 */
export const bulkCheckIn = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = bulkCheckInSchema.parse(req.body);
  const { date, entries } = validated;

  const results: { user_id: string; success: boolean; record_id?: string; error?: string }[] = [];

  for (const entry of entries) {
    try {
      const user = await prisma.user.findFirst({
        where: { id: entry.user_id, firm_id: firmId },
        select: { dolibarr_user_id: true },
      });

      const dolibarrUserId = user?.dolibarr_user_id || null;
      const checkInTime = new Date(entry.check_in_time);

      const record = await prisma.attendanceRecord.create({
        data: {
          firm_id: firmId,
          user_id: entry.user_id,
          dolibarr_user_id: dolibarrUserId,
          check_in_time: checkInTime,
          check_in_method: entry.check_in_method as CheckMethod,
          is_auto_generated: true,
          status: AttendanceStatus.PENDING,
        },
      });

      results.push({
        user_id: entry.user_id,
        success: true,
        record_id: record.id,
      });
    } catch (err) {
      console.error(`Bulk check-in error for user ${entry.user_id}:`, err);
      results.push({
        user_id: entry.user_id,
        success: false,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  res.status(201).json({
    success: true,
    message: `${successCount} giriş kaydı oluşturuldu${failCount > 0 ? `, ${failCount} kayıt başarısız` : ''}`,
    data: {
      results,
      summary: {
        total: entries.length,
        success: successCount,
        failed: failCount,
      },
    },
  });
});

// ============================================
// Bulk Check Out - Toplu Çıkış (Sadece Çıkış)
// ============================================

const bulkCheckOutSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Geçerli bir tarih formatı gerekli (YYYY-MM-DD)'),
  entries: z.array(z.object({
    user_id: z.string().min(1, 'Kullanıcı ID gerekli'),
    check_out_time: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/, 'Geçerli datetime formatı gerekli'),
    check_out_method: z.enum(['MANUAL', 'QR_CODE', 'RFID', 'BIOMETRIC', 'GPS', 'MOBILE_APP', 'WEB_PORTAL']).default('MANUAL'),
  })).min(1, 'En az bir kayıt gerekli'),
});

/**
 * @route POST /api/tenant/attendance/bulk-checkout
 * @desc Toplu çıkış kayıtları oluştur (mevcut girişlere çıkış ekle)
 */
export const bulkCheckOut = asyncHandler(async (req: Request, res: Response) => {
  const firmId = (req as any).firm?.id;

  if (!firmId) {
    res.status(401).json({ success: false, error: 'Firma bulunamadı' });
    return;
  }

  const validated = bulkCheckOutSchema.parse(req.body);
  const { date, entries } = validated;

  const results: { user_id: string; success: boolean; record_id?: string; error?: string }[] = [];

  for (const entry of entries) {
    try {
      // Kullanıcının o günkü açık giriş kaydını bul
      const checkOutTime = new Date(entry.check_out_time);
      const dayStart = new Date(date + 'T00:00:00.000Z');
      const dayEnd = new Date(date + 'T23:59:59.999Z');

      const openRecord = await prisma.attendanceRecord.findFirst({
        where: {
          firm_id: firmId,
          user_id: entry.user_id,
          check_in_time: { gte: dayStart, lte: dayEnd },
          check_out_time: null,
        },
      });

      if (!openRecord) {
        results.push({
          user_id: entry.user_id,
          success: false,
          error: 'Açık giriş kaydı bulunamadı',
        });
        continue;
      }

      // Toplam saat hesapla
      let totalHours: Decimal | null = null;
      if (openRecord.check_in_time) {
        const diffMs = checkOutTime.getTime() - openRecord.check_in_time.getTime();
        totalHours = new Decimal((diffMs / (1000 * 60 * 60)).toFixed(2));
      }

      const isOvernight = openRecord.check_in_time &&
        openRecord.check_in_time.getDate() !== checkOutTime.getDate();

      const updated = await prisma.attendanceRecord.update({
        where: { id: openRecord.id },
        data: {
          check_out_time: checkOutTime,
          check_out_method: entry.check_out_method as CheckMethod,
          total_hours: totalHours,
          is_overnight: isOvernight,
          status: AttendanceStatus.COMPLETED,
        },
      });

      results.push({
        user_id: entry.user_id,
        success: true,
        record_id: updated.id,
      });
    } catch (err) {
      console.error(`Bulk check-out error for user ${entry.user_id}:`, err);
      results.push({
        user_id: entry.user_id,
        success: false,
        error: err instanceof Error ? err.message : 'Bilinmeyen hata',
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  res.status(201).json({
    success: true,
    message: `${successCount} çıkış kaydı oluşturuldu${failCount > 0 ? `, ${failCount} kayıt başarısız` : ''}`,
    data: {
      results,
      summary: {
        total: entries.length,
        success: successCount,
        failed: failCount,
      },
    },
  });
});

export default router;