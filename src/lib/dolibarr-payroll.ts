/**
 * Dolibarr Payroll API Client
 * Handles salary, overtime, advance payments, and equipment assignment APIs
 * 100% Dolibarr API compatible
 */

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
async function fetchPayrollApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const config = getDolibarrConfig();
  const apiKey = (config.apiKey || '').trim();

  if (!config.baseUrl || !apiKey) {
    throw new DolibarrApiError('Dolibarr ayarları yapılandırılmamış. Lütfen Ayarlar sayfasından Dolibarr bağlantısını yapılandırın.', 0);
  }

  const isProxyMode = config.useProxy && config.proxyUrl;
  let url: string;
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (isProxyMode) {
    url = `${config.proxyUrl}${endpoint}`;
    if (config.sessionToken) {
      (headers as Record<string, string>)['X-Session-Token'] = config.sessionToken;
    }
    if (config.sessionId) {
      (headers as Record<string, string>)['X-Session-Id'] = config.sessionId;
    }
  } else {
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
      if (response.status === 501) {
        errorMessage = 'Dolibarr payroll modülü API endpointi bulunamadı. Sunucuda ilgili modül etkin değil.';
      } else if (response.status === 401) {
        errorMessage = 'Yetkisiz erişim. Dolibarr API anahtarı veya yetkileri kontrol edin.';
      } else if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData && typeof errorData === 'object') {
        const obj = errorData as Record<string, unknown>;
        const val = obj.error ?? obj.message;
        if (typeof val === 'string') errorMessage = val;
      }

      throw new DolibarrApiError(errorMessage, response.status, errorData);
    }

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

// ============ SALARY TYPES ============

export interface SalaryDefinition {
  id: number;
  ref?: string;
  ref_ext?: string;
  entity?: number;
  fk_user: number;
  fk_user_paid?: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  tms?: string;
  // Salary fields
  salary?: number; // Base salary
  salaryextra?: number; // Extra salary
  // Allowances
  meal_allocation?: number;
  meal_number_per_month?: number;
  transport_allocation?: number;
  // Working hours
  hours_per_week?: number;
  hours_per_month?: number;
  // Tax rates
  tax_rate?: number;
  // Status
  note_private?: string;
  note_public?: string;
  date_creation?: string;
  date_modification?: string;
  // Extended UI fields
  user_name?: string;
  user_login?: string;
  currency?: string;
}

export interface CreateSalaryDto {
  fk_user: number;
  salary?: number;
  salaryextra?: number;
  meal_allocation?: number;
  meal_number_per_month?: number;
  transport_allocation?: number;
  hours_per_week?: number;
  hours_per_month?: number;
  tax_rate?: number;
  note_private?: string;
  note_public?: string;
}

// ============ OVERTIME TYPES ============

export type OvertimeType =
  | 'weekday'      // Hafta içi mesai (1.5x)
  | 'weekend'      // Hafta sonu mesai (2.0x)
  | 'holiday'      // Resmi tatil mesai (2.0x)
  | 'night'        // Gece mesai (1.5x)
  | 'compensatory'; // Telafi mesaisi

export interface OvertimeRecord {
  id: number;
  ref?: string;
  ref_ext?: string;
  entity?: number;
  fk_user: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  fk_validator?: number;
  date_creation?: string;
  date_modification?: string;
  date_start?: string | number;
  date_end?: string | number;
  date_valid?: string;
  date_refuse?: string;
  date_cancel?: string;
  // Overtime details
  overtime_type: OvertimeType | string;
  duration: number; // Hours
  hourly_rate?: number;
  rate_multiplier?: number;
  total_amount?: number;
  // Status
  status?: number;
  label_status?: string;
  statuts?: number;
  note_private?: string;
  note_public?: string;
  // Extended UI fields
  user_name?: string;
  user_login?: string;
  type_label?: string;
}

export interface CreateOvertimeDto {
  fk_user: number;
  date_start: string | number;
  date_end: string | number;
  overtime_type: OvertimeType | string;
  duration: number;
  hourly_rate?: number;
  rate_multiplier?: number;
  note_private?: string;
  note_public?: string;
}

