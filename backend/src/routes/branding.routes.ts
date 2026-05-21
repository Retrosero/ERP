import { Router } from 'express';
import { superAdminAuth } from '../middleware/auth.middleware';
import { validateBody } from '../middleware/validation.middleware';
import { z } from 'zod';
import {
  listBrandingConfigs,
  getFirmBranding,
  createBrandingConfig,
  updateBrandingConfig,
  resetBrandingConfig,
  getThemePresets,
  applyThemePreset,
  previewBranding,
} from '../controllers/branding.controller';

// ============================================
// Validation Schemas
// ============================================

const createBrandingSchema = z.object({
  firm_id: z.string().uuid(),
  logo_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  font_family: z.string().optional(),
  custom_css: z.string().optional(),
});

const updateBrandingSchema = z.object({
  logo_url: z.string().url().optional(),
  favicon_url: z.string().url().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  background_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  text_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  font_family: z.string().optional(),
  custom_css: z.string().optional(),
  is_active: z.boolean().optional(),
});

const applyPresetSchema = z.object({
  preset_id: z.enum(['default', 'corporate', 'modern', 'nature', 'warm', 'minimal']),
});

// ============================================
// Router
// ============================================

const router = Router();

// ============================================
// Branding Config Routes
// ============================================

// List all branding configs
router.get('/branding', superAdminAuth, listBrandingConfigs);

// Get firm branding
router.get('/branding/firm/:firm_id', superAdminAuth, getFirmBranding);

// Create branding config
router.post('/branding', superAdminAuth, validateBody(createBrandingSchema), createBrandingConfig);

// Update branding config
router.put('/branding/:id', superAdminAuth, validateBody(updateBrandingSchema), updateBrandingConfig);

// Reset branding to defaults
router.post('/branding/:id/reset', superAdminAuth, resetBrandingConfig);

// ============================================
// Theme Presets Routes
// ============================================

// Get available theme presets
router.get('/themes/presets', superAdminAuth, getThemePresets);

// Apply theme preset
router.post('/themes/firm/:firm_id/apply', superAdminAuth, validateBody(applyPresetSchema), applyThemePreset);

// Preview branding (generate CSS)
router.get('/themes/preview', previewBranding);

export default router;