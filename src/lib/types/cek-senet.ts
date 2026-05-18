// Çek ve Senet Tipleri

// Çek
export interface Check {
  id: number;
  type: 'check';
  direction: 'received' | 'issued';
  serial_number: string;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  drawer_tax_number?: string;
  beneficiary_id?: number;
  beneficiary_name?: string;
  status: CheckStatus;
  status_changed_at?: string;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

// Senet
export interface PromissoryNote {
  id: number;
  type: 'promissory';
  direction: 'received' | 'issued';
  serial_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  endorsement_count?: number;
  status: CheckStatus;
  notes?: string;
  created_by?: number;
  created_at?: string;
}

// Çek/Senet Durumu
export type CheckStatus =
  | 'pending'           // Beklemede
  | 'in_portfolio'      // Portföyde
  | 'sent_to_bank'      // Bankaya gönderildi
  | 'collected'         // Tahsil edildi
  | 'returned'          // İade
  | 'transferred'       // Ciro edildi
  | 'protested'         // Protestolu
  | 'cancelled';        // İptal

// Bordro
export interface CheckNoteBatch {
  id: number;
  batch_number: string;
  type: 'check' | 'promissory' | 'mixed';
  direction: 'in' | 'out';
  total_amount: number;
  currency: string;
  count: number;
  issue_date: string;
  status: 'draft' | 'submitted' | 'processed';
  items: (Check | PromissoryNote)[];
  created_by?: number;
  created_at?: string;
}

// DTO'lar
export interface CreateCheckDto {
  type: 'check';
  direction: 'received' | 'issued';
  serial_number: string;
  bank_code: string;
  branch_code: string;
  account_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  drawer_tax_number?: string;
  beneficiary_id?: number;
  notes?: string;
}

export interface CreatePromissoryNoteDto {
  type: 'promissory';
  direction: 'received' | 'issued';
  serial_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  drawer_name: string;
  notes?: string;
}

export interface UpdateCheckStatusDto {
  status: CheckStatus;
  notes?: string;
}

// Filtreler
export interface CheckNoteFilter {
  type?: 'check' | 'promissory';
  direction?: 'received' | 'issued';
  status?: CheckStatus;
  due_date_start?: string;
  due_date_end?: string;
  search?: string;
}

// Status Label Map
export const CHECK_STATUS_LABELS: Record<CheckStatus, { label: string; color: string }> = {
  pending: { label: 'Beklemede', color: 'gray' },
  in_portfolio: { label: 'Portföyde', color: 'blue' },
  sent_to_bank: { label: 'Bankaya Gönderildi', color: 'yellow' },
  collected: { label: 'Tahsil Edildi', color: 'green' },
  returned: { label: 'İade', color: 'orange' },
  transferred: { label: 'Ciro Edildi', color: 'purple' },
  protested: { label: 'Protestolu', color: 'red' },
  cancelled: { label: 'İptal', color: 'gray' },
};