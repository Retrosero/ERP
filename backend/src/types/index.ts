import { Request } from 'express';

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Auth Types
// ============================================

export interface JWTPayload {
  sub: string;
  firmId: string | null;
  email: string;
  role: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface FirmContext {
  id: string;
  name: string;
  plan: string;
  modules: string[];
  maxUsers: number;
  maxStorageGb: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
  firm?: FirmContext;
}

// ============================================
// Prisma Enum Types (as strings for use with Prisma client)
// ============================================

export type ModuleType =
  | 'CRM' | 'INVENTORY' | 'PROJECT' | 'HR'
  | 'SALES' | 'POS' | 'ECOMMERCE'
  | 'ACCOUNTING' | 'BANKING'
  | 'CALENDAR' | 'WEBHOOKS' | 'API_ACCESS'
  | 'ANALYTICS' | 'REPORTING' | 'INTEGRATION';

export type FirmPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';

export type FirmStatus = 'PENDING' | 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEWER';

// ============================================
// Firm Types
// ============================================

export interface CreateFirmInput {
  name: string;
  short_name?: string;
  email: string;
  phone?: string;
  tax_id?: string;
  address?: string;
  dolibarr_url: string;
  dolibarr_api_key: string;
  plan?: string;
  subdomain?: string;
}

export interface UpdateFirmInput {
  name?: string;
  short_name?: string;
  email?: string;
  phone?: string;
  tax_id?: string;
  address?: string;
  dolibarr_url?: string;
  dolibarr_api_key?: string;
  plan?: string;
  status?: string;
  max_users?: number;
  max_storage_gb?: number;
  subdomain?: string;
}

export interface FirmWithModules {
  id: string;
  name: string;
  email: string;
  plan: string;
  status: string;
  subdomain: string | null;
  modules: {
    module: string;
    is_active: boolean;
    expires_at: Date | null;
    is_trial: boolean;
    trial_ends_at: Date | null;
  }[];
  user_count: number;
  created_at: Date;
}

// ============================================
// Module Types
// ============================================

export interface ActivateModuleInput {
  firm_id: string;
  module: string;
  duration_days?: number;
  is_trial?: boolean;
}

export interface ModuleAccessCheck {
  hasAccess: boolean;
  module: string;
  is_trial: boolean;
  expires_at: Date | null;
  days_remaining?: number;
}

// ============================================
// User Types
// ============================================

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  surname?: string;
  phone?: string;
  role?: string;
}

export interface UpdateUserInput {
  email?: string;
  name?: string;
  surname?: string;
  phone?: string;
  role?: string;
  is_active?: boolean;
}

// ============================================
// API Key Types
// ============================================

export interface CreateApiKeyInput {
  firm_id: string;
  name: string;
  permissions: string[];
  expires_at?: Date;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  key_prefix: string;
  permissions: string[];
  expires_at: Date | null;
  is_active: boolean;
  created_at: Date;
}

// ============================================
// Webhook Types
// ============================================

export interface CreateWebhookInput {
  firm_id: string;
  name: string;
  url: string;
  secret?: string;
  events: string[];
  headers?: Record<string, string>;
}

export interface WebhookDeliveryResult {
  success: boolean;
  status_code?: number;
  duration_ms?: number;
  error?: string;
}

export type WebhookEvent =
  | 'firm.created'
  | 'firm.suspended'
  | 'firm.cancelled'
  | 'user.created'
  | 'user.deleted'
  | 'module.activated'
  | 'module.deactivated'
  | 'subscription.upgraded'
  | 'subscription.downgraded';

// ============================================
// Dolibarr Integration Types
// ============================================

export interface DolibarrConfig {
  baseUrl: string;
  apiKey: string;
}

export interface DolibarrAPIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  error_code?: string;
}

export interface DolibarrThirdParty {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  town?: string;
  zip?: string;
  country?: string;
  client?: number;
  supplier?: number;
  code_client?: string;
  code_fournisseur?: string;
}

export interface DolibarrProduct {
  id: number;
  ref: string;
  label: string;
  description?: string;
  price: number;
  price_ttc?: number;
  tva_tx?: number;
  stock_reel?: number;
  status?: number;
}

export interface DolibarrOrder {
  id: number;
  ref: string;
  ref_client?: string;
  thirdparty_id: number;
  date: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  status: string;
}

