import { config } from '../config';
import logger from './logger';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

class DolibarrProxyService {
  private cache: Map<string, CacheItem<any>> = new Map();
  private cacheTimeout = 60000; // 1 minute default cache

  private getFullUrl(endpoint: string): string {
    const base = config.dolibarr.baseUrl.replace(/\/$/, '');
    const prefix = config.dolibarr.apiPrefix.replace(/^\//, '');
    return `${base}/${prefix}/${endpoint.replace(/^\//, '')}`;
  }

  private getCacheKey(method: string, endpoint: string, params?: Record<string, any>): string {
    return `${method}:${endpoint}:${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(key: string): T | null {
    if (!config.dolibarr.enableCache) return null;

    const item = this.cache.get(key);
    if (!item) return null;

    const isExpired = Date.now() - item.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    if (!config.dolibarr.enableCache) return;
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    useCache = true
  ): Promise<ApiResponse<T>> {
    const cacheKey = this.getCacheKey('GET', endpoint, params);

    // Check cache first
    if (useCache) {
      const cachedData = this.getFromCache<T>(cacheKey);
      if (cachedData !== null) {
        logger.debug(`Cache hit: ${endpoint}`);
        return { success: true, data: cachedData };
      }
    }

    try {
      const url = new URL(this.getFullUrl(endpoint));
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            url.searchParams.append(key, String(value));
          }
        });
      }

      logger.info(`Dolibarr GET: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'DOLAPIKEY': config.dolibarr.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(config.dolibarr.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Dolibarr API Error: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
          statusCode: response.status,
        };
      }

      const data = await response.json();

      // Cache successful GET requests
      if (useCache) {
        this.setCache(cacheKey, data);
      }

      return { success: true, data };
    } catch (error: any) {
      logger.error(`Dolibarr GET Error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }

  async post<T = any>(
    endpoint: string,
    body: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.getFullUrl(endpoint);
      logger.info(`Dolibarr POST: ${url}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'DOLAPIKEY': config.dolibarr.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.dolibarr.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Dolibarr API Error: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
          statusCode: response.status,
        };
      }

      // Clear related cache entries on write operations
      this.clearCache();

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      logger.error(`Dolibarr POST Error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }

  async put<T = any>(
    endpoint: string,
    body: Record<string, any>
  ): Promise<ApiResponse<T>> {
    try {
      const url = this.getFullUrl(endpoint);
      logger.info(`Dolibarr PUT: ${url}`);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'DOLAPIKEY': config.dolibarr.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(config.dolibarr.timeout),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Dolibarr API Error: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
          statusCode: response.status,
        };
      }

      // Clear related cache entries on write operations
      this.clearCache();

      const data = await response.json();
      return { success: true, data };
    } catch (error: any) {
      logger.error(`Dolibarr PUT Error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }

  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const url = this.getFullUrl(endpoint);
      logger.info(`Dolibarr DELETE: ${url}`);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'DOLAPIKEY': config.dolibarr.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(config.dolibarr.timeout),
      });

      if (!response.ok && response.status !== 204) {
        const errorText = await response.text();
        logger.error(`Dolibarr API Error: ${response.status} - ${errorText}`);
        return {
          success: false,
          error: `API Error: ${response.status} - ${errorText}`,
          statusCode: response.status,
        };
      }

      // Clear related cache entries on write operations
      this.clearCache();

      const data = response.status === 204 ? undefined : await response.json();
      return { success: true, data };
    } catch (error: any) {
      logger.error(`Dolibarr DELETE Error: ${error.message}`);
      return {
        success: false,
        error: error.message || 'Request failed',
      };
    }
  }
}

export const dolibarrProxy = new DolibarrProxyService();
export default dolibarrProxy;