import { Request, Response } from 'express';
import { AuthenticatedRequest, FirmContext } from '../types';
import prisma from '../config/database';
import { createDolibarrService } from '../services/dolibarr.service';
import { asyncHandler, AppError } from '../middleware/validation.middleware';

// ============================================
// Tenant Dolibarr Proxy
// Bu endpoint'ler Dolibarr'a istekleri proxy eder
// Dolibarr çekirdeğine dokunmaz!
// ============================================

/**
 * Dolibarr API'ye proxy - Tüm endpoint'ler
 */
export const proxyToDolibarr = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const firm = await prisma.firm.findUnique({
    where: { id: req.firm.id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Dolibarr servisini oluştur
  const dolibarr = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key);

  // Path parametrelerini al
  const { path, id, action } = req.params;

  // Dolibarr endpoint'ine yönlendir
  try {
    let result: any;

    switch (path) {
      case 'thirdparties':
        if (req.method === 'GET') {
          if (id) {
            const response = await dolibarr.getThirdParty(parseInt(id));
            result = response;
          } else {
            const response = await dolibarr.getThirdParties({
              limit: parseInt(req.query.limit as string) || 100,
              offset: parseInt(req.query.offset as string) || 0,
            });
            result = response;
          }
        } else if (req.method === 'POST') {
          const response = await dolibarr.createThirdParty(req.body);
          result = response;
        } else if (req.method === 'PUT' && id) {
          const response = await dolibarr.updateThirdParty(parseInt(id), req.body);
          result = response;
        } else if (req.method === 'DELETE' && id) {
          const response = await dolibarr.deleteThirdParty(parseInt(id));
          result = response;
        }
        break;

      case 'products':
        if (req.method === 'GET') {
          if (id) {
            const response = await dolibarr.getProduct(parseInt(id));
            result = response;
          } else {
            const response = await dolibarr.getProducts({
              limit: parseInt(req.query.limit as string) || 100,
              offset: parseInt(req.query.offset as string) || 0,
            });
            result = response;
          }
        } else if (req.method === 'POST') {
          const response = await dolibarr.createProduct(req.body);
          result = response;
        } else if (req.method === 'PUT' && id) {
          const response = await dolibarr.updateProduct(parseInt(id), req.body);
          result = response;
        } else if (req.method === 'DELETE' && id) {
          const response = await dolibarr.deleteProduct(parseInt(id));
          result = response;
        }
        break;

      case 'orders':
        if (req.method === 'GET') {
          if (id) {
            const response = await dolibarr.getOrder(parseInt(id));
            result = response;
          } else {
            const response = await dolibarr.getOrders({
              limit: parseInt(req.query.limit as string) || 100,
              offset: parseInt(req.query.offset as string) || 0,
              thirdparty_id: req.query.thirdparty_id ? parseInt(req.query.thirdparty_id as string) : undefined,
            });
            result = response;
          }
        } else if (req.method === 'POST') {
          const response = await dolibarr.createOrder(req.body);
          result = response;
        } else if (req.method === 'PUT' && id) {
          const response = await dolibarr.updateOrder(parseInt(id), req.body);
          result = response;
        } else if (action === 'validate' && id) {
          const response = await dolibarr.validateOrder(parseInt(id));
          result = response;
        }
        break;

      case 'invoices':
        if (req.method === 'GET') {
          if (id && action === 'validate') {
            const response = await dolibarr.validateInvoice(parseInt(id));
            result = response;
          } else {
            const response = await dolibarr.getInvoices({
              limit: parseInt(req.query.limit as string) || 100,
              offset: parseInt(req.query.offset as string) || 0,
              thirdparty_id: req.query.thirdparty_id ? parseInt(req.query.thirdparty_id as string) : undefined,
            });
            result = response;
          }
        } else if (req.method === 'POST') {
          const response = await dolibarr.createInvoice(req.body);
          result = response;
        }
        break;

      case 'projects':
        if (req.method === 'GET') {
          const response = await dolibarr.getProjects({
            limit: parseInt(req.query.limit as string) || 100,
            offset: parseInt(req.query.offset as string) || 0,
          });
          result = response;
        } else if (req.method === 'POST') {
          const response = await dolibarr.createProject(req.body);
          result = response;
        }
        break;

      default:
        throw new AppError(`Desteklenmeyen Dolibarr endpoint: ${path}`, 400);
    }

    res.json(result);
  } catch (error: any) {
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message || 'Dolibarr API hatası',
    });
  }
});

