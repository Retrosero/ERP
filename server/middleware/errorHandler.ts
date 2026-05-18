import { Request, Response, NextFunction } from 'express';
import logger from '../services/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`Unhandled error: ${err.message}`, { stack: err.stack });

  res.status(500).json({
    success: false,
    error: 'Sunucuda beklenmeyen bir hata oluştu',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: 'Sayfa veya kaynak bulunamadı',
  });
}

export function requestLoggerMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logLevel = res.statusCode >= 400 ? 'warn' : 'info';

    logger[logLevel](
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}