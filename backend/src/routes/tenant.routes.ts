import { Router } from 'express';
import { firmAuth, apiKeyAuth, requireModule } from '../middleware/auth.middleware';
import { dolibarrProxyLimiter } from '../middleware/rate-limit.middleware';
import {
  proxyToDolibarr,
  testDolibarrConnection,
  getTenantStats,
  listWebhooks,
  createWebhook,
  deleteWebhook,
  checkModuleAccess,
} from '../controllers/tenant.controller';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const webhookSchema = z.object({
  name: z.string().min(2),
  url: z.string().url(),
  secret: z.string().optional(),
  events: z.array(z.string()),
  headers: z.record(z.string()).optional(),
});

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// Dolibarr Proxy Routes (JWT Auth)
// ============================================

// Third parties (Müşteriler)
router.get('/dolibarr/thirdparties/:id?', dolibarrProxyLimiter, firmAuth, proxyToDolibarr);
router.post('/dolibarr/thirdparties', firmAuth, proxyToDolibarr);
router.put('/dolibarr/thirdparties/:id', firmAuth, proxyToDolibarr);
router.delete('/dolibarr/thirdparties/:id', firmAuth, proxyToDolibarr);

// Products (Ürünler)
router.get('/dolibarr/products/:id?', dolibarrProxyLimiter, firmAuth, proxyToDolibarr);
router.post('/dolibarr/products', firmAuth, proxyToDolibarr);
router.put('/dolibarr/products/:id', firmAuth, proxyToDolibarr);
router.delete('/dolibarr/products/:id', firmAuth, proxyToDolibarr);

// Orders (Siparişler)
router.get('/dolibarr/orders/:id?', dolibarrProxyLimiter, firmAuth, proxyToDolibarr);
router.post('/dolibarr/orders', firmAuth, proxyToDolibarr);
router.put('/dolibarr/orders/:id', firmAuth, proxyToDolibarr);
router.post('/dolibarr/orders/:id/validate', firmAuth, proxyToDolibarr);

// Invoices (Faturalar)
router.get('/dolibarr/invoices', firmAuth, proxyToDolibarr);
router.post('/dolibarr/invoices', firmAuth, proxyToDolibarr);
router.post('/dolibarr/invoices/:id/validate', firmAuth, proxyToDolibarr);

// Projects (Projeler)
router.get('/dolibarr/projects', firmAuth, proxyToDolibarr);
router.post('/dolibarr/projects', firmAuth, proxyToDolibarr);

// ============================================
// API Key Routes (API Key Auth)
// ============================================

const apiRouter = Router();

// Third parties via API
apiRouter.get('/thirdparties/:id?', dolibarrProxyLimiter, apiKeyAuth, proxyToDolibarr);
apiRouter.post('/thirdparties', apiKeyAuth, proxyToDolibarr);
apiRouter.put('/thirdparties/:id', apiKeyAuth, proxyToDolibarr);
apiRouter.delete('/thirdparties/:id', apiKeyAuth, proxyToDolibarr);

// Products via API
apiRouter.get('/products/:id?', dolibarrProxyLimiter, apiKeyAuth, proxyToDolibarr);
apiRouter.post('/products', apiKeyAuth, proxyToDolibarr);
apiRouter.put('/products/:id', apiKeyAuth, proxyToDolibarr);
apiRouter.delete('/products/:id', apiKeyAuth, proxyToDolibarr);

// Orders via API
apiRouter.get('/orders/:id?', dolibarrProxyLimiter, apiKeyAuth, proxyToDolibarr);
apiRouter.post('/orders', apiKeyAuth, proxyToDolibarr);
apiRouter.put('/orders/:id', apiKeyAuth, proxyToDolibarr);

// Invoices via API
apiRouter.get('/invoices', apiKeyAuth, proxyToDolibarr);
apiRouter.post('/invoices', apiKeyAuth, proxyToDolibarr);

// Products via API
apiRouter.get('/projects', apiKeyAuth, proxyToDolibarr);
apiRouter.post('/projects', apiKeyAuth, proxyToDolibarr);

// Dolibarr test connection
apiRouter.get('/dolibarr/test', apiKeyAuth, testDolibarrConnection);

// Dolibarr test connection
router.get('/dolibarr/test', firmAuth, testDolibarrConnection);

// ============================================
// Tenant Dashboard Routes
// ============================================

router.get('/dashboard/stats', firmAuth, getTenantStats);

// ============================================
// Module Access Check
// ============================================

router.get('/modules/:module/access', firmAuth, checkModuleAccess);

// ============================================
// Webhook Routes (Requires WEBHOOKS module)
// ============================================

router.get('/webhooks', firmAuth, requireModule('WEBHOOKS'), listWebhooks);
router.post('/webhooks', firmAuth, requireModule('WEBHOOKS'), validateBody(webhookSchema), createWebhook);
router.delete('/webhooks/:id', firmAuth, requireModule('WEBHOOKS'), deleteWebhook);

// ============================================
// Health Check
// ============================================

router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Tenant API is running',
    timestamp: new Date().toISOString(),
  });
});

export default router;
export { apiRouter };