/**
 * Dolibarr bağlantısını test et
 */
export const testDolibarrConnection = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const firm = await prisma.firm.findUnique({
    where: { id: req.firm.id },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  const dolibarr = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key);
  const result = await dolibarr.testConnection();

  res.json(result);
});

// ============================================
// Tenant Dashboard Data
// ============================================

/**
 * Tenant dashboard istatistikleri
 */
export const getTenantStats = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const firm = await prisma.firm.findUnique({
    where: { id: req.firm.id },
    include: {
      _count: {
        select: { users: true, modules: true },
      },
    },
  });

  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  // Dolibarr'dan veri çek
  const dolibarr = createDolibarrService(firm.dolibarr_url, firm.dolibarr_api_key);

  const [
    customersResult,
    productsResult,
    ordersResult,
  ] = await Promise.all([
    dolibarr.getThirdParties({ limit: 1000 }),
    dolibarr.getProducts({ limit: 1000 }),
    dolibarr.getOrders({ limit: 100 }),
  ]);

  res.json({
    success: true,
    data: {
      firm: {
        id: firm.id,
        name: firm.name,
        plan: firm.plan,
        status: firm.status,
        user_count: firm._count.users,
        max_users: firm.max_users,
      },
      dolibarr: {
        customers_count: customersResult.success ? customersResult.data?.length || 0 : 'error',
        products_count: productsResult.success ? productsResult.data?.length || 0 : 'error',
        orders_count: ordersResult.success ? ordersResult.data?.length || 0 : 'error',
      },
      modules: req.firm.modules,
    },
  });
});

// ============================================
// Webhook Management
// ============================================

/**
 * Firm webhook'larını listele
 */
export const listWebhooks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const webhooks = await prisma.webhook.findMany({
    where: { firm_id: req.firm.id },
    orderBy: { created_at: 'desc' },
  });

  res.json({
    success: true,
    data: webhooks,
  });
});

/**
 * Webhook oluştur
 */
export const createWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  if (!req.firm.modules.includes('WEBHOOKS')) {
    throw new AppError('Webhook modülü aktif değil', 403);
  }

  const { name, url, secret, events, headers } = req.body;

  const webhook = await prisma.webhook.create({
    data: {
      firm_id: req.firm.id,
      name,
      url,
      secret,
      events,
      headers,
    },
  });

  res.status(201).json({
    success: true,
    data: webhook,
  });
});

/**
 * Webhook sil
 */
export const deleteWebhook = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const webhook = await prisma.webhook.findFirst({
    where: { id: req.params.id, firm_id: req.firm.id },
  });

  if (!webhook) {
    throw new AppError('Webhook bulunamadı', 404);
  }

  await prisma.webhook.delete({
    where: { id: req.params.id },
  });

  res.json({
    success: true,
    message: 'Webhook silindi',
  });
});

// ============================================
// Module Access Check
// ============================================

/**
 * Modül erişimi kontrol et
 */
export const checkModuleAccess = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.firm) {
    throw new AppError('Firma bağlantısı gerekli', 401);
  }

  const { module } = req.params;

  // Plan'dan kontrol et
  const hasAccess = req.firm.modules.includes(module as any);

  // Detaylı izin kontrolü
  const permission = await prisma.modulePermission.findUnique({
    where: {
      firm_id_module: {
        firm_id: req.firm.id,
        module: module as any,
      },
    },
  });

  res.json({
    success: true,
    data: {
      module,
      has_access: hasAccess && (permission?.is_active ?? false),
      is_trial: permission?.is_trial ?? false,
      expires_at: permission?.expires_at ?? null,
      days_remaining: permission?.expires_at
        ? Math.ceil((new Date(permission.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null,
    },
  });
});