import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { JWTPayload, AuthenticatedRequest, FirmContext } from '../types';
import prisma from '../config/database';

/**
 * Super Admin Authentication Middleware
 * Sadece SaaS platform yöneticileri için
 */
export const superAdminAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme token\'ı bulunamadı',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Super Admin kontrolü
    if (decoded.role !== 'SUPER_ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Bu işlem için super admin yetkisi gerekli',
      });
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Geçersiz veya süresi dolmuş token',
    });
  }
};

/**
 * Firm Admin Authentication Middleware
 * Firma yöneticileri ve kullanıcıları için
 */
export const firmAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractToken(req);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme token\'ı bulunamadı',
      });
      return;
    }

    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    if (!decoded.firmId) {
      res.status(400).json({
        success: false,
        error: 'Firma bağlantısı bulunamadı',
      });
      return;
    }

    // Firm bilgilerini al
    const firm = await prisma.firm.findUnique({
      where: { id: decoded.firmId },
      include: {
        modules: {
          where: { is_active: true },
        },
      },
    });

    if (!firm) {
      res.status(404).json({
        success: false,
        error: 'Firma bulunamadı',
      });
      return;
    }

    if (firm.status !== 'ACTIVE' && firm.status !== 'TRIAL') {
      res.status(403).json({
        success: false,
        error: 'Firma hesabı aktif değil',
      });
      return;
    }

    // Firm context oluştur
    const firmContext: FirmContext = {
      id: firm.id,
      name: firm.name,
      plan: firm.plan,
      modules: firm.modules.map(m => m.module),
      maxUsers: firm.max_users,
      maxStorageGb: firm.max_storage_gb,
    };

    req.user = decoded;
    req.firm = firmContext;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Geçersiz veya süresi dolmuş token',
    });
  }
};

/**
 * API Key Authentication Middleware
 * Üçüncü parti entegrasyonlar için
 */
export const apiKeyAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: 'API key bulunamadı',
      });
      return;
    }

    // Key prefix ile ara
    const keyPrefix = apiKey.substring(0, 8);
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: {
        key_prefix: keyPrefix,
        is_active: true,
      },
      include: {
        firm: {
          include: {
            modules: {
              where: { is_active: true },
            },
          },
        },
      },
    });

    if (!apiKeyRecord) {
      res.status(401).json({
        success: false,
        error: 'Geçersiz API key',
      });
      return;
    }

    // Expiry kontrolü
    if (apiKeyRecord.expires_at && new Date() > apiKeyRecord.expires_at) {
      res.status(401).json({
        success: false,
        error: 'API key süresi dolmuş',
      });
      return;
    }

    // Usage count güncelle
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: {
        last_used_at: new Date(),
        usage_count: { increment: 1 },
      },
    });

    // Firm context oluştur
    const firmContext: FirmContext = {
      id: apiKeyRecord.firm.id,
      name: apiKeyRecord.firm.name,
      plan: apiKeyRecord.firm.plan,
      modules: apiKeyRecord.firm.modules.map(m => m.module),
      maxUsers: apiKeyRecord.firm.max_users,
      maxStorageGb: apiKeyRecord.firm.max_storage_gb,
    };

    // Permissions'ı request'e ekle
    (req as any).apiPermissions = apiKeyRecord.permissions;
    req.firm = firmContext;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Kimlik doğrulama hatası',
    });
  }
};

/**
 * Module Access Control Middleware
 * Belirli modüllere erişim kontrolü
 */
export const requireModule = (...requiredModules: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.firm) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme gerekli',
      });
      return;
    }

    const hasAccess = requiredModules.some(module => req.firm!.modules.includes(module));

    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: `Bu işlem için gerekli modül: ${requiredModules.join(', ')}`,
        required_modules: requiredModules,
      });
      return;
    }

    next();
  };
};

/**
 * Plan Access Control Middleware
 * Belirli plan gereksinimi kontrolü
 */
export const requirePlan = (...requiredPlans: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.firm) {
      res.status(401).json({
        success: false,
        error: 'Yetkilendirme gerekli',
      });
      return;
    }

    if (!requiredPlans.includes(req.firm.plan as string)) {
      res.status(403).json({
        success: false,
        error: `Bu işlem için ${requiredPlans.join(' veya ')} planı gerekli`,
        current_plan: req.firm.plan,
        required_plans: requiredPlans,
      });
      return;
    }

    next();
  };
};

// ============================================
// Helper Functions
// ============================================

/**
 * Token'ı request'ten çıkar
 */
function extractToken(req: Request): string | null {
  // Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Query parameter
  return req.query.token as string || null;
}

/**
 * Token oluştur
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'],
  } as jwt.SignOptions);
}

/**
 * Token'ı yenile
 */
export function refreshToken(payload: JWTPayload): string {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    config.jwt.secret,
    { expiresIn: '30d' }
  );
}