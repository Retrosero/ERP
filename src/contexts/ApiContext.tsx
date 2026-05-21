import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ApiConfig {
  baseUrl: string;
  apiKey: string;
  apiPrefix: string;
  timeout: number;
  companyId?: string;
  enableCache: boolean;
  isConnected: boolean;
  lastTested?: string;
  // Proxy mode settings
  useProxy: boolean;
  proxyUrl: string;
  sessionId?: string;
  sessionToken?: string;
}

interface ApiContextType {
  config: ApiConfig;
  updateConfig: (config: Partial<ApiConfig>) => void;
  testConnection: (overrides?: Partial<ApiConfig>) => Promise<boolean>;
  isLoading: boolean;
}

const defaultConfig: ApiConfig = {
  baseUrl: '',
  apiKey: '',
  apiPrefix: '/api/index.php',
  timeout: 30000,
  companyId: '',
  enableCache: true,
  isConnected: false,
  lastTested: undefined,
  // Proxy mode defaults (disabled by default for security)
  useProxy: false,
  proxyUrl: '',
  sessionId: undefined,
  sessionToken: undefined,
};

const ApiContext = createContext<ApiContextType | undefined>(undefined);

const STORAGE_KEY = 'dolibarr_panel_config';
const normalizeApiKey = (value?: string): string =>
  (value || '')
    .replace(/^Bearer\s+/i, '')
    .replace(/\s+/g, '')
    .trim();

const appendDolibarrApiKey = (url: string, apiKey: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}DOLAPIKEY=${encodeURIComponent(apiKey)}`;
};

export function ApiProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ApiConfig>(() => {
    // Load from localStorage on mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultConfig, ...parsed };
      }
    } catch {
      // Ignore errors
    }
    return defaultConfig;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Save to localStorage when config changes
  useEffect(() => {
    try {
      const toStore = {
        baseUrl: config.baseUrl,
        apiPrefix: config.apiPrefix,
        timeout: config.timeout,
        companyId: config.companyId,
        enableCache: config.enableCache,
        useProxy: config.useProxy,
        proxyUrl: config.proxyUrl,
        // Don't store API key in localStorage for security
        // Don't store session info in localStorage
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore errors
    }
  }, [config]);

  const updateConfig = (updates: Partial<ApiConfig>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  const testConnection = async (overrides?: Partial<ApiConfig>): Promise<boolean> => {
    setIsLoading(true);
    try {
      const effectiveConfig: ApiConfig = { ...config, ...overrides };
      const sessionApiKey = normalizeApiKey(sessionStorage.getItem('dolibarr_api_key') || '');
      const effectiveApiKey = normalizeApiKey(effectiveConfig.apiKey || sessionApiKey);

      let url: string;
      let headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (effectiveConfig.useProxy && effectiveConfig.proxyUrl) {
        // Proxy mode: test proxy connection
        url = `${effectiveConfig.proxyUrl}/health`;
      } else {
        // Direct mode: test Dolibarr connection
        if (!effectiveConfig.baseUrl || !effectiveApiKey) {
          return false;
        }
        const base = `${effectiveConfig.baseUrl}${effectiveConfig.apiPrefix}`;
        const testEndpoints = [`${base}/status`, `${base}/users/info`];

        let success = false;
        for (const endpointUrl of testEndpoints) {
          const response = await fetch(appendDolibarrApiKey(endpointUrl, effectiveApiKey), {
            method: 'GET',
            headers,
            signal: AbortSignal.timeout(10000),
          });
          if (response.ok) {
            success = true;
            break;
          }
          if (response.status === 401) {
            continue;
          }
        }

        setConfig((prev) => ({
          ...prev,
          isConnected: success,
          lastTested: new Date().toISOString(),
        }));
        return success;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(10000),
      });

      const isSuccess = response.ok;
      setConfig((prev) => ({
        ...prev,
        isConnected: isSuccess,
        lastTested: isSuccess ? new Date().toISOString() : undefined,
      }));
      return isSuccess;
    } catch {
      setConfig((prev) => ({ ...prev, isConnected: false }));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ApiContext.Provider value={{ config, updateConfig, testConnection, isLoading }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}

// Get Dolibarr config from localStorage (for use outside React components)
// Note: API key is stored in sessionStorage for security
export function getDolibarrConfig(): Omit<ApiConfig, 'isConnected' | 'lastTested'> & { apiKey: string } {
  const defaultResult = {
    baseUrl: '',
    apiKey: '',
    apiPrefix: '/api/index.php',
    timeout: 30000,
    companyId: '',
    enableCache: true,
    useProxy: false,
    proxyUrl: '',
    sessionId: '',
    sessionToken: '',
  };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Get API key from sessionStorage
      const apiKey = normalizeApiKey(sessionStorage.getItem('dolibarr_api_key') || '');
      const sessionId = sessionStorage.getItem('dolibarr_session_id') || '';
      const sessionToken = sessionStorage.getItem('dolibarr_session_token') || '';
      return {
        ...defaultResult,
        ...parsed,
        apiKey,
        sessionId,
        sessionToken,
      };
    }
  } catch {
    // Ignore errors
  }

  // Also check sessionStorage for API key
  const apiKey = normalizeApiKey(sessionStorage.getItem('dolibarr_api_key') || '');
  const sessionId = sessionStorage.getItem('dolibarr_session_id') || '';
  const sessionToken = sessionStorage.getItem('dolibarr_session_token') || '';
  return { ...defaultResult, apiKey, sessionId, sessionToken };
}

// Save session info to sessionStorage (for proxy mode)
export function saveSession(sessionId: string, sessionToken: string) {
  sessionStorage.setItem('dolibarr_session_id', sessionId);
  sessionStorage.setItem('dolibarr_session_token', sessionToken);
}

// Clear session info
export function clearSession() {
  sessionStorage.removeItem('dolibarr_session_id');
  sessionStorage.removeItem('dolibarr_session_token');
}
