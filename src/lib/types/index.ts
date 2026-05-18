// Application Types

export type UserRole = 'admin' | 'manager' | 'sales' | 'warehouse' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  permission?: UserRole[];
  badge?: number;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface Filter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'like' | 'in' | 'between';
  value: string | number | string[] | number[];
}

export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

export interface PaginationConfig {
  page: number;
  per_page: number;
  total: number;
}

// Dashboard types
export interface DashboardStats {
  todaySales: number;
  todaySalesChange: number;
  openOrders: number;
  openOrdersChange: number;
  criticalStock: number;
  criticalStockChange: number;
  pendingCollections: number;
  pendingCollectionsChange: number;
}

export interface RecentActivity {
  id: string;
  type: 'order' | 'proposal' | 'invoice' | 'payment' | 'stock';
  title: string;
  description: string;
  timestamp: string;
  link: string;
}

// Quick action
export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  path: string;
  color?: string;
}

// Table column config
export interface ColumnConfig<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => React.ReactNode;
}

// Form field config
export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'email' | 'phone' | 'select' | 'multiselect' | 'textarea' | 'date' | 'datetime' | 'currency' | 'checkbox' | 'radio';
  placeholder?: string;
  required?: boolean;
  options?: { value: string | number; label: string }[];
  validation?: {
    pattern?: RegExp;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    message?: string;
  };
  dependsOn?: { field: string; value: unknown };
  gridSpan?: number;
}

// Modal config
export interface ModalConfig {
  open: boolean;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closable?: boolean;
  footer?: {
    show: boolean;
    cancelLabel?: string;
    confirmLabel?: string;
  };
}

// App settings
export interface AppSettings {
  companyName: string;
  dolibarr: {
    baseUrl: string;
    apiKey: string;
    apiPrefix: string;
    timeout: number;
  };
  theme: 'light' | 'dark' | 'auto';
  language: 'tr' | 'en';
}

// Order status options
export const ORDER_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  VALIDATED: { value: 1, label: 'Onaylandı', color: 'blue' },
  SHIPPED: { value: 2, label: 'Sevk Edildi', color: 'amber' },
  DELIVERED: { value: 3, label: 'Teslim Edildi', color: 'green' },
  CLOSED: { value: 4, label: 'Kapatıldı', color: 'purple' },
  CANCELLED: { value: -1, label: 'İptal', color: 'red' },
} as const;

// Proposal status options
export const PROPOSAL_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  SENT: { value: 1, label: 'Gönderildi', color: 'blue' },
  SIGNED: { value: 2, label: 'İmzalandı', color: 'green' },
  NOTSIGNED: { value: 3, label: 'İmzalanmadı', color: 'amber' },
  CLOSED_WON: { value: 4, label: 'Kazanıldı', color: 'green' },
  CLOSED_LOST: { value: 5, label: 'Kaybedildi', color: 'red' },
} as const;

// Invoice status options
export const INVOICE_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  VALIDATED: { value: 1, label: 'Onaylandı', color: 'blue' },
  PAID: { value: 2, label: 'Ödendi', color: 'green' },
  CANCELLED: { value: 3, label: 'İptal', color: 'red' },
} as const;

// Stock movement types
export const STOCK_MOVEMENT_TYPE = {
  ENTRY: { value: 0, label: 'Giriş' },
  EXIT: { value: 1, label: 'Çıkış' },
  TRANSFER: { value: 2, label: 'Transfer' },
} as const;