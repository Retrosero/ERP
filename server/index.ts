import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import logger, { requestLogger } from './services/logger';
import dolibarrRoutes from './routes/dolibarr';
import appRoutes from './routes/app';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { authMiddleware } from './middleware/auth';
import { errorHandler, notFoundHandler, requestLoggerMiddleware } from './middleware/errorHandler';

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================

// CORS
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id', 'X-Session-Token'],
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(requestLoggerMiddleware);

// Rate limiting
app.use('/api/', rateLimitMiddleware);

// Authentication
app.use('/api/', authMiddleware);

// ==================== ROUTES ====================

// App routes
app.use('/api', appRoutes);

// Dolibarr proxy routes
app.use('/api/dolibarr', dolibarrRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// ==================== SERVER START ====================

function startServer() {
  if (!validateConfig()) {
    logger.error('Configuration validation failed. Please check your .env file.');
    process.exit(1);
  }

  app.listen(config.app.port, () => {
    logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Dolibarr Panel API Server                               ║
║   ────────────────────────────────                       ║
║                                                           ║
║   🌐 URL: http://localhost:${config.app.port}                        ║
║   📦 Dolibarr: ${config.dolibarr.baseUrl}              ║
║   🔒 Mode: ${config.app.nodeEnv.padEnd(17)}                       ║
║                                                           ║
║   Endpoints:                                              ║
║   • GET  /api/health         - Health check              ║
║   • GET  /api/info            - App info                  ║
║   • ANY  /api/dolibarr/*      - Dolibarr Proxy            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();

export default app;