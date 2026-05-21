import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import config from '../config';
import { createToken, superAdminAuth } from '../middleware/auth.middleware';
import { asyncHandler, AppError } from '../middleware/validation.middleware';
import { CreateFirmInput, UpdateFirmInput, FirmWithModules } from '../types';
import { generateApiKey, createDolibarrService } from '../services/dolibarr.service';
import { PLAN_FEATURES } from '../types';

// ============================================
// Super Admin Auth
// ============================================

/**
 * Super Admin Login
 */
export const superAdminLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const admin = await prisma.superAdmin.findUnique({
    where: { email },
  });

  if (!admin) {
    throw new AppError('Geçersiz e-posta veya şifre', 401);
  }

  if (!admin.is_active) {
    throw new AppError('Hesap askıya alınmış', 403);
  }

  const isValidPassword = await bcrypt.compare(password, admin.password);
  if (!isValidPassword) {
    throw new AppError('Geçersiz e-posta veya şifre', 401);
  }

  // Login log
  await prisma.adminLog.create({
    data: {
      admin_id: admin.id,
      action: 'LOGIN',
      ip_address: req.ip,
    },
  });

  // Token oluştur
  const token = createToken({
    sub: admin.id,
    firmId: null,
    email: admin.email,
    role: 'SUPER_ADMIN',
    type: 'access',
  });

  res.json({
    success: true,
    data: {
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    },
  });
});

/**
 * Super Admin Profile
 */
export const getSuperAdminProfile = asyncHandler(async (req: Request, res: Response) => {
  (req as any).user = await superAdminAuth(req as any, res, () => {});

  const admin = await prisma.superAdmin.findUnique({
    where: { id: (req as any).user.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      is_active: true,
      created_at: true,
    },
  });

  res.json({
    success: true,
    data: admin,
  });
});

// ============================================
// Firm Management
// ============================================

/**
 * List all firms
 */
export const listFirms = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    plan,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { short_name: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status) where.status = status;
  if (plan) where.plan = plan;

  const [firms, total] = await Promise.all([
    prisma.firm.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy as string]: sortOrder },
      include: {
        _count: {
          select: { users: true, modules: true },
        },
      },
    }),
    prisma.firm.count({ where }),
  ]);

  res.json({
    success: true,
    data: firms.map(firm => ({
      ...firm,
      user_count: firm._count.users,
      module_count: firm._count.modules,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / take),
    },
  });
});

/**
 * Get single firm details
 */
export const getFirm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const firm = await prisma.firm.findUnique({
    where: { id },
    include: {
      modules: true,
      users: {
        select: {
          id: true,
          email: true,
          name: true,
          surname: true,
          role: true,
          is_active: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        take: 10,
      },
      api_keys: {
        where: { is_active: true },
        select: {
          id: true,
          name: true,
          key_prefix: true,
          permissions: true,
          expires_at: true,
          last_used_at: true,
        },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'VIEW_FIRM',
      entity_type: 'firm',
      entity_id: id,
    },
  });

  res.json({
    success: true,
    data: {
      ...firm,
      user_count: firm._count.users,
      modules: firm.modules.map(m => ({
        module: m.module,
        is_active: m.is_active,
        expires_at: m.expires_at,
        is_trial: m.is_trial,
        trial_ends_at: m.trial_ends_at,
      })),
    },
  });
});

/**
 * Create new firm
 */
export const createFirm = asyncHandler(async (req: Request, res: Response) => {
  const input: CreateFirmInput = req.body;

  // Email unique kontrolü
  const existing = await prisma.firm.findUnique({
    where: { email: input.email },
  });

  if (existing) {
    throw new AppError('Bu e-posta adresi zaten kullanılıyor', 400);
  }

  // Short name unique kontrolü
  if (input.short_name) {
    const shortExists = await prisma.firm.findFirst({
      where: { short_name: input.short_name },
    });
    if (shortExists) {
      throw new AppError('Bu kısa isim zaten kullanılıyor', 400);
    }
  }

  // Subdomain unique kontrolü
  if (input.subdomain) {
    const subdomainExists = await prisma.firm.findUnique({
      where: { subdomain: input.subdomain },
    });
    if (subdomainExists) {
      throw new AppError('Bu subdomain zaten kullanılıyor', 400);
    }
  }

  // Dolibarr bağlantı testi
  // TODO: Dolibarr bağlantısını test et

  const firm = await prisma.firm.create({
    data: {
      name: input.name,
      short_name: input.short_name,
      email: input.email,
      phone: input.phone,
      tax_id: input.tax_id,
      address: input.address,
      dolibarr_url: input.dolibarr_url,
      dolibarr_api_key: input.dolibarr_api_key,
      plan: (input.plan || 'STARTER') as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
      subdomain: input.subdomain,
      status: 'PENDING',
      trial_starts_at: new Date(),
      trial_ends_at: new Date(Date.now() + config.trial.defaultDays * 24 * 60 * 60 * 1000),
    },
  });

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'CREATE_FIRM',
      entity_type: 'firm',
      entity_id: firm.id,
      details: { name: firm.name, plan: firm.plan },
    },
  });

  res.status(201).json({
    success: true,
    data: firm,
    message: 'Firma başarıyla oluşturuldu',
  });
});

