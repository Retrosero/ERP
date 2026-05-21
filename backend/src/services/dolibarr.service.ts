import crypto from 'crypto';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { DolibarrConfig, DolibarrAPIResponse, DolibarrThirdParty, DolibarrProduct, DolibarrOrder } from '../types';
import prisma from '../config/database';
import { ErrorType } from '@prisma/client';

/**
 * Dolibarr REST API Client
 * Bu servis Dolibarr çekirdeğine dokunmadan API üzerinden iletişim kurar
 */
export class DolibarrService {
  private client: AxiosInstance;
  private firmId: string | null = null;
  private traceId: string = '';

  constructor(config: DolibarrConfig, firmId?: string) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/api/index.php`,
      headers: {
        'DOLAPIKEY': config.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    this.firmId = firmId || null;
    this.traceId = crypto.randomUUID();
  }

  /**
   * Dolibarr API hatalarını veritabanına logla
   */
  private async logError(
    error: AxiosError,
    endpoint: string,
    method: string,
    requestBody?: any,
    module?: string
  ): Promise<void> {
    if (!this.firmId) return;

    try {
      const errorType = this.categorizeError(error);
      const statusCode = error.response?.status;
      const responseData = error.response?.data;

      await prisma.dolibarrErrorLog.create({
        data: {
          firm_id: this.firmId,
          endpoint,
          method,
          status_code: statusCode,
          error_type: errorType as ErrorType,
          error_code: error.response?.status?.toString(),
          error_message: this.extractErrorMessage(error),
          request_body: requestBody ? JSON.stringify(requestBody) : null,
          response_body: responseData ? JSON.stringify(responseData) : null,
          module,
          trace_id: this.traceId,
        },
      });
    } catch (logError) {
      console.error('DolibarrErrorLog kaydedilemedi:', logError);
    }
  }

  /**
   * Hata tipini kategorize et
   */
  private categorizeError(error: AxiosError): string {
    if (!error.response) {
      if (error.code === 'ECONNABORTED') return 'TIMEOUT';
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') return 'CONNECTION_ERROR';
      return 'UNKNOWN';
    }

    const status = error.response.status;
    if (status === 401 || status === 403) return 'AUTH_ERROR';
    if (status === 404) return 'NOT_FOUND';
    if (status === 429) return 'RATE_LIMIT';
    if (status >= 400 && status < 500) return 'VALIDATION_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
    return 'API_ERROR';
  }

  /**
   * Hata mesajını çıkar
   */
  private extractErrorMessage(error: AxiosError): string {
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.error) return data.error;
      if (data.message) return data.message;
      if (data.error_message) return data.error_message;
    }
    return error.message || 'Bilinmeyen hata';
  }

  // ============================================
  // Third Parties (Müşteriler/Tedarikçiler)
  // ============================================

  async getThirdParties(filters?: {
    limit?: number;
    offset?: number;
    sortfield?: string;
    sortorder?: string;
  }): Promise<DolibarrAPIResponse<DolibarrThirdParty[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.sortfield) params.append('sortfield', filters.sortfield);
      if (filters?.sortorder) params.append('sortorder', filters.sortorder);

      const response = await this.client.get(`/thirdparties?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/thirdparties', 'GET', undefined, 'CRM');
      return this.handleError(error);
    }
  }

  async getThirdParty(id: number): Promise<DolibarrAPIResponse<DolibarrThirdParty>> {
    try {
      const response = await this.client.get(`/thirdparties/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/thirdparties/${id}`, 'GET', undefined, 'CRM');
      return this.handleError(error);
    }
  }

  async createThirdParty(data: Partial<DolibarrThirdParty>): Promise<DolibarrAPIResponse<DolibarrThirdParty>> {
    try {
      const response = await this.client.post('/thirdparties', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/thirdparties', 'POST', data, 'CRM');
      return this.handleError(error);
    }
  }

  async updateThirdParty(id: number, data: Partial<DolibarrThirdParty>): Promise<DolibarrAPIResponse<DolibarrThirdParty>> {
    try {
      const response = await this.client.put(`/thirdparties/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/thirdparties/${id}`, 'PUT', data, 'CRM');
      return this.handleError(error);
    }
  }

  async deleteThirdParty(id: number): Promise<DolibarrAPIResponse<{ id: number; deleted: boolean }>> {
    try {
      await this.client.delete(`/thirdparties/${id}`);
      return { success: true, data: { id, deleted: true } };
    } catch (error: any) {
      await this.logError(error, `/thirdparties/${id}`, 'DELETE', undefined, 'CRM');
      return this.handleError(error);
    }
  }

  // ============================================
  // Products (Ürünler)
  // ============================================

  async getProducts(filters?: {
    limit?: number;
    offset?: number;
    sortfield?: string;
    sortorder?: string;
  }): Promise<DolibarrAPIResponse<DolibarrProduct[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await this.client.get(`/products?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/products', 'GET', undefined, 'INVENTORY');
      return this.handleError(error);
    }
  }

  async getProduct(id: number): Promise<DolibarrAPIResponse<DolibarrProduct>> {
    try {
      const response = await this.client.get(`/products/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/products/${id}`, 'GET', undefined, 'INVENTORY');
      return this.handleError(error);
    }
  }

  async createProduct(data: Partial<DolibarrProduct>): Promise<DolibarrAPIResponse<DolibarrProduct>> {
    try {
      const response = await this.client.post('/products', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/products', 'POST', data, 'INVENTORY');
      return this.handleError(error);
    }
  }

  async updateProduct(id: number, data: Partial<DolibarrProduct>): Promise<DolibarrAPIResponse<DolibarrProduct>> {
    try {
      const response = await this.client.put(`/products/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/products/${id}`, 'PUT', data, 'INVENTORY');
      return this.handleError(error);
    }
  }

  async deleteProduct(id: number): Promise<DolibarrAPIResponse<{ id: number; deleted: boolean }>> {
    try {
      await this.client.delete(`/products/${id}`);
      return { success: true, data: { id, deleted: true } };
    } catch (error: any) {
      await this.logError(error, `/products/${id}`, 'DELETE', undefined, 'INVENTORY');
      return this.handleError(error);
    }
  }

  // ============================================
  // Orders (Siparişler)
  // ============================================

  async getOrders(filters?: {
    limit?: number;
    offset?: number;
    sortfield?: string;
    sortorder?: string;
    thirdparty_id?: number;
  }): Promise<DolibarrAPIResponse<DolibarrOrder[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.thirdparty_id) params.append('thirdparty_id', filters.thirdparty_id.toString());

      const response = await this.client.get(`/orders?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/orders', 'GET', undefined, 'SALES');
      return this.handleError(error);
    }
  }

  async getOrder(id: number): Promise<DolibarrAPIResponse<DolibarrOrder>> {
    try {
      const response = await this.client.get(`/orders/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/orders/${id}`, 'GET', undefined, 'SALES');
      return this.handleError(error);
    }
  }

  async createOrder(data: any): Promise<DolibarrAPIResponse<DolibarrOrder>> {
    try {
      const response = await this.client.post('/orders', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/orders', 'POST', data, 'SALES');
      return this.handleError(error);
    }
  }

  async updateOrder(id: number, data: any): Promise<DolibarrAPIResponse<DolibarrOrder>> {
    try {
      const response = await this.client.put(`/orders/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/orders/${id}`, 'PUT', data, 'SALES');
      return this.handleError(error);
    }
  }

  async validateOrder(id: number): Promise<DolibarrAPIResponse<DolibarrOrder>> {
    try {
      const response = await this.client.post(`/orders/${id}/validate`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/orders/${id}/validate`, 'POST', undefined, 'SALES');
      return this.handleError(error);
    }
  }

  // ============================================
  // Invoices (Faturalar)
  // ============================================

  async getInvoices(filters?: {
    limit?: number;
    offset?: number;
    thirdparty_id?: number;
  }): Promise<DolibarrAPIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.thirdparty_id) params.append('thirdparty_id', filters.thirdparty_id.toString());

      const response = await this.client.get(`/invoices?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/invoices', 'GET', undefined, 'ACCOUNTING');
      return this.handleError(error);
    }
  }

  async createInvoice(data: any): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post('/invoices', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/invoices', 'POST', data, 'ACCOUNTING');
      return this.handleError(error);
    }
  }

  async validateInvoice(id: number): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post(`/invoices/${id}/validate`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/invoices/${id}/validate`, 'POST', undefined, 'ACCOUNTING');
      return this.handleError(error);
    }
  }

  // ============================================
  // Projects (Projeler)
  // ============================================

  async getProjects(filters?: {
    limit?: number;
    offset?: number;
  }): Promise<DolibarrAPIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await this.client.get(`/projects?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/projects', 'GET', undefined, 'PROJECT');
      return this.handleError(error);
    }
  }

  async createProject(data: any): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post('/projects', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/projects', 'POST', data, 'PROJECT');
      return this.handleError(error);
    }
  }

  // ============================================
  // Helper Methods
  // ============================================

  private handleError(error: any): DolibarrAPIResponse<any> {
    const message = error.response?.data?.error || error.message || 'Dolibarr API Error';
    const error_code = error.response?.status?.toString();
    return { success: false, error: message, error_code };
  }

  /**
   * Dolibarr'a yeni bir kullanıcı oluştur (User tablosu)
   */
  async createUser(data: {
    lastname: string;
    firstname?: string;
    email: string;
    login?: string;
    password?: string;
    admin?: number;
    status?: number;
  }): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post('/users', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/users', 'POST', data, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Dolibarr kullanıcısını güncelle
   */
  async updateUser(id: number, data: any): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.put(`/users/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/users/${id}`, 'PUT', data, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Dolibarr'dan kullanıcı bilgisi al
   */
  async getUser(id: number): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.get(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/users/${id}`, 'GET', undefined, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Dolibarr'a yeni bir banka hesabı ekle
   */
  async createBankAccount(data: any): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post('/bankaccounts', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/bankaccounts', 'POST', data, 'BANKING');
      return this.handleError(error);
    }
  }

  /**
   * Dolibarr'dan banka hareketlerini al
   */
  async getBankLines(filters?: { limit?: number; offset?: number }): Promise<DolibarrAPIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await this.client.get(`/banklines?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/banklines', 'GET', undefined, 'BANKING');
      return this.handleError(error);
    }
  }

  /**
   * Bağlantı test et
   */
  async testConnection(): Promise<DolibarrAPIResponse<{ connected: boolean; version?: string }>> {
    try {
      const response = await this.client.get('/setup/dates/dates.php?login=restapi');
      return { success: true, data: { connected: true, version: response.headers?.dolibarr_version } };
    } catch (error: any) {
      await this.logError(error, '/setup/dates', 'GET', undefined, 'SYSTEM');
      return { success: false, error: 'Bağlantı başarısız', error_code: 'CONNECTION_FAILED' };
    }
  }

  // ============================================
  // ATTENDANCE / PERSONEL GİRİŞ-ÇIKIŞ
  // ============================================

  /**
   * Personel giriş-çıkış kaydı oluştur (Dolibarr attendance module)
   * Not: Dolibarr 16+ 'attendance' modülü gerektirir
   */
  async createAttendanceRecord(data: {
    fk_user: number;
    date_start: string;
    time_start: string;
    date_end?: string;
    time_end?: string;
    location?: string;
    comment?: string;
  }): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post('/attendance', data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/attendance', 'POST', data, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Personel giriş-çıkış kayıtlarını getir
   */
  async getAttendanceRecords(filters?: {
    fk_user?: number;
    date_start?: string;
    date_end?: string;
    limit?: number;
    offset?: number;
  }): Promise<DolibarrAPIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.fk_user) params.append('fk_user', filters.fk_user.toString());
      if (filters?.date_start) params.append('date_start', filters.date_start);
      if (filters?.date_end) params.append('date_end', filters.date_end);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());

      const response = await this.client.get(`/attendance?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/attendance', 'GET', undefined, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Giriş-çıkış kaydı güncelle
   */
  async updateAttendanceRecord(id: number, data: {
    date_end?: string;
    time_end?: string;
    location?: string;
    comment?: string;
  }): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.put(`/attendance/${id}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/attendance/${id}`, 'PUT', data, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Çıkış kaydı (check-out) oluştur
   */
  async checkOut(id: number, data: {
    date_end: string;
    time_end: string;
    location?: string;
    comment?: string;
  }): Promise<DolibarrAPIResponse<any>> {
    try {
      const response = await this.client.post(`/attendance/${id}/checkout`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, `/attendance/${id}/checkout`, 'POST', data, 'HR');
      return this.handleError(error);
    }
  }

  /**
   * Dolibarr kullanıcı listesi (attendance için)
   */
  async getUsersForAttendance(filters?: {
    status?: number;
    admin?: number;
    limit?: number;
  }): Promise<DolibarrAPIResponse<any[]>> {
    try {
      const params = new URLSearchParams();
      if (filters?.status !== undefined) params.append('status', filters.status.toString());
      if (filters?.admin !== undefined) params.append('admin', filters.admin.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await this.client.get(`/users?${params.toString()}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      await this.logError(error, '/users', 'GET', undefined, 'HR');
      return this.handleError(error);
    }
  }
}

/**
 * Dolibarr servisini factory olarak oluştur
 */
export function createDolibarrService(dolibarrUrl: string, apiKey: string, firmId?: string): DolibarrService {
  // URL'yi temizle
  const cleanUrl = dolibarrUrl.replace(/\/$/, '');
  return new DolibarrService({ baseUrl: cleanUrl, apiKey }, firmId);
}

// ============================================
// API Key Utilities
// ============================================

/**
 * Yeni bir API key oluştur
 */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const key = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(key).digest('hex');
  const keyPrefix = key.substring(0, 8);
  return { key, keyHash, keyPrefix };
}

/**
 * API key hash'ini doğrula
 */
export function verifyApiKey(providedKey: string, storedHash: string): boolean {
  const providedHash = crypto.createHash('sha256').update(providedKey).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(storedHash));
}

/**
 * Webhook signature oluştur (HMAC)
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Webhook signature doğrula
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  const expected = createWebhookSignature(payload, secret);
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}