import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import {
  listApiUsageLogs,
  getFirmApiUsage,
  getPlatformHealth,
  checkFirmHealth,
  cleanupHealthLogs,
  getPlatformStatistics,
  getRealtimeMetrics,
  getDashboardData,
  exportApiUsageReport,
} from '../controllers/analytics.controller';

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// API Usage Logs Routes
// ============================================

// List API usage logs
router.get('/api-usage', superAdminAuth, listApiUsageLogs);

// Get firm API usage summary
router.get('/api-usage/firm/:firm_id', superAdminAuth, getFirmApiUsage);

// Export API usage report (CSV)
router.get('/api-usage/export', superAdminAuth, exportApiUsageReport);

// ============================================
// Health Check Routes
// ============================================

// Get platform health status
router.get('/health', superAdminAuth, getPlatformHealth);

// Check specific firm health
router.post('/health/check', superAdminAuth, checkFirmHealth);

// Cleanup old health logs
router.post('/health/cleanup', superAdminAuth, cleanupHealthLogs);

// ============================================
// Statistics Routes
// ============================================

// Get platform statistics
router.get('/statistics', superAdminAuth, getPlatformStatistics);

// Get realtime metrics (last 5 minutes)
router.get('/metrics/realtime', superAdminAuth, getRealtimeMetrics);

// Get dashboard data
router.get('/dashboard', superAdminAuth, getDashboardData);

export default router;