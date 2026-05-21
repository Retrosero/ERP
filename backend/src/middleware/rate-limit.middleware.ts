import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import config from '../config';

/**
 * Genel API rate limit
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth endpoint'leri için daha sıkı limit
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 10, // 15 dakikada 10 istek
  message: {
    success: false,
    error: 'Çok fazla giriş denemesi. Lütfen 15 dakika bekleyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Super Admin endpoint'leri için daha sıkı limit
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 30,
  message: {
    success: false,
    error: 'Çok fazla istek. Lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Webhook delivery rate limit (dış servisler için)
 */
export const webhookDeliveryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 60,
  message: {
    success: false,
    error: 'Webhook rate limit aşıldı.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Dolibarr API proxy rate limit
 * Dolibarr'ın kendi rate limit'ini aşmamak için
 */
export const dolibarrProxyLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 100, // Dolibarr'a dakikada 100 istek
  message: {
    success: false,
    error: 'Dolibarr API rate limit aşıldı. Lütfen daha sonra tekrar deneyin.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});