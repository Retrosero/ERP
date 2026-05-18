import { Request, Response, NextFunction } from 'express';
import { config } from '../config';
import logger from '../services/logger';

// Rate limiter store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Clean expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

export function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const windowMs = config.rateLimit.windowMs;
  const maxRequests = config.rateLimit.maxRequests;

  let record = rateLimitStore.get(key);

  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(key, record);
  }

  record.count++;

  if (record.count > maxRequests) {
    logger.warn(`Rate limit exceeded for IP: ${key}`);
    res.status(429).json({
      error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
      retryAfter: Math.ceil((record.resetTime - now) / 1000),
    });
    return;
  }

  res.setHeader('X-RateLimit-Limit', maxRequests.toString());
  res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
  res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

  next();
}