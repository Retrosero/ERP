/**
 * e-Fatura Service Module
 * Handles communication with e-Fatura provider APIs (NES, Document, ARKAPI, etc.)
 */

// e-Fatura API configuration
export interface EFaturaConfig {
  provider: 'nes' | 'document' | 'arkapi' | 'custom';
  apiUrl: string;
  apiKey: string;
  vkn: string; // Vergi Kimlik Numarası
  alias: string;
  enableAutoSign: boolean;
}

// Invoice types
export interface InvoiceLine {
  id: string;
  product: string;
  productId?: number;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  unit?: string;
  discount?: number;
}

export interface Invoice {
  id?: number;
  ref: string;
  type: 'sales' | 'purchase';
  customer: {
    name: string;
    vkn: string;
    alias: string;
    address: string;
  };
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  vatAmount: number;
  total: number;
  currency: string;
  notes?: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'cancelled';
  envelopeId?: string;
  uuid?: string;
}

export interface EFaturaResponse {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

export interface EFaturaStatus {
  id: string;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled';
  description: string;
  timestamp: string;
}

// Helper function to get config from localStorage
function getConfig(): EFaturaConfig | null {
  try {
    const stored = localStorage.getItem('efatura_settings');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return null;
}

// Get auth headers for API calls
function getAuthHeaders(): Record<string, string> {
  const config = getConfig();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${config?.apiKey || ''}`,
    'X-VKN': config?.vkn || '',
    'X-Alias': config?.alias || '',
  };
}

// API base URL from config
function getApiUrl(): string {
  const config = getConfig();
  return config?.apiUrl || 'https://api.nes.com.tr/v1';
}

/**
 * Send invoice to e-Fatura system
 */
export async function sendInvoice(invoice: Invoice): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey || !config?.vkn) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    // Transform invoice to provider format based on provider type
    const transformedInvoice = transformInvoiceForProvider(invoice, config.provider);

    const response = await fetch(`${getApiUrl()}/invoices`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(transformedInvoice),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || 'Fatura gönderilemedi',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Fatura başarıyla gönderildi',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get invoice status from e-Fatura system
 */
export async function getInvoiceStatus(envelopeId: string): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    const response = await fetch(`${getApiUrl()}/invoices/${envelopeId}/status`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Fatura durumu alınamadı',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Fatura durumu alındı',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get incoming invoices (e-İrsaliye, e-Fatura)
 */
export async function getIncomingInvoices(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.status) queryParams.set('status', params.status);

    const url = `${getApiUrl()}/invoices/incoming${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Gelen faturalar alınamadı',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Gelen faturalar alındı',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get outgoing invoices (sent invoices)
 */
export async function getOutgoingInvoices(params?: {
  startDate?: string;
  endDate?: string;
  status?: string;
}): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.set('startDate', params.startDate);
    if (params?.endDate) queryParams.set('endDate', params.endDate);
    if (params?.status) queryParams.set('status', params.status);

    const url = `${getApiUrl()}/invoices/outgoing${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Giden faturalar alınamadı',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Giden faturalar alındı',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Cancel an invoice
 */
export async function cancelInvoice(envelopeId: string, reason: string): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    const response = await fetch(`${getApiUrl()}/invoices/${envelopeId}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Fatura iptal edilemedi',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Fatura iptal edildi',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get e-Fatura statistics
 */
export async function getStatistics(): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'e-Fatura ayarları yapılandırılmamış',
      error: 'Missing configuration',
    };
  }

  try {
    const response = await fetch(`${getApiUrl()}/statistics`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'İstatistikler alınamadı',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'İstatistikler alındı',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası oluştu',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test e-Fatura connection
 */
export async function testConnection(): Promise<EFaturaResponse> {
  const config = getConfig();

  if (!config?.apiKey) {
    return {
      success: false,
      message: 'API anahtarı girilmemiş',
      error: 'Missing API key',
    };
  }

  try {
    const response = await fetch(`${getApiUrl()}/health`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      return {
        success: false,
        message: 'Bağlantı başarısız',
        error: `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      message: 'Bağlantı başarılı',
      data: await response.json(),
    };
  } catch (error) {
    return {
      success: false,
      message: 'Bağlantı hatası',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Transform invoice to provider-specific format
 */
function transformInvoiceForProvider(invoice: Invoice, provider: string): unknown {
  // Common UBL format that most providers use
  const baseFormat = {
    BillingReference: {
      InvoiceNumber: invoice.ref,
      InvoiceDate: invoice.date,
    },
    AccountingCustomerParty: {
      PartyName: invoice.customer.name,
      PartyIdentification: {
        ID: invoice.customer.vkn,
      },
      PostalAddress: {
        AddressLine: invoice.customer.address,
      },
    },
    InvoiceLines: invoice.lines.map((line, index) => ({
      ID: line.id || String(index + 1),
      Item: {
        Name: line.product,
      },
      InvoicedQuantity: {
        Value: line.quantity,
        unitCode: line.unit || 'NIU',
      },
      Price: {
        PriceAmount: {
          currencyID: invoice.currency,
          value: line.unitPrice,
        },
      },
      TaxTotal: {
        TaxSubtotal: {
          TaxCategory: {
            Percent: line.vatRate,
          },
          TaxAmount: {
            currencyID: invoice.currency,
            value: line.total * (line.vatRate / 100),
          },
        },
      },
      LineExtensionAmount: {
        currencyID: invoice.currency,
        value: line.total,
      },
    })),
    LegalMonetaryTotal: {
      LineExtensionAmount: {
        currencyID: invoice.currency,
        value: invoice.subtotal,
      },
      TaxExclusiveAmount: {
        currencyID: invoice.currency,
        value: invoice.subtotal - invoice.discountAmount,
      },
      TaxInclusiveAmount: {
        currencyID: invoice.currency,
        value: invoice.total,
      },
      PayableAmount: {
        currencyID: invoice.currency,
        value: invoice.total,
      },
    },
    InvoiceTypeCode: invoice.type === 'sales' ? 'SATIS' : 'ALIS',
    Note: invoice.notes,
  };

  // Provider-specific transformations
  switch (provider) {
    case 'nes':
      return {
        ...baseFormat,
        DespatchDocumentReference: {
          ID: invoice.ref,
        },
      };
    case 'document':
      return {
        Document: baseFormat,
      };
    case 'arkapi':
      return {
        Invoice: baseFormat,
        VKN: invoice.customer.vkn,
      };
    default:
      return baseFormat;
  }
}

// Export types for use in components
export type { EFaturaConfig as EFaturaConfigType };