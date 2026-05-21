/**
 * Dolibarr API Client
 * Handles all communication with Dolibarr REST API
 * Supports both direct connection and proxy server mode
 * Uses ApiContext for configuration so user can set via UI Settings page
 */

import type {
  ThirdParty,
  Product,
  Order,
  Proposal,
  Invoice,
  Payment,
  StockMovement,
  Warehouse,
  ExpenseReport,
  CreateThirdPartyDto,
  CreateOrderDto,
  CreateProposalDto,
  CreatePaymentDto,
  CreateStockMovementDto,
  CreateProductDto,
  CreateExpenseReportDto,
} from '@/lib/types/dolibarr';

// Import the shared config
import { getDolibarrConfig } from '@/contexts/ApiContext';

// Error class for API errors
export class DolibarrApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'DolibarrApiError';
  }
}

const appendDolibarrApiKey = (url: string, apiKey: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}DOLAPIKEY=${encodeURIComponent(apiKey)}`;
};

// Base fetch wrapper with error handling
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getDolibarrConfig();
  const apiKey = (config.apiKey || '').trim();

  if (!config.baseUrl || !apiKey) {
    throw new DolibarrApiError('Dolibarr ayarları yapılandırılmamış. Lütfen Ayarlar sayfasından Dolibarr bağlantısını yapılandırın.', 0);
  }

  // Check if using proxy mode
  const isProxyMode = config.useProxy && config.proxyUrl;

  let url: string;
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (isProxyMode) {
    // Proxy mode: forward request through proxy server
    url = `${config.proxyUrl}${endpoint}`;
    // In proxy mode, we might send session token instead of API key
    // The proxy server will add the Dolibarr API key
    if (config.sessionToken) {
      (headers as Record<string, string>)['X-Session-Token'] = config.sessionToken;
    }
    if (config.sessionId) {
      (headers as Record<string, string>)['X-Session-Id'] = config.sessionId;
    }
  } else {
    // Direct mode: connect directly to Dolibarr
    url = appendDolibarrApiKey(`${config.baseUrl}${config.apiPrefix}${endpoint}`, apiKey);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const rawError = await response.text().catch(() => '');
      const errorData: unknown = (() => {
        if (!rawError) return {};
        try {
          return JSON.parse(rawError);
        } catch {
          return { message: rawError };
        }
      })();

      let errorMessage = `API Hatası: ${response.status}`;
      if (response.status === 401) {
        errorMessage = 'Yetkisiz erişim. Dolibarr API anahtarını kontrol edin.';
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        const errObj = errorData as Record<string, unknown>;
        const direct = errObj.error ?? errObj.message;
        if (typeof direct === 'string') {
          errorMessage = direct;
        } else if (direct && typeof direct === 'object') {
          const nested = direct as Record<string, unknown>;
          errorMessage =
            (typeof nested.message === 'string' && nested.message) ||
            (typeof nested.error === 'string' && nested.error) ||
            errorMessage;
        }
      }

      throw new DolibarrApiError(errorMessage, response.status, errorData);
    }

    // Handle empty responses
    const text = await response.text();
    if (!text) return {} as T;

    return JSON.parse(text) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DolibarrApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DolibarrApiError('İstek zaman aşımına uğradı', 408);
    }
    throw new DolibarrApiError(
      error instanceof Error ? error.message : 'Bilinmeyen hata',
      500
    );
  }
}

// ThirdParty (Müşteri/Tedarikçi) API
export const thirdPartyApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    mode?: 'customer' | 'supplier' | 'all';
    search?: string;
  }): Promise<ThirdParty[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return fetchApi<ThirdParty[]>(`/thirdparties${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<ThirdParty> {
    return fetchApi<ThirdParty>(`/thirdparties/${id}`);
  },

  async create(data: CreateThirdPartyDto): Promise<ThirdParty> {
    return fetchApi<ThirdParty>('/thirdparties', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<ThirdParty>): Promise<ThirdParty> {
    return fetchApi<ThirdParty>(`/thirdparties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchApi<void>(`/thirdparties/${id}`, {
      method: 'DELETE',
    });
  },
};

// Product (Ürün/Hizmet) API
export const productApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    mode?: 'customer' | 'service';
    search?: string;
    category?: number;
  }): Promise<Product[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.category) queryParams.set('category', String(params.category));

    const query = queryParams.toString();
    const endpoint = `/products${query ? `?${query}` : ''}`;
    try {
      return await fetchApi<Product[]>(endpoint);
    } catch (error) {
      // Some Dolibarr setups reject optional params with HTTP 400.
      if (error instanceof DolibarrApiError && error.status === 400) {
        return fetchApi<Product[]>('/products?sortfield=t.rowid&sortorder=ASC&limit=100');
      }
      throw error;
    }
  },

  async get(id: number): Promise<Product> {
    return fetchApi<Product>(`/products/${id}`);
  },

  async getStock(id: number): Promise<{ warehouse_id: number; stock: number; stock_reel: number }[]> {
    return fetchApi<{ warehouse_id: number; stock: number; stock_reel: number }[]>(
      `/products/${id}/stock`
    );
  },

  async getPrice(id: number): Promise<{ price: number; price_ttc: number; price_min: number }> {
    return fetchApi<{ price: number; price_ttc: number; price_min: number }>(
      `/products/${id}/price`
    );
  },

  async create(data: CreateProductDto): Promise<Product> {
    return fetchApi<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Product>): Promise<Product> {
    return fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async delete(id: number): Promise<void> {
    return fetchApi<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },
};

// Order (Sipariş) API
export const orderApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number | number[];
    thirdparty_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Order[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => queryParams.append('status', String(s)));
      } else {
        queryParams.set('status', String(params.status));
      }
    }
    if (params?.thirdparty_id) queryParams.set('thirdparty_id', String(params.thirdparty_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<Order[]>(`/orders${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<Order> {
    return fetchApi<Order>(`/orders/${id}`);
  },

  async create(data: CreateOrderDto): Promise<Order> {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Order>): Promise<Order> {
    return fetchApi<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async validate(id: number): Promise<Order> {
    return fetchApi<Order>(`/orders/${id}/settorol`, {
      method: 'POST',
    });
  },

  async cancel(id: number): Promise<Order> {
    return fetchApi<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
    });
  },
};

// Proposal (Teklif) API
export const proposalApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number | number[];
    thirdparty_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Proposal[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => queryParams.append('status', String(s)));
      } else {
        queryParams.set('status', String(params.status));
      }
    }
    if (params?.thirdparty_id) queryParams.set('thirdparty_id', String(params.thirdparty_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<Proposal[]>(`/proposals${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<Proposal> {
    return fetchApi<Proposal>(`/proposals/${id}`);
  },

  async create(data: CreateProposalDto): Promise<Proposal> {
    return fetchApi<Proposal>('/proposals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<Proposal>): Promise<Proposal> {
    return fetchApi<Proposal>(`/proposals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async validate(id: number): Promise<Proposal> {
    return fetchApi<Proposal>(`/proposals/${id}/settorol`, {
      method: 'POST',
    });
  },

  async close(id: number, status: 'won' | 'lost'): Promise<Proposal> {
    return fetchApi<Proposal>(`/proposals/${id}/setclosed`, {
      method: 'POST',
      body: JSON.stringify({ fk_pdf_template: status === 'won' ? 1 : -1 }),
    });
  },
};

// Invoice (Fatura) API
export const invoiceApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number | number[];
    thirdparty_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Invoice[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => queryParams.append('status', String(s)));
      } else {
        queryParams.set('status', String(params.status));
      }
    }
    if (params?.thirdparty_id) queryParams.set('thirdparty_id', String(params.thirdparty_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<Invoice[]>(`/invoices${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<Invoice> {
    return fetchApi<Invoice>(`/invoices/${id}`);
  },

  async create(data: Partial<Invoice>): Promise<Invoice> {
    return fetchApi<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async validate(id: number): Promise<Invoice> {
    return fetchApi<Invoice>(`/invoices/${id}/setaspaid`, {
      method: 'POST',
    });
  },
};

// Payment (Ödeme) API
export const paymentApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    thirdparty_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Payment[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.thirdparty_id) queryParams.set('thirdparty_id', String(params.thirdparty_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<Payment[]>(`/paymentinvoices${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<Payment> {
    return fetchApi<Payment>(`/paymentinvoices/${id}`);
  },

  async create(data: CreatePaymentDto): Promise<Payment> {
    return fetchApi<Payment>('/paymentinvoices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Expense Report API
export const expenseApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: string;
    user_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<ExpenseReport[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status) queryParams.set('status', params.status);
    if (params?.user_id) queryParams.set('user_id', String(params.user_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<ExpenseReport[]>(`/expensereports${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>(`/expensereports/${id}`);
  },

  async create(data: CreateExpenseReportDto): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>('/expensereports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<ExpenseReport>): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>(`/expensereports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async approve(id: number): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>(`/expensereports/${id}/approve`, {
      method: 'POST',
    });
  },

  async reject(id: number): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>(`/expensereports/${id}/refuse`, {
      method: 'POST',
    });
  },

  async markPaid(id: number): Promise<ExpenseReport> {
    return fetchApi<ExpenseReport>(`/expensereports/${id}/paided`, {
      method: 'POST',
    });
  },
};

// Stock & Warehouse API
export const warehouseApi = {
  async list(): Promise<Warehouse[]> {
    return fetchApi<Warehouse[]>('/warehouses');
  },

  async get(id: number): Promise<Warehouse> {
    return fetchApi<Warehouse>(`/warehouses/${id}`);
  },

  async getStock(warehouseId: number): Promise<{ product_id: number; stock: number; stock_reel: number }[]> {
    return fetchApi<{ product_id: number; stock: number; stock_reel: number }[]>(
      `/warehouses/${warehouseId}/stock`
    );
  },

  async getProductStock(productId: number): Promise<{ warehouse_id: number; stock: number; stock_reel: number }[]> {
    return fetchApi<{ warehouse_id: number; stock: number; stock_reel: number }[]>(
      `/products/${productId}/stock`
    );
  },
};

// Stock Movement API
export const stockApi = {
  async listMovements(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    product_id?: number;
    warehouse_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<StockMovement[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.product_id) queryParams.set('product_id', String(params.product_id));
    if (params?.warehouse_id) queryParams.set('warehouse_id', String(params.warehouse_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchApi<StockMovement[]>(`/stockmovements${query ? `?${query}` : ''}`);
  },

  async createMovement(data: CreateStockMovementDto): Promise<StockMovement> {
    return fetchApi<StockMovement>('/stockmovements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// System API
export const systemApi = {
  async testConnection(): Promise<{ status: string; version: string }> {
    return fetchApi<{ status: string; version: string }>('/setup/dolibarr');
  },

  async getCurrentUser(): Promise<{ id: number; name: string; admin: boolean }> {
    return fetchApi<{ id: number; name: string; admin: boolean }>('/user');
  },

  // Health check for proxy mode
  async healthCheck(): Promise<{ status: string; dolibarr: string; timestamp: string }> {
    return fetchApi<{ status: string; dolibarr: string; timestamp: string }>('/health');
  },
};

// Auth API for proxy mode
export const authApi = {
  async login(username: string, password: string): Promise<{
    success: boolean;
    sessionId?: string;
    token?: string;
    user?: { id: string; role: string };
  }> {
    const response = await fetch(`${getDolibarrConfig().proxyUrl || '/api'}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  async logout(): Promise<{ success: boolean }> {
    const response = await fetch(`${getDolibarrConfig().proxyUrl || '/api'}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getDolibarrConfig().sessionId || '',
        'X-Session-Token': getDolibarrConfig().sessionToken || '',
      },
    });
    return response.json();
  },

  async checkSession(): Promise<{
    authenticated: boolean;
    user: { id: string; role: string } | null;
  }> {
    const response = await fetch(`${getDolibarrConfig().proxyUrl || '/api'}/auth/check`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Session-Id': getDolibarrConfig().sessionId || '',
        'X-Session-Token': getDolibarrConfig().sessionToken || '',
      },
    });
    return response.json();
  },
};

export interface AgendaEventDto {
  id: number;
  label?: string;
  datep?: string | number;
  datef?: string | number;
  userownerid?: number;
  fk_user_action?: number;
  note_private?: string;
  note_public?: string;
}

export const agendaApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    user_ids?: string;
    date_start?: string;
    date_end?: string;
  }): Promise<AgendaEventDto[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.user_ids) queryParams.set('user_ids', params.user_ids);
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);
    const query = queryParams.toString();
    return fetchApi<AgendaEventDto[]>(`/agendaevents${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<AgendaEventDto> {
    return fetchApi<AgendaEventDto>(`/agendaevents/${id}`);
  },

  async create(data: Partial<AgendaEventDto> & Record<string, unknown>): Promise<number | AgendaEventDto> {
    return fetchApi<number | AgendaEventDto>('/agendaevents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<AgendaEventDto> & Record<string, unknown>): Promise<unknown> {
    return fetchApi<unknown>(`/agendaevents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