/**
 * Update firm
 */
export const updateFirm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const input: UpdateFirmInput = req.body;

  const existing = await prisma.firm.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError('Firma bulunamadı', 404);
  }

  const firm = await prisma.firm.update({
    where: { id },
    data: {
      name: input.name,
      short_name: input.short_name,
      email: input.email,
      phone: input.phone,
      tax_id: input.tax_id,
      address: input.address,
      dolibarr_url: input.dolibarr_url,
      dolibarr_api_key: input.dolibarr_api_key,
      plan: input.plan as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | undefined,
      status: input.status as 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | undefined,
      max_users: input.max_users,
      max_storage_gb: input.max_storage_gb,
      subdomain: input.subdomain,
      // Özel işlemler için
      ...(input.status === 'ACTIVE' && !existing.subscription_starts_at && {
        subscription_starts_at: new Date(),
      }),
    },
  });

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'UPDATE_FIRM',
      entity_type: 'firm',
      entity_id: id,
      details: JSON.parse(JSON.stringify(input)),
    },
  });

  res.json({
    success: true,
    data: firm,
    message: 'Firma başarıyla güncellendi',
  });
});

/**
 * Delete firm
 */
export const deleteFirm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const firm = await prisma.firm.findUnique({
    where: { id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  await prisma.firm.delete({
    where: { id },
  });

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'DELETE_FIRM',
      entity_type: 'firm',
      entity_id: id,
      details: { name: firm.name },
    },
  });

  res.json({
    success: true,
    message: 'Firma başarıyla silindi',
  });
});

/**
 * Suspend firm
 */
export const suspendFirm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const firm = await prisma.firm.update({
    where: { id },
    data: { status: 'SUSPENDED' },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'SUSPEND_FIRM',
      entity_type: 'firm',
      entity_id: id,
    },
  });

  res.json({
    success: true,
    data: firm,
    message: 'Firma askıya alındı',
  });
});

/**
 * Reactivate firm
 */
export const reactivateFirm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const firm = await prisma.firm.update({
    where: { id },
    data: { status: 'ACTIVE' },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'REACTIVATE_FIRM',
      entity_type: 'firm',
      entity_id: id,
    },
  });

  res.json({
    success: true,
    data: firm,
    message: 'Firma tekrar aktif edildi',
  });
});

// ============================================
// Module Management
// ============================================

/**
 * Activate module for firm
 */
export const activateModule = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, module, duration_days, is_trial } = req.body;

  const firm = await prisma.firm.findUnique({
    where: { id: firm_id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Plan kontrolü
  const planModules = PLAN_FEATURES[firm.plan]?.modules || [];
  if (!planModules.includes(module)) {
    throw new AppError(`${module} modülü ${firm.plan} planında bulunmuyor`, 403);
  }

  // Süre hesapla
  const expires_at = duration_days
    ? new Date(Date.now() + duration_days * 24 * 60 * 60 * 1000)
    : null;

  const trial_ends_at = is_trial
    ? new Date(Date.now() + config.trial.defaultDays * 24 * 60 * 60 * 1000)
    : null;

  const permission = await prisma.modulePermission.upsert({
    where: {
      firm_id_module: {
        firm_id,
        module: module as any,
      },
    },
    update: {
      is_active: true,
      expires_at,
      is_trial: is_trial || false,
      trial_ends_at,
    },
    create: {
      firm_id,
      module: module as any,
      is_active: true,
      expires_at,
      is_trial: is_trial || false,
      trial_ends_at,
    },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'ACTIVATE_MODULE',
      entity_type: 'module_permission',
      entity_id: permission.id,
      details: { firm_id, module, is_trial, duration_days },
    },
  });

  res.json({
    success: true,
    data: permission,
    message: `${module} modülü aktifleştirildi`,
  });
});

