import { config } from '../config';
import { createLogger, format, transports } from 'winston';

const logFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

const logger = createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    new transports.Console(),
    ...(config.logging.filePath ? [
      new transports.File({
        filename: config.logging.filePath,
        format: logFormat,
      }),
    ] : []),
  ],
});

// Create request logger middleware
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });

  next();
};

export default logger;