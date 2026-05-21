import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import { adminRateLimiter, authRateLimiter } from '../middleware/rate-limit.middleware';
import {
  superAdminLogin,
  getSuperAdminProfile,
  listFirms,
  getFirm,
  createFirm,
  updateFirm,
  deleteFirm,
  suspendFirm,
  reactivateFirm,
  activateModule,
  deactivateModule,
  getFirmModules,
  createFirmUser,
  listFirmUsers,
  createApiKey,
  revokeApiKey,
  getPlatformStats,
  getAdminLogs,
  // Yeni endpoint'ler
  getExpiringItems,
  extendExpiry,
  getDolibarrErrors,
  resolveDolibarrError,
  resolveAllDolibarrErrors,
  testFirmDolibarrConnection,
} from '../controllers/admin.controller';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';

// ============================================
// Validation Schemas
// ============================================

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const createFirmSchema = z.object({
  name: z.string().min(2),
  short_name: z.string().min(2).optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  dolibarr_url: z.string().url(),
  dolibarr_api_key: z.string().min(10),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  subdomain: z.string().optional(),
});

const updateFirmSchema = z.object({
  name: z.string().min(2).optional(),
  short_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  tax_id: z.string().optional(),
  address: z.string().optional(),
  dolibarr_url: z.string().url().optional(),
  dolibarr_api_key: z.string().min(10).optional(),
  plan: z.enum(['STARTER', 'PROFESSIONAL', 'ENTERPRISE']).optional(),
  status: z.enum(['PENDING', 'TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED']).optional(),
  max_users: z.number().optional(),
  max_storage_gb: z.number().optional(),
  subdomain: z.string().optional(),
});

const activateModuleSchema = z.object({
  firm_id: z.string().uuid(),
  module: z.string(),
  duration_days: z.number().optional(),
  is_trial: z.boolean().optional(),
});

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  surname: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'VIEWER']).optional(),
});

const createApiKeySchema = z.object({
  name: z.string().min(2),
  permissions: z.array(z.string()),
  expires_at: z.string().datetime().optional(),
});

const extendExpirySchema = z.object({
  type: z.enum(['API_KEY', 'MODULE_LICENSE', 'TRIAL_PERIOD', 'SUBSCRIPTION']),
  item_id: z.string(),
  extend_days: z.number().positive(),
});

const resolveAllErrorsSchema = z.object({
  firm_id: z.string().optional(),
});

// ============================================
// Router
// ============================================

const router = Router();

// Auth routes
router.post('/auth/login', authRateLimiter, validateBody(loginSchema), superAdminLogin);
router.get('/auth/profile', superAdminAuth, getSuperAdminProfile);

// Firm routes
router.get('/firms', adminRateLimiter, superAdminAuth, listFirms);
router.get('/firms/:id', superAdminAuth, getFirm);
router.post('/firms', superAdminAuth, validateBody(createFirmSchema), createFirm);
router.put('/firms/:id', superAdminAuth, validateBody(updateFirmSchema), updateFirm);
router.delete('/firms/:id', superAdminAuth, deleteFirm);
router.post('/firms/:id/suspend', superAdminAuth, suspendFirm);
router.post('/firms/:id/reactivate', superAdminAuth, reactivateFirm);

// Module routes
router.post('/modules/activate', superAdminAuth, validateBody(activateModuleSchema), activateModule);
router.post('/modules/deactivate', superAdminAuth, deactivateModule);
router.get('/firms/:firm_id/modules', getFirmModules);

// User routes
router.get('/firms/:firm_id/users', listFirmUsers);
router.post('/firms/:firm_id/users', superAdminAuth, validateBody(createUserSchema), createFirmUser);

// API Key routes
router.post('/firms/:firm_id/api-keys', superAdminAuth, validateBody(createApiKeySchema), createApiKey);
router.delete('/api-keys/:id', superAdminAuth, revokeApiKey);

// Stats
router.get('/stats', superAdminAuth, getPlatformStats);

// Admin logs
router.get('/logs', superAdminAuth, getAdminLogs);

// ============================================
// Expiring Items - Süresi Dolanlar
// ============================================
router.get('/expiring', superAdminAuth, getExpiringItems);
router.post('/expiring/extend', superAdminAuth, validateBody(extendExpirySchema), extendExpiry);

// ============================================
// Dolibarr Error Logs
// ============================================
router.get('/dolibarr-errors', superAdminAuth, getDolibarrErrors);
router.patch('/dolibarr-errors/:id/resolve', superAdminAuth, resolveDolibarrError);
router.post('/dolibarr-errors/resolve-all', superAdminAuth, validateBody(resolveAllErrorsSchema), resolveAllDolibarrErrors);
router.post('/dolibarr/test-connection', superAdminAuth, testFirmDolibarrConnection);

export default router;