/**
 * Deactivate module for firm
 */
export const deactivateModule = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, module } = req.body;

  const permission = await prisma.modulePermission.update({
    where: {
      firm_id_module: {
        firm_id,
        module: module as any,
      },
    },
    data: {
      is_active: false,
    },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'DEACTIVATE_MODULE',
      entity_type: 'module_permission',
      entity_id: permission.id,
      details: { firm_id, module },
    },
  });

  res.json({
    success: true,
    message: `${module} modülü deaktifleştirildi`,
  });
});

/**
 * Get firm's active modules
 */
export const getFirmModules = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;

  const modules = await prisma.modulePermission.findMany({
    where: { firm_id },
    orderBy: { module: 'asc' },
  });

  res.json({
    success: true,
    data: modules,
  });
});

// ============================================
// User Management
// ============================================

/**
 * Create user for firm
 */
export const createFirmUser = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;
  const { email, password, name, surname, phone, role } = req.body;

  const firm = await prisma.firm.findUnique({
    where: { id: firm_id },
    include: { _count: { select: { users: true } } },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Kullanıcı limiti kontrolü
  if (firm._count.users >= firm.max_users) {
    throw new AppError(`Kullanıcı limiti aşıldı (${firm.max_users}/${firm.max_users})`, 400);
  }

  // Email unique kontrolü
  const existing = await prisma.user.findUnique({
    where: { firm_id_email: { firm_id, email } },
  });

  if (existing) {
    throw new AppError('Bu e-posta adresi firmada zaten kullanılıyor', 400);
  }

  // Şifreyi hashle
  const hashedPassword = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      firm_id,
      email,
      password: hashedPassword,
      name,
      surname,
      phone,
      role: role || 'USER',
    },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'CREATE_USER',
      entity_type: 'user',
      entity_id: user.id,
      details: { firm_id, email, role },
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: user.id,
      email: user.email,
      name: user.name,
      surname: user.surname,
      role: user.role,
    },
    message: 'Kullanıcı başarıyla oluşturuldu',
  });
});

/**
 * List firm's users
 */
export const listFirmUsers = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;
  const { page = 1, limit = 20, search, role, is_active } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = { firm_id };
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (role) where.role = role;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        phone: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============================================
// API Keys
// ============================================

/**
 * Create API key for firm
 */
export const createApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;
  const { name, permissions, expires_at } = req.body;

  const firm = await prisma.firm.findUnique({
    where: { id: firm_id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  const { key, keyHash, keyPrefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      firm_id,
      name,
      key: keyHash,
      key_prefix: keyPrefix,
      permissions,
      expires_at: expires_at ? new Date(expires_at) : null,
    },
  });

  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'CREATE_API_KEY',
      entity_type: 'api_key',
      entity_id: apiKey.id,
      details: { firm_id, name },
    },
  });

  res.status(201).json({
    success: true,
    data: {
      ...apiKey,
      key, // Sadece oluşturulduğunda göster
    },
    message: 'API key oluşturuldu. Key\'i güvenli bir yerde saklayın!',
  });
});

/**
 * Revoke API key
 */
export const revokeApiKey = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.apiKey.update({
    where: { id },
    data: { is_active: false },
  });

  res.json({
    success: true,
    message: 'API key iptal edildi',
  });
});

// ============================================
// Statistics & Dashboard
// ============================================

/**
 * Get platform statistics
 */
export const getPlatformStats = asyncHandler(async (req: Request, res: Response) => {
  const [
    totalFirms,
    activeFirms,
    trialFirms,
    suspendedFirms,
    totalUsers,
    moduleCount,
    recentFirms,
    subscriptionLogs,
  ] = await Promise.all([
    prisma.firm.count(),
    prisma.firm.count({ where: { status: 'ACTIVE' } }),
    prisma.firm.count({ where: { status: 'TRIAL' } }),
    prisma.firm.count({ where: { status: 'SUSPENDED' } }),
    prisma.user.count(),
    prisma.modulePermission.count({ where: { is_active: true } }),
    prisma.firm.findMany({
      orderBy: { created_at: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        status: true,
        created_at: true,
      },
    }),
    prisma.subscriptionLog.findMany({
      orderBy: { created_at: 'desc' },
      take: 20,
    }),
  ]);

  // Plan dağılımı
  const planDistribution = await prisma.firm.groupBy({
    by: ['plan'],
    _count: true,
  });

  res.json({
    success: true,
    data: {
      overview: {
        total_firms: totalFirms,
        active_firms: activeFirms,
        trial_firms: trialFirms,
        suspended_firms: suspendedFirms,
        total_users: totalUsers,
        active_modules: moduleCount,
      },
      plan_distribution: planDistribution.map(p => ({
        plan: p.plan,
        count: p._count,
      })),
      recent_firms: recentFirms,
      recent_activity: subscriptionLogs,
    },
  });
});

