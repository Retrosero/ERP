import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';

/**
 * IP Erişim Kontrol Kuralları
 */

// ============================================
// IP Rules - Super Admin
// ============================================

/**
 * Tüm IP kurallarını listele
 */
export const listIpRules = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, rule_type, is_active } = req.query;

  const where: any = {};
  if (firm_id) where.firm_id = firm_id;
  if (rule_type) where.rule_type = rule_type;
  if (is_active !== undefined) where.is_active = is_active === 'true';

  const rules = await prisma.ipAccessRule.findMany({
    where,
    include: {
      firm: { select: { id: true, name: true } },
    },
    orderBy: [{ priority: 'asc' }, { created_at: 'desc' }],
  });

  res.json({
    success: true,
    data: rules,
  });
});

/**
 * IP kuralı oluştur
 */
export const createIpRule = asyncHandler(async (req: Request, res: Response) => {
  const {
    firm_id,
    ip_address,
    ip_version = 'IPV4',
    rule_type,
    description,
    start_time,
    end_time,
    days_of_week,
    priority = 0,
  } = req.body;

  // IP format validasyonu
  if (!isValidIpOrCidr(ip_address)) {
    throw new AppError('Geçersiz IP adresi veya CIDR formatı', 400);
  }

  const rule = await prisma.ipAccessRule.create({
    data: {
      firm_id: firm_id || null,
      ip_address,
      ip_version,
      rule_type,
      description,
      start_time: start_time ? new Date(start_time) : null,
      end_time: end_time ? new Date(end_time) : null,
      days_of_week: days_of_week || [],
      priority,
      created_by: (req as any).user?.sub,
    },
  });

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user?.sub || 'system',
      action: 'CREATE_IP_RULE',
      entity_type: 'ip_access_rule',
      entity_id: rule.id,
      details: { ip_address, rule_type },
    },
  });

  res.status(201).json({
    success: true,
    data: rule,
    message: 'IP kuralı oluşturuldu',
  });
});

/**
 * IP kuralını güncelle
 */
export const updateIpRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // IP validasyonu
  if (updates.ip_address && !isValidIpOrCidr(updates.ip_address)) {
    throw new AppError('Geçersiz IP adresi veya CIDR formatı', 400);
  }

  const rule = await prisma.ipAccessRule.update({
    where: { id },
    data: {
      ...updates,
      start_time: updates.start_time ? new Date(updates.start_time) : undefined,
      end_time: updates.end_time ? new Date(updates.end_time) : undefined,
    },
  });

  res.json({
    success: true,
    data: rule,
    message: 'IP kuralı güncellendi',
  });
});

/**
 * IP kuralını sil
 */
export const deleteIpRule = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.ipAccessRule.delete({ where: { id } });

  res.json({
    success: true,
    message: 'IP kuralı silindi',
  });
});

/**
 * IP erişim kontrolü
 */
export const checkIpAccess = asyncHandler(async (req: Request, res: Response) => {
  const { ip_address, firm_id } = req.body;

  if (!ip_address) {
    throw new AppError('IP adresi gerekli', 400);
  }

  // Firmanın kurallarını al (varsa)
  const firmRules = firm_id
    ? await prisma.ipAccessRule.findMany({
        where: { firm_id, is_active: true },
        orderBy: { priority: 'asc' },
      })
    : [];

  // Global kuralları al
  const globalRules = await prisma.ipAccessRule.findMany({
    where: { firm_id: null, is_active: true },
    orderBy: { priority: 'asc' },
  });

  const allRules = [...firmRules, ...globalRules];

  // IP'yi kontrol et
  const hasWhitelistRule = allRules.some(r => r.rule_type === 'WHITELIST');
  const isBlacklisted = allRules.some(r =>
    r.rule_type === 'BLACKLIST' && matchIp(ip_address, r.ip_address)
  );
  const isWhitelisted = allRules.some(r =>
    r.rule_type === 'WHITELIST' && matchIp(ip_address, r.ip_address)
  );

  let access = true;
  let reason = '';

  if (isBlacklisted) {
    access = false;
    reason = 'Bu IP adresi kara listede';
  } else if (hasWhitelistRule && !isWhitelisted) {
    access = false;
    reason = 'Bu IP adresi beyaz listede değil';
  }

  res.json({
    success: true,
    data: {
      ip_address,
      allowed: access,
      reason,
      matched_rules: allRules
        .filter(r => matchIp(ip_address, r.ip_address))
        .map(r => ({ type: r.rule_type, description: r.description })),
    },
  });
});

