import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import config from './config';
import { apiRateLimiter, authRateLimiter, adminRateLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/validation.middleware';

import adminRoutes from './routes/admin.routes';
import tenantRoutes, { apiRouter } from './routes/tenant.routes';
import securityRoutes from './routes/security.routes';
import analyticsRoutes from './routes/analytics.routes';
import automationRoutes from './routes/automation.routes';
import supportRoutes from './routes/support.routes';
import brandingRoutes from './routes/branding.routes';
import attendanceRoutes from './routes/attendance.routes';
import payrollRoutes from './routes/payroll.routes';

const app = express();

// ============================================
// Security Middleware
// ============================================

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials,
}));

// ============================================
// Body Parser
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================
// Logging
// ============================================

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Health Check
// ============================================

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ============================================
// API Routes
// ============================================

// Super Admin API (SaaS Platform Yönetimi)
app.use('/api/admin', adminRateLimiter, adminRoutes);

// Security & Session Management
app.use('/api/admin/security', adminRateLimiter, securityRoutes);

// Analytics & Monitoring
app.use('/api/admin/analytics', adminRateLimiter, analyticsRoutes);

// Automation & Scheduled Tasks
app.use('/api/admin/automation', adminRateLimiter, automationRoutes);

// Support System (Tickets, FAQ, Announcements)
app.use('/api/admin/support', adminRateLimiter, supportRoutes);

// White-Label & Branding
app.use('/api/admin/branding', adminRateLimiter, brandingRoutes);

// Tenant API (Firma Kullanıcıları)
app.use('/api/tenant', apiRateLimiter, tenantRoutes);

// Attendance / Personel Giriş-Çıkış
app.use('/api/tenant/attendance', apiRateLimiter, attendanceRoutes);

// Payroll / Maaş ve Bordro
app.use('/api/tenant/payroll', apiRateLimiter, payrollRoutes);

// API Key Routes (Üçüncü Parti Entegrasyonlar)
app.use('/api/v1', apiRateLimiter, apiRouter);

// ============================================
// Error Handling
// ============================================

app.use(notFoundHandler);
app.use(errorHandler);

// ============================================
// Start Server
// ============================================

app.listen(config.port, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ERP SaaS Backend Server                              ║
║   ───────────────────────                              ║
║                                                        ║
║   🏢 Super Admin API:  http://localhost:${config.port}/api/admin       ║
║   🏢 Tenant API:       http://localhost:${config.port}/api/tenant      ║
║   🔌 API v1:           http://localhost:${config.port}/api/v1          ║
║                                                        ║
║   Environment: ${config.nodeEnv.padEnd(43)}║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

export default app;