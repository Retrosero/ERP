import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';
import { createDolibarrService } from '../services/dolibarr.service';

/**
 * Otomasyon Controller
 * Zamanlanmış görevler, cron job yönetimi, otomatik işlemler
 */

// ============================================
// Scheduled Tasks - Zamanlanmış Görevler
// ============================================

/**
 * Tüm zamanlanmış görevleri listele
 */
export const listScheduledTasks = asyncHandler(async (req: Request, res: Response) => {
  const { type, is_active, firm_id } = req.query;

  const where: any = {};
  if (type) where.task_type = type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const tasks = await prisma.scheduledTask.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });

  res.json({
    success: true,
    data: tasks,
  });
});

/**
 * Yeni zamanlanmış görev oluştur
 */
export const createScheduledTask = asyncHandler(async (req: Request, res: Response) => {
  const {
    name,
    type,
    cron_expression,
    config,
    firm_id,
    is_active = true,
  } = req.body;

  if (!name || !type || !cron_expression) {
    throw new AppError('Görev adı, tip ve cron ifadesi gerekli', 400);
  }

  if (!isValidCron(cron_expression)) {
    throw new AppError('Geçersiz cron ifadesi', 400);
  }

  const task = await prisma.scheduledTask.create({
    data: {
      name,
      task_type: type,
      cron_expression,
      description: config?.description || null,
      is_active,
    },
  });

  // Log
  await prisma.scheduledTaskLog.create({
    data: {
      task_id: task.id,
      status: 'COMPLETED',
      output: 'Görev oluşturuldu',
    },
  });

  res.status(201).json({
    success: true,
    data: task,
    message: 'Zamanlanmış görev oluşturuldu',
  });
});

/**
 * Zamanlanmış görevi güncelle
 */
export const updateScheduledTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  if (updates.cron_expression && !isValidCron(updates.cron_expression)) {
    throw new AppError('Geçersiz cron ifadesi', 400);
  }

  const task = await prisma.scheduledTask.update({
    where: { id },
    data: updates,
  });

  res.json({
    success: true,
    data: task,
    message: 'Görev güncellendi',
  });
});

/**
 * Zamanlanmış görevi sil
 */
export const deleteScheduledTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.scheduledTaskLog.deleteMany({ where: { task_id: id } });
  await prisma.scheduledTask.delete({ where: { id } });

  res.json({
    success: true,
    message: 'Görev silindi',
  });
});

/**
 * Görevi manuel olarak çalıştır
 */
export const executeTaskNow = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const task = await prisma.scheduledTask.findUnique({ where: { id } });
  if (!task) {
    throw new AppError('Görev bulunamadı', 404);
  }

  const result = await executeTask(task);

  res.json({
    success: true,
    data: result,
    message: 'Görev çalıştırıldı',
  });
});

// ============================================
// Task Types
// ============================================

/**
 * Süresi Dolanları Kontrol Et
 */
export async function checkExpiringItems(): Promise<any> {
  const today = new Date();
  const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

  const results: any = {
    expiring_api_keys: [],
    expiring_modules: [],
    expiring_trials: [],
  };

  const apiKeys = await prisma.apiKey.findMany({
    where: {
      expires_at: { gte: today, lte: sevenDaysLater },
      is_active: true,
    },
    include: { firm: { select: { name: true } } },
  });
  results.expiring_api_keys = apiKeys.map(k => ({
    id: k.id,
    firm: k.firm?.name,
    name: k.name,
    expires_at: k.expires_at,
  }));

  return results;
}

/**
 * Otomatik askıya alma
 */