// ============================================
// Admin Logs
// ============================================

/**
 * Get admin activity logs
 */
export const getAdminLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 50, admin_id, action } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (admin_id) where.admin_id = admin_id;
  if (action) where.action = action;

  const [logs, total] = await Promise.all([
    prisma.adminLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
      include: {
        admin: {
          select: { email: true, name: true },
        },
      },
    }),
    prisma.adminLog.count({ where }),
  ]);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

// ============================================
// Expiring Items - Süresi Dolanlar
// ============================================

/**
 * Süresi dolmak üzere olan kalemleri listele
 */
export const getExpiringItems = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30, type } = req.query;
  const daysToExpire = Number(days);
  const now = new Date();
  const futureDate = new Date(now.getTime() + daysToExpire * 24 * 60 * 60 * 1000);

  const results: any[] = [];

  // API Key'ler
  if (!type || type === 'API_KEY') {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        expires_at: {
          gte: now,
          lte: futureDate,
        },
        is_active: true,
      },
      include: {
        firm: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expires_at: 'asc' },
    });

    for (const key of apiKeys) {
      const daysRemaining = Math.ceil((key.expires_at!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      results.push({
        type: 'API_KEY',
        item_id: key.id,
        item_name: key.name,
        firm_id: key.firm_id,
        firm_name: key.firm.name,
        expires_at: key.expires_at,
        days_remaining: daysRemaining,
        status: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'warning' : 'normal',
      });
    }
  }

  // Modül Lisansları
  if (!type || type === 'MODULE_LICENSE') {
    const modules = await prisma.modulePermission.findMany({
      where: {
        expires_at: {
          gte: now,
          lte: futureDate,
        },
        is_active: true,
      },
      include: {
        firm: {
          select: { id: true, name: true },
        },
      },
      orderBy: { expires_at: 'asc' },
    });

    for (const mod of modules) {
      const daysRemaining = Math.ceil((mod.expires_at!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      results.push({
        type: 'MODULE_LICENSE',
        item_id: mod.id,
        item_name: mod.module,
        firm_id: mod.firm_id,
        firm_name: mod.firm.name,
        expires_at: mod.expires_at,
        days_remaining: daysRemaining,
        status: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'warning' : 'normal',
      });
    }
  }

  // Trial süreleri
  if (!type || type === 'TRIAL_PERIOD') {
    const trials = await prisma.firm.findMany({
      where: {
        trial_ends_at: {
          gte: now,
          lte: futureDate,
        },
        status: 'TRIAL',
      },
      orderBy: { trial_ends_at: 'asc' },
    });

    for (const firm of trials) {
      const daysRemaining = Math.ceil((firm.trial_ends_at!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      results.push({
        type: 'TRIAL_PERIOD',
        item_id: firm.id,
        item_name: firm.name,
        firm_id: firm.id,
        firm_name: firm.name,
        expires_at: firm.trial_ends_at,
        days_remaining: daysRemaining,
        status: daysRemaining <= 3 ? 'critical' : daysRemaining <= 7 ? 'warning' : 'normal',
      });
    }
  }

  // Abonelik bitişleri
  if (!type || type === 'SUBSCRIPTION') {
    const subscriptions = await prisma.firm.findMany({
      where: {
        subscription_ends_at: {
          gte: now,
          lte: futureDate,
        },
        status: 'ACTIVE',
      },
      orderBy: { subscription_ends_at: 'asc' },
    });

    for (const firm of subscriptions) {
      const daysRemaining = Math.ceil((firm.subscription_ends_at!.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
      results.push({
        type: 'SUBSCRIPTION',
        item_id: firm.id,
        item_name: firm.name,
        firm_id: firm.id,
        firm_name: firm.name,
        expires_at: firm.subscription_ends_at,
        days_remaining: daysRemaining,
        status: daysRemaining <= 7 ? 'critical' : daysRemaining <= 14 ? 'warning' : 'normal',
      });
    }
  }

  // Kritik uyarı sayısı
  const criticalCount = results.filter(r => r.status === 'critical').length;
  const warningCount = results.filter(r => r.status === 'warning').length;

  res.json({
    success: true,
    data: results.sort((a, b) => a.days_remaining - b.days_remaining),
    summary: {
      total_expiring: results.length,
      critical: criticalCount,
      warning: warningCount,
      days_range: daysToExpire,
    },
  });
});

/**
 * Süresi Dolanı uzat
 */
export const extendExpiry = asyncHandler(async (req: Request, res: Response) => {
  const { type, item_id, extend_days } = req.body;

  if (!type || !item_id || !extend_days) {
    throw new AppError('Eksik parametre', 400);
  }

  const newDate = new Date(Date.now() + extend_days * 24 * 60 * 60 * 1000);

  switch (type) {
    case 'API_KEY':
      await prisma.apiKey.update({
        where: { id: item_id },
        data: { expires_at: newDate },
      });
      break;
    case 'MODULE_LICENSE':
      await prisma.modulePermission.update({
        where: { id: item_id },
        data: { expires_at: newDate },
      });
      break;
    case 'TRIAL_PERIOD':
      await prisma.firm.update({
        where: { id: item_id },
        data: { trial_ends_at: newDate },
      });
      break;
    case 'SUBSCRIPTION':
      await prisma.firm.update({
        where: { id: item_id },
        data: { subscription_ends_at: newDate },
      });
      break;
    default:
      throw new AppError('Geçersiz tür', 400);
  }

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user.sub,
      action: 'EXTEND_EXPIRY',
      entity_type: type,
      entity_id: item_id,
      details: { extend_days, new_date: newDate },
    },
  });

  res.json({
    success: true,
    message: `${type} için süre ${extend_days} gün uzatıldı`,
    data: { new_expires_at: newDate },
  });
});

// ============================================
// Dolibarr Error Logs - Dolibarr Hata Logları
// ============================================

/**
 * Dolibarr hata loglarını listele
 */
export const getDolibarrErrors = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 50,
    firm_id,
    error_type,
    resolved,
    start_date,
    end_date,
  } = req.query;

  const skip = (Number(page) - 1) * Number(limit);

  const where: any = {};
  if (firm_id) where.firm_id = firm_id;
  if (error_type) where.error_type = error_type;
  if (resolved !== undefined) where.resolved = resolved === 'true';
  if (start_date || end_date) {
    where.created_at = {};
    if (start_date) where.created_at.gte = new Date(start_date as string);
    if (end_date) where.created_at.lte = new Date(end_date as string);
  }

  const [logs, total] = await Promise.all([
    prisma.dolibarrErrorLog.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { created_at: 'desc' },
      include: {
        firm: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.dolibarrErrorLog.count({ where }),
  ]);

  // Hata türüne göre grupla
  const errorStats = await prisma.dolibarrErrorLog.groupBy({
    by: ['error_type'],
    _count: true,
    where: {
      created_at: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Son 7 gün
      },
    },
  });

  res.json({
    success: true,
    data: logs,
    stats: errorStats.map(e => ({
      error_type: e.error_type,
      count: e._count,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Hata logunu çözümlenmiş olarak işaretle
 */
export const resolveDolibarrError = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const log = await prisma.dolibarrErrorLog.update({
    where: { id },
    data: {
      resolved: true,
      resolved_at: new Date(),
      resolved_by: (req as any).user.sub,
    },
    include: {
      firm: {
        select: { name: true },
      },
    },
  });

  res.json({
    success: true,
    data: log,
    message: 'Hata çözümlendi olarak işaretlendi',
  });
});

/**
 * Çözümlenmemiş tüm hataları çözümlenmiş yap
 */
export const resolveAllDolibarrErrors = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.body;

  const where: any = { resolved: false };
  if (firm_id) where.firm_id = firm_id;

  const result = await prisma.dolibarrErrorLog.updateMany({
    where,
    data: {
      resolved: true,
      resolved_at: new Date(),
      resolved_by: (req as any).user.sub,
    },
  });

  res.json({
    success: true,
    message: `${result.count} hata çözümlenmiş olarak işaretlendi`,
    data: { resolved_count: result.count },
  });
});

/**
 * Dolibarr bağlantısını test et (firma bazlı)
 */
export const testFirmDolibarrConnection = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.body;

  const firm = await prisma.firm.findUnique({
    where: { id: firm_id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Dolibarr servisini oluştur ve test et
  const service = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key, firm.id);
  const result = await service.testConnection();

  res.json({
    success: true,
    data: {
      connected: result.success,
      version: result.data?.version,
      error: result.error,
      firm_id,
      dolibarr_url: firm.dolibarr_url,
    },
  });
});