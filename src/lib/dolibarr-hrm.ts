/**
 * Dolibarr HRM (Human Resources) API
 * Handles employee, leave, expense, and recruitment management
 * Extends the base Dolibarr API client
 */

import type {
  User,
  UserProfile,
  Holiday,
  LeaveType,
  LeaveBalance,
  ExpenseReport,
  ExpenseReportLine,
  ExpenseType,
  RecruitmentCandidate,
  RecruitmentJobPosition,
  Attendance,
  CreateUserDto,
  CreateHolidayDto,
  CreateExpenseReportDto,
  CreateCandidateDto,
  CreateJobPositionDto,
} from '@/lib/types/hrm';

import { getDolibarrConfig } from '@/contexts/ApiContext';

// Dolibarr API Error class (duplicated for standalone HRM module)
class DolibarrApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'DolibarrApiError';
  }
}

// Export for use in components
export { DolibarrApiError };

const appendDolibarrApiKey = (url: string, apiKey: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}DOLAPIKEY=${encodeURIComponent(apiKey)}`;
};

// Base fetch wrapper (re-used from dolibarr.ts pattern)
async function fetchHrmApi<T>(
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
      const errorData = await response.json().catch(() => ({}));
      throw new DolibarrApiError(
        errorData.error || errorData.message || `API Error: ${response.status}`,
        response.status,
        errorData
      );
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

// ============ USER / EMPLOYEE API ============

export const userApi = {
  /**
   * List all users (employees)
   */
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number;
    admin?: number;
    search?: string;
  }): Promise<User[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status !== undefined) queryParams.set('statut', String(params.status));
    if (params?.admin !== undefined) queryParams.set('admin', String(params.admin));
    if (params?.search) queryParams.set('search', params.search);

    const query = queryParams.toString();
    return fetchHrmApi<User[]>(`/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get single user by ID
   */
  async get(id: number): Promise<User> {
    return fetchHrmApi<User>(`/users/${id}`);
  },

  /**
   * Get user with full profile (supervisor, subordinates, groups)
   */
  async getProfile(id: number): Promise<UserProfile> {
    return fetchHrmApi<UserProfile>(`/users/${id}`);
  },

  /**
   * Get all users (flat list)
   */
  async getAll(): Promise<User[]> {
    return fetchHrmApi<User[]>('/users?limit=1000');
  },

  /**
   * Create new user (employee)
   */
  async create(data: CreateUserDto): Promise<User> {
    return fetchHrmApi<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update existing user
   */
  async update(id: number, data: Partial<User>): Promise<User> {
    return fetchHrmApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete user
   */
  async delete(id: number): Promise<void> {
    return fetchHrmApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get user's subordinates
   */
  async getSubordinates(id: number): Promise<User[]> {
    return fetchHrmApi<User[]>(`/users/${id}/subordinates`);
  },

  /**
   * Get user's supervisor
   */
  async getSupervisor(id: number): Promise<User | null> {
    const user = await this.get(id);
    if (user.fk_user) {
      return fetchHrmApi<User>(`/users/${user.fk_user}`);
    }
    return null;
  },
};

// ============ HOLIDAY / LEAVE API ============

export const holidayApi = {
  /**
   * List all leave requests
   */
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number | number[];
    user_id?: number;
    year?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Holiday[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status !== undefined) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => queryParams.append('statut', String(s)));
      } else {
        queryParams.set('statut', String(params.status));
      }
    }
    if (params?.user_id) queryParams.set('fk_user', String(params.user_id));
    if (params?.year) queryParams.set('year', String(params.year));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchHrmApi<Holiday[]>(`/holidays${query ? `?${query}` : ''}`);
  },

  /**
   * Get single leave request
   */
  async get(id: number): Promise<Holiday> {
    return fetchHrmApi<Holiday>(`/holidays/${id}`);
  },

  /**
   * Create new leave request
   */
  async create(data: CreateHolidayDto): Promise<Holiday> {
    return fetchHrmApi<Holiday>('/holidays', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update leave request
   */
  async update(id: number, data: Partial<Holiday>): Promise<Holiday> {
    return fetchHrmApi<Holiday>(`/holidays/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete leave request
   */
  async delete(id: number): Promise<void> {
    return fetchHrmApi<void>(`/holidays/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Approve leave request
   */
  async approve(id: number): Promise<Holiday> {
    return fetchHrmApi<Holiday>(`/holidays/${id}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Refuse leave request
   */
  async refuse(id: number, note?: string): Promise<Holiday> {
    return fetchHrmApi<Holiday>(`/holidays/${id}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  /**
   * Cancel leave request
   */
  async cancel(id: number): Promise<Holiday> {
    return fetchHrmApi<Holiday>(`/holidays/${id}/cancel`, {
      method: 'POST',
    });
  },

  /**
   * Get leave types
   */
  async getTypes(): Promise<LeaveType[]> {
    return fetchHrmApi<LeaveType[]>('/holidaytypes');
  },

  /**
   * Get leave balance for user
   */
  async getBalance(userId: number, year?: number): Promise<LeaveBalance[]> {
    const query = year ? `?fk_user=${userId}&year=${year}` : `?fk_user=${userId}`;
    return fetchHrmApi<LeaveBalance[]>(`/holidays/balance${query}`);
  },
};

// ============ EXPENSE REPORT API ============

export const expenseReportApi = {
  /**
   * List all expense reports
   */
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number | number[];
    user_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<ExpenseReport[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status !== undefined) {
      if (Array.isArray(params.status)) {
        params.status.forEach((s) => queryParams.append('statut', String(s)));
      } else {
        queryParams.set('statut', String(params.status));
      }
    }
    if (params?.user_id) queryParams.set('fk_user_author', String(params.user_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchHrmApi<ExpenseReport[]>(`/expensereports${query ? `?${query}` : ''}`);
  },

  /**
   * Get single expense report with lines
   */
  async get(id: number): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>(`/expensereports/${id}`);
  },

  /**
   * Create new expense report
   */
  async create(data: CreateExpenseReportDto): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>('/expensereports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update expense report
   */
  async update(id: number, data: Partial<ExpenseReport>): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>(`/expensereports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete expense report
   */
  async delete(id: number): Promise<void> {
    return fetchHrmApi<void>(`/expensereports/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * Approve expense report
   */
  async approve(id: number): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>(`/expensereports/${id}/approve`, {
      method: 'POST',
    });
  },

  /**
   * Refuse expense report
   */
  async refuse(id: number, note?: string): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>(`/expensereports/${id}/refuse`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    });
  },

  /**
   * Mark as paid
   */
  async markPaid(id: number): Promise<ExpenseReport> {
    return fetchHrmApi<ExpenseReport>(`/expensereports/${id}/paided`, {
      method: 'POST',
    });
  },

  /**
   * Get expense types
   */
  async getTypes(): Promise<ExpenseType[]> {
    return fetchHrmApi<ExpenseType[]>('/expensereporttypes');
  },
};

// ============ RECRUITMENT API ============

export const recruitmentApi = {
  /**
   * List job positions
   */
  async listPositions(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    status?: number;
    active?: number;
  }): Promise<RecruitmentJobPosition[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.status !== undefined) queryParams.set('status', String(params.status));
    if (params?.active !== undefined) queryParams.set('active', String(params.active));

    const query = queryParams.toString();
    return fetchHrmApi<RecruitmentJobPosition[]>(`/recruitments/jobpositions${query ? `?${query}` : ''}`);
  },

  /**
   * Get single job position
   */
  async getPosition(id: number): Promise<RecruitmentJobPosition> {
    return fetchHrmApi<RecruitmentJobPosition>(`/recruitments/jobpositions/${id}`);
  },

  /**
   * Create job position
   */
  async createPosition(data: CreateJobPositionDto): Promise<RecruitmentJobPosition> {
    return fetchHrmApi<RecruitmentJobPosition>('/recruitments/jobpositions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update job position
   */
  async updatePosition(id: number, data: Partial<RecruitmentJobPosition>): Promise<RecruitmentJobPosition> {
    return fetchHrmApi<RecruitmentJobPosition>(`/recruitments/jobpositions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete job position
   */
  async deletePosition(id: number): Promise<void> {
    return fetchHrmApi<void>(`/recruitments/jobpositions/${id}`, {
      method: 'DELETE',
    });
  },

  /**
   * List candidates
   */
  async listCandidates(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    job_id?: number;
    status?: number;
  }): Promise<RecruitmentCandidate[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.job_id) queryParams.set('fk_job', String(params.job_id));
    if (params?.status !== undefined) queryParams.set('status', String(params.status));

    const query = queryParams.toString();
    return fetchHrmApi<RecruitmentCandidate[]>(`/recruitments/candidates${query ? `?${query}` : ''}`);
  },

  /**
   * Get single candidate
   */
  async getCandidate(id: number): Promise<RecruitmentCandidate> {
    return fetchHrmApi<RecruitmentCandidate>(`/recruitments/candidates/${id}`);
  },

  /**
   * Create candidate
   */
  async createCandidate(data: CreateCandidateDto): Promise<RecruitmentCandidate> {
    return fetchHrmApi<RecruitmentCandidate>('/recruitments/candidates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /**
   * Update candidate
   */
  async updateCandidate(id: number, data: Partial<RecruitmentCandidate>): Promise<RecruitmentCandidate> {
    return fetchHrmApi<RecruitmentCandidate>(`/recruitments/candidates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  /**
   * Delete candidate
   */
  async deleteCandidate(id: number): Promise<void> {
    return fetchHrmApi<void>(`/recruitments/candidates/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============ ATTENDANCE API ============

export const attendanceApi = {
  /**
   * List attendance records
   */
  async list(params?: {
    sortfield?: string;
    sortorder?: string;
    limit?: number;
    page?: number;
    user_id?: number;
    date_start?: string;
    date_end?: string;
  }): Promise<Attendance[]> {
    const queryParams = new URLSearchParams();
    if (params?.sortfield) queryParams.set('sortfield', params.sortfield);
    if (params?.sortorder) queryParams.set('sortorder', params.sortorder);
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.user_id) queryParams.set('fk_user', String(params.user_id));
    if (params?.date_start) queryParams.set('date_start', params.date_start);
    if (params?.date_end) queryParams.set('date_end', params.date_end);

    const query = queryParams.toString();
    return fetchHrmApi<Attendance[]>(`/attendances${query ? `?${query}` : ''}`);
  },

  /**
   * Clock in
   */
  async clockIn(userId: number): Promise<Attendance> {
    return fetchHrmApi<Attendance>('/attendances', {
      method: 'POST',
      body: JSON.stringify({ fk_user: userId, type: 0 }),
    });
  },

  /**
   * Clock out
   */
  async clockOut(userId: number): Promise<Attendance> {
    return fetchHrmApi<Attendance>('/attendances', {
      method: 'POST',
      body: JSON.stringify({ fk_user: userId, type: 1 }),
    });
  },

  /**
   * Create attendance record with explicit payload
   */
  async createRecord(data: {
    fk_user: number;
    type: number;
    punching_date?: string;
    punching_time?: string;
    note?: string;
  }): Promise<Attendance> {
    return fetchHrmApi<Attendance>('/attendances', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// HRM Status Constants
export const HOLIDAY_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  VALIDATED: { value: 1, label: 'Onay Bekliyor', color: 'blue' },
  APPROVED: { value: 2, label: 'Onaylandı', color: 'green' },
  REFUSED: { value: 3, label: 'Reddedildi', color: 'red' },
  CANCELLED: { value: 4, label: 'İptal Edildi', color: 'amber' },
} as const;

export const EXPENSE_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  VALIDATED: { value: 1, label: 'Onay Bekliyor', color: 'blue' },
  APPROVED: { value: 2, label: 'Onaylandı', color: 'green' },
  REFUSED: { value: 3, label: 'Reddedildi', color: 'red' },
  PAID: { value: 4, label: 'Ödendi', color: 'purple' },
  CANCELLED: { value: 5, label: 'İptal Edildi', color: 'amber' },
} as const;

export const RECRUITMENT_STATUS = {
  DRAFT: { value: 0, label: 'Taslak', color: 'gray' },
  OPEN: { value: 1, label: 'Açık', color: 'blue' },
  CLOSED: { value: 2, label: 'Kapalı', color: 'green' },
  CANCELLED: { value: 3, label: 'İptal', color: 'red' },
} as const;

export const CANDIDATE_STATUS = {
  DRAFT: { value: 0, label: 'Yeni', color: 'gray' },
  INTERVIEW: { value: 1, label: 'Mülakat', color: 'blue' },
  ACCEPTED: { value: 2, label: 'Kabul Edildi', color: 'green' },
  REFUSED: { value: 3, label: 'Reddedildi', color: 'red' },
  WITHDRAWN: { value: 4, label: 'Çekildi', color: 'amber' },
} as const;
