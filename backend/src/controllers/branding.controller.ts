import { Request, Response } from 'express';
import prisma from '../config/database';
import { asyncHandler, AppError } from '../middleware/validation.middleware';

/**
 * White-Label & Branding Controller
 * Firma özelleştirmeleri, custom domain yönetimi
 */

// ============================================
// Branding Config - Marka Yapılandırması
// ============================================

/**
 * Tüm branding yapılandırmalarını listele
 */
export const listBrandingConfigs = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id, page = 1, limit = 20 } = req.query;

  const where: any = {};
  if (firm_id) where.firm_id = firm_id;

  const skip = (Number(page) - 1) * Number(limit);

  const [configs, total] = await Promise.all([
    prisma.brandingConfig.findMany({
      where,
      include: { firm: { select: { id: true, name: true } } },
      orderBy: { updated_at: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.brandingConfig.count({ where }),
  ]);

  res.json({
    success: true,
    data: configs,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

/**
 * Belirli bir firmanın branding yapılandırmasını getir
 */
export const getFirmBranding = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;

  const branding = await prisma.brandingConfig.findUnique({
    where: { firm_id },
    include: { firm: { select: { id: true, name: true } } },
  });

  if (!branding) {
    return res.json({
      success: true,
      data: {
        firm_id,
        logo_url: null,
        favicon_url: null,
        primary_color: '#3B82F6',
        secondary_color: '#10B981',
        accent_color: '#F59E0B',
        background_color: '#FFFFFF',
        text_color: '#1F2937',
        font_family: 'Inter, system-ui, sans-serif',
      },
    });
  }

  res.json({ success: true, data: branding });
});

/**
 * Yeni branding yapılandırması oluştur
 */
export const createBrandingConfig = asyncHandler(async (req: Request, res: Response) => {
  const {
    firm_id,
    logo_url,
    favicon_url,
    primary_color,
    secondary_color,
    accent_color,
    background_color,
    text_color,
    font_family,
    custom_css,
  } = req.body;

  if (!firm_id) {
    throw new AppError('Firma ID gerekli', 400);
  }

  const firm = await prisma.firm.findUnique({ where: { id: firm_id } });
  if (!firm) {
    throw new AppError('Firma bulunamadı', 404);
  }

  const existing = await prisma.brandingConfig.findUnique({ where: { firm_id } });
  if (existing) {
    throw new AppError('Bu firma için zaten branding yapılandırması var', 400);
  }

  const branding = await prisma.brandingConfig.create({
    data: {
      firm_id,
      logo_url,
      favicon_url,
      primary_color: primary_color || '#3B82F6',
      secondary_color: secondary_color || '#10B981',
      accent_color: accent_color || '#F59E0B',
      background_color: background_color || '#FFFFFF',
      text_color: text_color || '#1F2937',
      font_family: font_family || 'Inter, system-ui, sans-serif',
    },
  });

  res.status(201).json({
    success: true,
    data: branding,
    message: 'Branding yapılandırması oluşturuldu',
  });
});

/**
 * Branding yapılandırmasını güncelle
 */
export const updateBrandingConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  const branding = await prisma.brandingConfig.update({
    where: { id },
    data: updates,
  });

  res.json({
    success: true,
    data: branding,
    message: 'Branding güncellendi',
  });
});

/**
 * Branding'i sıfırla
 */
export const resetBrandingConfig = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const branding = await prisma.brandingConfig.update({
    where: { id },
    data: {
      logo_url: null,
      favicon_url: null,
      primary_color: '#3B82F6',
      secondary_color: '#10B981',
      accent_color: '#F59E0B',
      background_color: '#FFFFFF',
      text_color: '#1F2937',
      font_family: 'Inter, system-ui, sans-serif',
      footer_text: null,
      footer_links: null,
    },
  });

  res.json({
    success: true,
    data: branding,
    message: 'Branding varsayılana sıfırlandı',
  });
});

// ============================================
// Theme Presets - Tema Hazır Ayarları
// ============================================

/**
 * Önceden tanımlanmış tema presetleri
 */
export const getThemePresets = asyncHandler(async (req: Request, res: Response) => {
  const presets = [
    { id: 'default', name: 'Varsayılan Mavi', primary_color: '#3B82F6', secondary_color: '#10B981', accent_color: '#F59E0B' },
    { id: 'corporate', name: 'Kurumsal Gri', primary_color: '#4B5563', secondary_color: '#059669', accent_color: '#DC2626' },
    { id: 'modern', name: 'Modern Mor', primary_color: '#7C3AED', secondary_color: '#EC4899', accent_color: '#06B6D4' },
    { id: 'nature', name: 'Doğa Yeşili', primary_color: '#059669', secondary_color: '#10B981', accent_color: '#F59E0B' },
    { id: 'warm', name: 'Sıcak Turuncu', primary_color: '#EA580C', secondary_color: '#DC2626', accent_color: '#FBBF24' },
    { id: 'minimal', name: 'Minimal Siyah', primary_color: '#1F2937', secondary_color: '#6B7280', accent_color: '#EF4444' },
  ];

  res.json({ success: true, data: presets });
});

/**
 * Temayı preset'e göre uygula
 */
export const applyThemePreset = asyncHandler(async (req: Request, res: Response) => {
  const { firm_id } = req.params;
  const { preset_id } = req.body;

  const presets: Record<string, any> = {
    default: { primary_color: '#3B82F6', secondary_color: '#10B981', accent_color: '#F59E0B' },
    corporate: { primary_color: '#4B5563', secondary_color: '#059669', accent_color: '#DC2626' },
    modern: { primary_color: '#7C3AED', secondary_color: '#EC4899', accent_color: '#06B6D4' },
    nature: { primary_color: '#059669', secondary_color: '#10B981', accent_color: '#F59E0B' },
    warm: { primary_color: '#EA580C', secondary_color: '#DC2626', accent_color: '#FBBF24' },
    minimal: { primary_color: '#1F2937', secondary_color: '#6B7280', accent_color: '#EF4444' },
  };

  const preset = presets[preset_id];
  if (!preset) {
    throw new AppError('Geçersiz preset ID', 400);
  }

  const existing = await prisma.brandingConfig.findUnique({ where: { firm_id } });

  if (existing) {
    await prisma.brandingConfig.update({
      where: { firm_id },
      data: preset,
    });
  } else {
    await prisma.brandingConfig.create({
      data: { firm_id, ...preset },
    });
  }

  res.json({ success: true, message: `Tema "${preset_id}" uygulandı`, data: preset });
});

/**
 * Branding önizleme (CSS üret)
 */
export const previewBranding = asyncHandler(async (req: Request, res: Response) => {
  const { primary_color, secondary_color, accent_color, font_family } = req.query;

  const css = `
:root {
  --primary-color: ${primary_color || '#3B82F6'};
  --secondary-color: ${secondary_color || '#10B981'};
  --accent-color: ${accent_color || '#F59E0B'};
  --font-family: ${font_family || 'Inter, system-ui, sans-serif'};
}
`.trim();

  res.json({
    success: true,
    data: {
      css,
      variables: {
        primary_color: primary_color || '#3B82F6',
        secondary_color: secondary_color || '#10B981',
        accent_color: accent_color || '#F59E0B',
        font_family: font_family || 'Inter, system-ui, sans-serif',
      },
    },
  });
});

// ============================================
// Helper Functions
// ============================================

function isValidColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

// Note: Custom domain özellikleri için Firm modeline custom_domain, custom_domain_verified, custom_domain_ssl alanları eklenmeli