// ============================================
// Plan Types
// ============================================

export interface PlanFeatures {
  maxUsers: number;
  maxStorageGb: number;
  maxApiCalls: number | null;
  modules: string[];
  features: {
    name: string;
    included: boolean;
  }[];
}

export const PLAN_FEATURES: Record<string, PlanFeatures> = {
  STARTER: {
    maxUsers: 5,
    maxStorageGb: 10,
    maxApiCalls: 10000,
    modules: ['CRM', 'INVENTORY', 'SALES'],
    features: [
      { name: 'Temel CRM', included: true },
      { name: 'Stok Yönetimi', included: true },
      { name: 'Satış Takibi', included: true },
      { name: 'Proje Yönetimi', included: false },
      { name: 'İK Modülü', included: false },
      { name: 'Muhasebe', included: false },
      { name: 'POS', included: false },
      { name: 'Gelişmiş Raporlama', included: false },
    ],
  },
  PROFESSIONAL: {
    maxUsers: 25,
    maxStorageGb: 50,
    maxApiCalls: 50000,
    modules: ['CRM', 'INVENTORY', 'PROJECT', 'HR', 'SALES', 'POS', 'ACCOUNTING', 'BANKING', 'CALENDAR', 'ANALYTICS'],
    features: [
      { name: 'Temel CRM', included: true },
      { name: 'Stok Yönetimi', included: true },
      { name: 'Satış Takibi', included: true },
      { name: 'Proje Yönetimi', included: true },
      { name: 'İK Modülü', included: true },
      { name: 'Muhasebe', included: true },
      { name: 'POS', included: true },
      { name: 'Gelişmiş Raporlama', included: true },
      { name: 'API Erişimi', included: true },
      { name: 'Webhooks', included: true },
    ],
  },
  ENTERPRISE: {
    maxUsers: 999999,
    maxStorageGb: 1000,
    maxApiCalls: null,
    modules: ['CRM', 'INVENTORY', 'PROJECT', 'HR', 'SALES', 'POS', 'ECOMMERCE', 'ACCOUNTING', 'BANKING', 'CALENDAR', 'WEBHOOKS', 'API_ACCESS', 'ANALYTICS', 'REPORTING', 'INTEGRATION'],
    features: [
      { name: 'Temel CRM', included: true },
      { name: 'Stok Yönetimi', included: true },
      { name: 'Satış Takibi', included: true },
      { name: 'Proje Yönetimi', included: true },
      { name: 'İK Modülü', included: true },
      { name: 'Muhasebe', included: true },
      { name: 'POS', included: true },
      { name: 'E-Ticaret', included: true },
      { name: 'Gelişmiş Raporlama', included: true },
      { name: 'API Erişimi', included: true },
      { name: 'Webhooks', included: true },
      { name: 'Entegrasyonlar', included: true },
      { name: 'Özel Destek', included: true },
    ],
  },
};

// ============================================
// Constants
// ============================================

export const MODULE_LABELS: Record<string, string> = {
  CRM: 'Müşteri İlişkileri Yönetimi (CRM)',
  INVENTORY: 'Stok ve Envanter Yönetimi',
  PROJECT: 'Proje Yönetimi',
  HR: 'İnsan Kaynakları (İK)',
  SALES: 'Satış ve Teklifler',
  POS: 'Satış Noktası (POS)',
  ECOMMERCE: 'E-Ticaret',
  ACCOUNTING: 'Muhasebe ve Finans',
  BANKING: 'Banka ve Ödeme Yönetimi',
  CALENDAR: 'Takvim ve Randevular',
  WEBHOOKS: 'Webhook Entegrasyonları',
  API_ACCESS: 'API Erişimi',
  ANALYTICS: 'Analitik ve Raporlama',
  REPORTING: 'Gelişmiş Raporlama',
  INTEGRATION: 'Dış Entegrasyonlar',
};

export const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Başlangıç',
  PROFESSIONAL: 'Profesyonel',
  ENTERPRISE: 'Kurumsal',
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Beklemede',
  TRIAL: 'Deneme Süresi',
  ACTIVE: 'Aktif',
  SUSPENDED: 'Askıya Alınmış',
  CANCELLED: 'İptal Edildi',
};