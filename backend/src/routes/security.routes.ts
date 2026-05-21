import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import { adminRateLimiter } from '../middleware/rate-limit.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import {
  listIpRules,
  createIpRule,
  updateIpRule,
  deleteIpRule,
  checkIpAccess,
  listUserSessions,
  revokeSession,
  revokeAllUserSessions,
  cleanupExpiredSessions,
  createSession,
} from '../controllers/security.controller';

// ============================================
// Validation Schemas
// ============================================

const ipRuleSchema = z.object({
  firm_id: z.string().uuid().optional(),
  ip_address: z.string().min(1),
  ip_version: z.enum(['IPV4', 'IPV6']).optional(),
  rule_type: z.enum(['WHITELIST', 'BLACKLIST']),
  description: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  days_of_week: z.array(z.string()).optional(),
  priority: z.number().optional(),
});

const updateIpRuleSchema = z.object({
  ip_address: z.string().min(1).optional(),
  ip_version: z.enum(['IPV4', 'IPV6']).optional(),
  rule_type: z.enum(['WHITELIST', 'BLACKLIST']).optional(),
  description: z.string().optional(),
  start_time: z.string().datetime().optional(),
  end_time: z.string().datetime().optional(),
  days_of_week: z.array(z.string()).optional(),
  priority: z.number().optional(),
  is_active: z.boolean().optional(),
});

const checkIpSchema = z.object({
  ip_address: z.string().min(1),
  firm_id: z.string().uuid().optional(),
});

const sessionSchema = z.object({
  user_id: z.string(),
  user_type: z.enum(['SUPER_ADMIN', 'FIRM_USER', 'API_KEY']),
  firm_id: z.string().uuid().optional(),
  token: z.string(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  expires_at: z.string().datetime(),
  device_type: z.string().optional(),
  browser: z.string().optional(),
  os: z.string().optional(),
});

const revokeAllSchema = z.object({
  user_id: z.string(),
  keep_current: z.boolean().optional(),
});

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// IP Rules Routes
// ============================================

// List all IP rules
router.get('/ip-rules', superAdminAuth, listIpRules);

// Create IP rule
router.post('/ip-rules', superAdminAuth, adminRateLimiter, validateBody(ipRuleSchema), createIpRule);

// Update IP rule
router.put('/ip-rules/:id', superAdminAuth, validateBody(updateIpRuleSchema), updateIpRule);

// Delete IP rule
router.delete('/ip-rules/:id', superAdminAuth, deleteIpRule);

// Check IP access
router.post('/ip-rules/check', superAdminAuth, validateBody(checkIpSchema), checkIpAccess);

// ============================================
// Session Management Routes
// ============================================

// List user sessions
router.get('/sessions', superAdminAuth, listUserSessions);

// Create new session
router.post('/sessions', superAdminAuth, adminRateLimiter, validateBody(sessionSchema), createSession);

// Revoke specific session
router.delete('/sessions/:id', superAdminAuth, revokeSession);

// Revoke all user sessions
router.post('/sessions/revoke-all', superAdminAuth, validateBody(revokeAllSchema), revokeAllUserSessions);

// Cleanup expired sessions
router.post('/sessions/cleanup', superAdminAuth, cleanupExpiredSessions);

export default router;