export async function autoSuspendExpiredFirms(): Promise<any> {
  const today = new Date();
  const results: any = { suspended: [], errors: [] };

  const expiredFirms = await prisma.firm.findMany({
    where: {
      status: { in: ['TRIAL', 'ACTIVE'] },
      OR: [
        { subscription_ends_at: { lt: today } },
        { trial_ends_at: { lt: today, not: null } },
      ],
    },
  });

  for (const firm of expiredFirms) {
    try {
      await prisma.firm.update({
        where: { id: firm.id },
        data: { status: 'SUSPENDED' },
      });
      await prisma.adminLog.create({
        data: {
          admin_id: 'system',
          action: 'AUTO_SUSPEND',
          entity_type: 'firm',
          entity_id: firm.id,
          details: { reason: 'Subscription/trial expired', previous_status: firm.status },
        },
      });
      results.suspended.push({ id: firm.id, name: firm.name });
    } catch (error) {
      results.errors.push({ id: firm.id, error: String(error) });
    }
  }

  return results;
}

/**
 * Session temizleme
 */
export async function cleanupExpiredSessions(): Promise<any> {
  const result = await prisma.session.updateMany({
    where: { is_active: true, expires_at: { lt: new Date() } },
    data: { is_active: false, revoked_at: new Date() },
  });

  return { cleaned: result.count };
}

/**
 * API log temizleme
 */
export async function cleanupApiUsageLogs(days: number = 90): Promise<any> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.apiUsageLog.deleteMany({
    where: { created_at: { lt: cutoff } },
  });

  return { deleted: result.count };
}

/**
 * Health log temizleme
 */
export async function cleanupHealthLogs(days: number = 90): Promise<any> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const result = await prisma.firmHealthLog.deleteMany({
    where: { created_at: { lt: cutoff } },
  });

  return { deleted: result.count };
}

// ============================================
// Task Execution
// ============================================

async function executeTask(task: any): Promise<any> {
  const startTime = Date.now();
  let status: 'COMPLETED' | 'FAILED' = 'COMPLETED';
  let output = '';
  let errorMessage = '';

  try {
    switch (task.task_type) {
      case 'CHECK_EXPIRING_ITEMS':
        output = JSON.stringify(await checkExpiringItems());
        break;
      case 'AUTO_SUSPEND_TRIAL':
        output = JSON.stringify(await autoSuspendExpiredFirms());
        break;
      case 'CLEANUP_SESSIONS':
        output = JSON.stringify(await cleanupExpiredSessions());
        break;
      case 'CLEANUP_API_LOGS':
        output = JSON.stringify(await cleanupApiUsageLogs(task.config?.days || 90));
        break;
      default:
        output = 'Unknown task type';
    }
  } catch (error: any) {
    status = 'FAILED';
    errorMessage = error.message;
  }

  const duration = Date.now() - startTime;

  await prisma.scheduledTaskLog.create({
    data: {
      task_id: task.id,
      status,
      completed_at: new Date(),
      result: status === 'COMPLETED' ? 'Success' : 'Failed',
      error_message: errorMessage || null,
    },
  });

  await prisma.scheduledTask.update({
    where: { id: task.id },
    data: {
      last_run_at: new Date(),
      last_run_status: status,
      last_run_result: output,
    },
  });

  return { status, duration_ms: duration, output, error: errorMessage };
}

// ============================================
// Task Logs
// ============================================

export const listTaskLogs = asyncHandler(async (req: Request, res: Response) => {
  const { task_id, status, page = 1, limit = 50 } = req.query;

  const where: any = {};
  if (task_id) where.task_id = task_id;
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [logs, total] = await Promise.all([
    prisma.scheduledTaskLog.findMany({
      where,
      orderBy: { started_at: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.scheduledTaskLog.count({ where }),
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

// ============================================
// Helper Functions
// ============================================

function isValidCron(cron: string): boolean {
  const parts = cron.trim().split(/\s+/);
  if (parts.length < 5 || parts.length > 6) return false;
  const validPattern = /^(\*|[0-9]{1,2}(,[0-9]{1,2})*|[0-9]{1,2}\-[0-9]{1,2})$/;
  return parts.every(part => validPattern.test(part) || part === '*');
}