import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Frontend
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'change-me-in-production!',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d' as string | number,
  },

  // Super Admin
  superAdmin: {
    email: process.env.SUPER_ADMIN_EMAIL || 'admin@erp-saas.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'change-me-in-production!',
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Multi-tenant
  trial: {
    defaultDays: parseInt(process.env.DEFAULT_TRIAL_DAYS || '14', 10),
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/erp_saas',
  },

  // CORS
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
};

export default config;