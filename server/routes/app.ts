import { Router } from 'express';

const router = Router();

// App health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// App info
router.get('/info', (req, res) => {
  res.json({
    name: 'Dolibarr Panel API',
    version: '1.0.0',
    description: 'Dolibarr ERP Proxy API',
    endpoints: {
      dolibarr: '/api/dolibarr',
      health: '/api/health',
    },
  });
});

export default router;