// ============================================
// Sessions - Oturum Yönetimi
// ============================================

/**
 * Kullanıcının oturumlarını listele
 */
export const listUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, user_type } = req.query;

  const where: any = { is_active: true };
  if (user_id) where.user_id = user_id;
  if (user_type) where.user_type = user_type;

  const sessions = await prisma.session.findMany({
    where,
    orderBy: { last_active_at: 'desc' },
  });

  // Token hash'lerini gizle
  const safeSessions = sessions.map(s => ({
    ...s,
    token_hash: s.token_hash.substring(0, 8) + '...',
  }));

  res.json({
    success: true,
    data: safeSessions,
  });
});

/**
 * Belirli bir oturumu sonlandır
 */
export const revokeSession = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const session = await prisma.session.update({
    where: { id },
    data: {
      is_active: false,
      revoked_at: new Date(),
    },
  });

  // Log
  await prisma.adminLog.create({
    data: {
      admin_id: (req as any).user?.sub,
      action: 'REVOKE_SESSION',
      entity_type: 'session',
      entity_id: id,
      details: { user_id: session.user_id },
    },
  });

  res.json({
    success: true,
    message: 'Oturum sonlandırıldı',
  });
});

/**
 * Kullanıcının tüm oturumlarını sonlandır (çıkış yap)
 */
export const revokeAllUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const { user_id, keep_current = true } = req.body;

  if (!user_id) {
    throw new AppError('Kullanıcı ID gerekli', 400);
  }

  const where: any = { user_id, is_active: true };
  if (keep_current) {
    where.is_current = false;
  }

  const result = await prisma.session.updateMany({
    where,
    data: {
      is_active: false,
      revoked_at: new Date(),
    },
  });

  res.json({
    success: true,
    message: `${result.count} oturum sonlandırıldı`,
    data: { revoked_count: result.count },
  });
});

/**
 * Süresi dolmuş oturumları temizle
 */
export const cleanupExpiredSessions = asyncHandler(async (req: Request, res: Response) => {
  const result = await prisma.session.updateMany({
    where: {
      is_active: true,
      expires_at: { lt: new Date() },
    },
    data: {
      is_active: false,
      revoked_at: new Date(),
    },
  });

  res.json({
    success: true,
    message: `${result.count} süresi dolmuş oturum temizlendi`,
    data: { cleaned_count: result.count },
  });
});

/**
 * Yeni oturum kaydı oluştur
 */
export const createSession = asyncHandler(async (req: Request, res: Response) => {
  const {
    user_id,
    user_type,
    firm_id,
    token,
    ip_address,
    user_agent,
    expires_at,
    device_type,
    browser,
    os,
  } = req.body;

  // Token hash oluştur
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const session = await prisma.session.create({
    data: {
      user_id,
      user_type,
      firm_id: firm_id || null,
      token_hash: tokenHash,
      ip_address,
      user_agent,
      expires_at: new Date(expires_at),
      device_type,
      browser,
      os,
    },
  });

  res.status(201).json({
    success: true,
    data: {
      id: session.id,
      created_at: session.created_at,
      expires_at: session.expires_at,
    },
  });
});

// ============================================
// Helper Functions
// ============================================

/**
 * IP adresi veya CIDR formatını doğrula
 */
function isValidIpOrCidr(ip: string): boolean {
  // IPv4
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
  // IPv6
  const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^(([0-9a-fA-F]{1,4}:){1,7}|:):((:[0-9a-fA-F]{1,4}){1,7})?:$/;

  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * IP adresi eşleşmesini kontrol et
 */
function matchIp(ip: string, rule: string): boolean {
  // Tam eşleşme
  if (ip === rule) return true;

  // CIDR eşleşmesi
  if (rule.includes('/')) {
    const [range, bits] = rule.split('/');
    return matchCidr(ip, range, parseInt(bits));
  }

  return false;
}

/**
 * CIDR notation ile IP eşleşmesi
 */
function matchCidr(ip: string, range: string, bits: number): boolean {
  const ipNum = ipToNumber(ip);
  const rangeNum = ipToNumber(range);
  const mask = ~((1 << (32 - bits)) - 1);

  return (ipNum & mask) === (rangeNum & mask);
}

/**
 * IP'yi numaraya çevir
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  return (parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3];
}