interface AgendaEvent {
  id: number;
  label?: string;
  datep?: string | number;
  datef?: string | number;
  userownerid?: number;
  fk_user_action?: number;
  fk_user_author?: number;
  userowner?: string;
  userassigned?: Array<{ id?: number; fk_user?: number; rowid?: number }>;
  note_private?: string;
  note_public?: string;
}

const MESAI_META_PREFIX = 'MESAI_META:';

const parseMesaiMeta = (note?: string): {
  fk_user?: number;
  overtime_type?: string;
  duration?: number;
  rate_multiplier?: number;
  status?: number;
} => {
  if (!note) return {};
  const line = note.split('\n').find((l) => l.startsWith(MESAI_META_PREFIX));
  if (!line) return {};
  try {
    const parsed = JSON.parse(line.slice(MESAI_META_PREFIX.length));
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const toMesaiNote = (notePrivate: string | undefined, meta: Record<string, unknown>): string => {
  const cleaned = (notePrivate || '')
    .split('\n')
    .filter((l) => !l.startsWith(MESAI_META_PREFIX))
    .join('\n')
    .trim();
  const metaLine = `${MESAI_META_PREFIX}${JSON.stringify(meta)}`;
  return cleaned ? `${cleaned}\n${metaLine}` : metaLine;
};

const toUnixTimestamp = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Math.floor(value > 9999999999 ? value / 1000 : value);
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return undefined;
  return Math.floor(ms / 1000);
};

const toEpochMs = (value: string | number | undefined): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') {
    return value < 10_000_000_000 ? value * 1000 : value;
  }
  const n = Number(value);
  if (!Number.isNaN(n)) {
    return n < 10_000_000_000 ? n * 1000 : n;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const resolveEventUserId = (event: AgendaEvent, metaUserId?: number): number => {
  const candidates: Array<unknown> = [
    event.userownerid,
    event.fk_user_action,
    event.fk_user_author,
    event.userassigned?.[0]?.id,
    event.userassigned?.[0]?.fk_user,
    event.userassigned?.[0]?.rowid,
    metaUserId,
  ];
  for (const item of candidates) {
    const asNum = Number(item);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
  }
  return 0;
};

const mapAgendaEventToOvertime = (event: AgendaEvent): OvertimeRecord => {
  const meta = parseMesaiMeta(event.note_private);
  const datepMs = toEpochMs(event.datep);
  const datefMs = toEpochMs(event.datef);
  const dateStart = datepMs ? new Date(datepMs) : undefined;
  const dateEnd = datefMs ? new Date(datefMs) : undefined;
  const fallbackDuration =
    dateStart && dateEnd ? Math.max(0, (dateEnd.getTime() - dateStart.getTime()) / (1000 * 60 * 60)) : 0;
  const duration = Number(meta.duration ?? fallbackDuration);
  const rateMultiplier = Number(meta.rate_multiplier ?? 1.5);
  const fkUser = resolveEventUserId(event, meta.fk_user);

  return {
    id: event.id,
    fk_user: fkUser,
    user_name: event.userowner,
    overtime_type: String(meta.overtime_type || 'weekday'),
    duration: Number.isFinite(duration) ? duration : 0,
    rate_multiplier: Number.isFinite(rateMultiplier) ? rateMultiplier : 1.5,
    total_amount: 0,
    status: Number(meta.status ?? 1),
    date_start: datepMs ?? event.datep,
    date_end: datefMs ?? event.datef,
    note_private: event.note_private,
    note_public: event.note_public,
  };
};

// ============ ADVANCE PAYMENT TYPES ============

export type AdvanceStatus =
  | 'pending'      // Beklemede
  | 'approved'     // Onaylandı
  | 'paid'         // Ödendi
  | 'partial'      // Kısmi ödeme
  | 'completed'    // Tamamlandı
  | 'cancelled';   // İptal edildi

export interface AdvancePayment {
  id: number;
  ref?: string;
  ref_ext?: string;
  entity?: number;
  fk_user: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  fk_validator?: number;
  fk_bank?: number;
  date_creation?: string;
  date_modification?: string;
  date_start?: string | number;
  date_valid?: string;
  date_refuse?: string;
  date_cancel?: string;
  date_payment?: string;
  // Advance details
  amount_requested?: number;
  amount?: number;
  amount_advance?: number;
  // Installment info
  installment_count?: number;
  installment_total?: number;
  // Status
  status?: number;
  label_status?: string;
  paid?: number;
  note_private?: string;
  note_public?: string;
  // Extended UI fields
  user_name?: string;
  user_login?: string;
  currency?: string;
  reason?: string;
}

export interface CreateAdvanceDto {
  fk_user: number;
  date_start?: string | number;
  amount_requested?: number;
  amount?: number;
  reason?: string;
  note_private?: string;
  note_public?: string;
}

export interface AdvanceBalance {
  user_id: number;
  user_name?: string;
  total_requested: number;
  total_paid: number;
  total_remaining: number;
  active_advances: number;
}

// ============ EQUIPMENT TYPES ============

export interface EquipmentCategory {
  id: number;
  ref?: string;
  label: string;
  description?: string;
  active?: number;
  date_creation?: string;
}

export interface Equipment {
  id: number;
  ref?: string;
  ref_ext?: string;
  label: string;
  description?: string;
  barcode?: string;
  serial_number?: string;
  serial?: string;
  fk_category?: number;
  status?: number;
  // Assignment info
  fk_user_assign?: number;
  date_assign?: string;
  date_return?: string;
  // Financial
  price_ht?: number;
  price_ttc?: number;
  // Notes
  note_private?: string;
  note_public?: string;
  date_creation?: string;
  date_modification?: string;
  // Extended UI fields
  category_name?: string;
  assigned_to_name?: string;
  status_label?: string;
}

export interface EquipmentAssignment {
  id: number;
  ref?: string;
  ref_ext?: string;
  entity?: number;
  fk_equipment: number;
  fk_user: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  date_creation?: string;
  date_modification?: string;
  date_assign?: string;
  date_return?: string;
  date_expected_return?: string;
  // Status
  status?: number;
  label_status?: string;
  returned?: number;
  note_private?: string;
  note_public?: string;
  // Extended UI fields
  equipment_name?: string;
  equipment_ref?: string;
  equipment_serial?: string;
  user_name?: string;
  user_login?: string;
  category_name?: string;
}

export interface CreateEquipmentDto {
  ref?: string;
  label: string;
  description?: string;
  barcode?: string;
  serial_number?: string;
  fk_category?: number;
  price_ht?: number;
  price_ttc?: number;
  note_private?: string;
  note_public?: string;
}

export interface CreateAssignmentDto {
  fk_equipment: number;
  fk_user: number;
  date_assign?: string | number;
  date_expected_return?: string | number;
  note_private?: string;
  note_public?: string;
}

// ============ PAYROLL API ============

export const payrollApi = {
  async listSalaries(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    fk_user?: number;
  }): Promise<SalaryDefinition[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.fk_user) queryParams.set('fk_user', String(params.fk_user));
    const query = queryParams.toString();
    return fetchPayrollApi<SalaryDefinition[]>(`/salaries${query ? `?${query}` : ''}`);
  },

  async getSalary(id: number): Promise<SalaryDefinition> {
    return fetchPayrollApi<SalaryDefinition>(`/salaries/${id}`);
  },

  async createSalary(data: CreateSalaryDto): Promise<SalaryDefinition> {
    return fetchPayrollApi<SalaryDefinition>('/salaries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateSalary(id: number, data: Partial<SalaryDefinition>): Promise<SalaryDefinition> {
    return fetchPayrollApi<SalaryDefinition>(`/salaries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteSalary(id: number): Promise<void> {
    return fetchPayrollApi<void>(`/salaries/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ OVERTIME API ============

export const overtimeApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    fk_user?: number;
    status?: number | number[];
    date_start?: string;
    date_end?: string;
  }): Promise<OvertimeRecord[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.fk_user) queryParams.set('user_ids', String(params.fk_user));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);
    const query = queryParams.toString();
    const events = await fetchPayrollApi<AgendaEvent[]>(`/agendaevents${query ? `?${query}` : ''}`);
    let mapped = events.map(mapAgendaEventToOvertime);
    if (params?.status !== undefined) {
      const statusList = Array.isArray(params.status) ? params.status : [params.status];
      mapped = mapped.filter((item) => statusList.includes(item.status || 0));
    }
    if (params?.fk_user) {
      mapped = mapped.filter((item) => item.fk_user === params.fk_user);
    }
    return mapped;
  },

  async get(id: number): Promise<OvertimeRecord> {
    const event = await fetchPayrollApi<AgendaEvent>(`/agendaevents/${id}`);
    return mapAgendaEventToOvertime(event);
  },

  async create(data: CreateOvertimeDto): Promise<OvertimeRecord> {
    const datep = toUnixTimestamp(data.date_start);
    const datef = toUnixTimestamp(data.date_end);
    if (!datep || !datef) {
      throw new DolibarrApiError('Mesai tarih/saat bilgisi geçersiz.', 400);
    }

    const payload = {
      label: `Mesai - ${OVERTIME_TYPE_LABELS[data.overtime_type] || data.overtime_type}`,
      userownerid: data.fk_user,
      fk_user_action: data.fk_user,
      type_code: 'AC_OTH',
      datep,
      datef,
      note_private: toMesaiNote(data.note_private, {
        fk_user: data.fk_user,
        overtime_type: data.overtime_type,
        duration: data.duration,
        rate_multiplier: data.rate_multiplier,
        status: 1,
      }),
      note_public: data.note_public,
    };
    const created = await fetchPayrollApi<number | AgendaEvent>('/agendaevents', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const createdId = typeof created === 'number' ? created : created.id;
    return this.get(createdId);
  },

  async update(id: number, data: Partial<OvertimeRecord>): Promise<OvertimeRecord> {
    const current = await this.get(id);
    const datep = toUnixTimestamp((data.date_start as string | number | undefined) ?? current.date_start);
    const datef = toUnixTimestamp((data.date_end as string | number | undefined) ?? current.date_end);
    const nextMeta = {
      fk_user: data.fk_user ?? current.fk_user,
      overtime_type: data.overtime_type || current.overtime_type,
      duration: data.duration ?? current.duration,
      rate_multiplier: data.rate_multiplier ?? current.rate_multiplier,
      status: data.status ?? current.status ?? 1,
    };
    await fetchPayrollApi<unknown>(`/agendaevents/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        userownerid: nextMeta.fk_user,
        fk_user_action: nextMeta.fk_user,
        datep,
        datef,
        note_private: toMesaiNote(data.note_private ?? current.note_private, nextMeta),
        note_public: data.note_public ?? current.note_public,
      }),
    });
    return this.get(id);
  },

  async approve(id: number): Promise<OvertimeRecord> {
    return this.update(id, { status: 2 });
  },

  async reject(id: number): Promise<OvertimeRecord> {
    return this.update(id, { status: 3 });
  },

  async cancel(id: number): Promise<OvertimeRecord> {
    return this.update(id, { status: 5 });
  },

  async getMonthlyReport(year: number, month: number): Promise<{
    user_id: number;
    user_name: string;
    weekday_hours: number;
    weekend_hours: number;
    holiday_hours: number;
    night_hours: number;
    total_hours: number;
    total_amount: number;
  }[]> {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-31`;
    const items = await this.list({ date_start: monthStart, date_end: monthEnd, limit: 1000 });
    const totalHours = items.reduce((sum, i) => sum + (i.duration || 0), 0);
    return [{
      user_id: 0,
      user_name: 'Toplam',
      weekday_hours: items.filter((i) => i.overtime_type === 'weekday').reduce((s, i) => s + (i.duration || 0), 0),
      weekend_hours: items.filter((i) => i.overtime_type === 'weekend').reduce((s, i) => s + (i.duration || 0), 0),
      holiday_hours: items.filter((i) => i.overtime_type === 'holiday').reduce((s, i) => s + (i.duration || 0), 0),
      night_hours: items.filter((i) => i.overtime_type === 'night').reduce((s, i) => s + (i.duration || 0), 0),
      total_hours: totalHours,
      total_amount: 0,
    }];
  },
};

// ============ ADVANCE PAYMENT API ============

export const advanceApi = {
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    fk_user?: number;
    status?: string;
    date_start?: string;
    date_end?: string;
  }): Promise<AdvancePayment[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.fk_user) queryParams.set('fk_user', String(params.fk_user));
    if (params?.status) queryParams.set('status', params.status);
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);
    const query = queryParams.toString();
    return fetchPayrollApi<AdvancePayment[]>(`/advances${query ? `?${query}` : ''}`);
  },

  async get(id: number): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}`);
  },

  async create(data: CreateAdvanceDto): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>('/advances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: number, data: Partial<AdvancePayment>): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async approve(id: number): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}/approve`, {
      method: 'POST',
    });
  },

  async reject(id: number): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}/refuse`, {
      method: 'POST',
    });
  },

  async pay(id: number, amount: number): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async cancel(id: number): Promise<AdvancePayment> {
    return fetchPayrollApi<AdvancePayment>(`/advances/${id}/cancel`, {
      method: 'POST',
    });
  },

  async getUserBalance(userId: number): Promise<AdvanceBalance> {
    return fetchPayrollApi<AdvanceBalance>(`/advances/balance/${userId}`);
  },
};

// ============ EQUIPMENT API ============

export const equipmentApi = {
  async listCategories(): Promise<EquipmentCategory[]> {
    return fetchPayrollApi<EquipmentCategory[]>('/equipment/categories');
  },

  async listEquipment(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    fk_category?: number;
    status?: number;
    assigned?: boolean;
  }): Promise<Equipment[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.fk_category) queryParams.set('fk_category', String(params.fk_category));
    if (params?.status !== undefined) queryParams.set('status', String(params.status));
    if (params?.assigned !== undefined) queryParams.set('assigned', params.assigned ? '1' : '0');
    const query = queryParams.toString();
    return fetchPayrollApi<Equipment[]>(`/equipment${query ? `?${query}` : ''}`);
  },

  async getEquipment(id: number): Promise<Equipment> {
    return fetchPayrollApi<Equipment>(`/equipment/${id}`);
  },

  async createEquipment(data: CreateEquipmentDto): Promise<Equipment> {
    return fetchPayrollApi<Equipment>('/equipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateEquipment(id: number, data: Partial<Equipment>): Promise<Equipment> {
    return fetchPayrollApi<Equipment>(`/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteEquipment(id: number): Promise<void> {
    return fetchPayrollApi<void>(`/equipment/${id}`, {
      method: 'DELETE',
    });
  },

  async listAssignments(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    fk_user?: number;
    fk_equipment?: number;
    status?: number;
    returned?: number;
  }): Promise<EquipmentAssignment[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.fk_user) queryParams.set('fk_user', String(params.fk_user));
    if (params?.fk_equipment) queryParams.set('fk_equipment', String(params.fk_equipment));
    if (params?.status !== undefined) queryParams.set('status', String(params.status));
    if (params?.returned !== undefined) queryParams.set('returned', String(params.returned));
    const query = queryParams.toString();
    return fetchPayrollApi<EquipmentAssignment[]>(`/equipment/assignments${query ? `?${query}` : ''}`);
  },

  async assign(data: CreateAssignmentDto): Promise<EquipmentAssignment> {
    return fetchPayrollApi<EquipmentAssignment>('/equipment/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async returnEquipment(assignmentId: number): Promise<EquipmentAssignment> {
    return fetchPayrollApi<EquipmentAssignment>(`/equipment/assignments/${assignmentId}/return`, {
      method: 'POST',
    });
  },

  async getUserEquipment(userId: number): Promise<EquipmentAssignment[]> {
    return fetchPayrollApi<EquipmentAssignment[]>(`/equipment/assignments/user/${userId}`);
  },
};

// ============ TYPE UTILITIES ============

export const OVERTIME_TYPE_LABELS: Record<string, string> = {
  weekday: 'Hafta İçi Mesai',
  weekend: 'Hafta Sonu Mesai',
  holiday: 'Resmi Tatil Mesai',
  night: 'Gece Mesai',
  compensatory: 'Telafi Mesaisi',
};

export const OVERTIME_RATE_MULTIPLIERS: Record<string, number> = {
  weekday: 1.5,
  weekend: 2.0,
  holiday: 2.0,
  night: 1.5,
  compensatory: 1.0,
};

export const ADVANCE_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  approved: 'Onaylandı',
  paid: 'Ödendi',
  partial: 'Kısmi Ödeme',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
};

export const EQUIPMENT_STATUS_LABELS: Record<string, string> = {
  available: 'Müsait',
  assigned: 'Atanmış',
  maintenance: 'Bakımda',
  retired: 'Hurda',
};
