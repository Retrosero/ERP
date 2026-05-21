import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Dolibarr Configuration
  dolibarr: {
    baseUrl: process.env.DOLIBARR_BASE_URL || 'https://erp.firmaadi.com',
    apiKey: process.env.DOLIBARR_API_KEY || '',
    apiPrefix: process.env.DOLIBARR_API_PREFIX || '/api/index.php',
    timeout: parseInt(process.env.DOLIBARR_TIMEOUT || '30000', 10),
    enableCache: process.env.DOLIBARR_ENABLE_CACHE === 'true',
  },

  // Application Configuration
  app: {
    port: parseInt(process.env.APP_PORT || '3005', 10),
    url: process.env.APP_URL || 'http://localhost:3005',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // CORS Configuration
  cors: {
    origins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // Database (optional)
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // Session
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10),
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },
};

// Validate required configuration
export function validateConfig(): boolean {
  if (!config.dolibarr.baseUrl) {
    console.error('❌ DOLIBARR_BASE_URL is required');
    return false;
  }
  if (!config.dolibarr.apiKey) {
    console.error('❌ DOLIBARR_API_KEY is required');
    return false;
  }
  return true;
}
