// Nakit Yönetimi Tipleri

// Kasa Hesabı
export interface CashAccount {
  id: number;
  name: string;
  currency: 'TRY' | 'USD' | 'EUR' | string;
  balance: number;
  description?: string;
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

// Banka Hesabı
export interface BankAccount {
  id: number;
  name: string;
  bank_name: string;
  account_number: string;
  iban?: string;
  currency: 'TRY' | 'USD' | 'EUR' | string;
  balance: number;
  account_type: 'checking' | 'savings' | 'credit';
  branch?: string;
  created_at?: string;
  updated_at?: string;
}

// Nakit Akışı (Hareket)
export interface CashFlow {
  id: number;
  account_type: 'cash' | 'bank';
  account_id: number;
  account_name?: string;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  date: string;
  category: string;
  reference_type?: 'invoice' | 'expense' | 'order' | 'manual';
  reference_id?: number;
  reference_label?: string;
  description?: string;
  payment_method: 'cash' | 'bank_transfer' | 'card' | 'check' | 'bond';
  created_by?: number;
  created_at?: string;
}

// Nakit Kategorisi
export interface CashCategory {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

// Transfer
export interface CashTransfer {
  id?: number;
  from_account_type: 'cash' | 'bank';
  from_account_id: number;
  to_account_type: 'cash' | 'bank';
  to_account_id: number;
  amount: number;
  currency: string;
  date: string;
  description?: string;
}

// DTO'lar
export interface CreateCashAccountDto {
  name: string;
  currency: string;
  description?: string;
  is_default?: boolean;
}

export interface CreateBankAccountDto {
  name: string;
  bank_name: string;
  account_number: string;
  iban?: string;
  currency: string;
  account_type: 'checking' | 'savings' | 'credit';
  branch?: string;
}

export interface CreateCashFlowDto {
  account_type: 'cash' | 'bank';
  account_id: number;
  direction: 'in' | 'out';
  amount: number;
  currency: string;
  date: string;
  category: string;
  reference_type?: string;
  reference_id?: number;
  description?: string;
  payment_method: string;
}

export interface CreateCashCategoryDto {
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
}

// Filtreler
export interface CashFlowFilter {
  account_type?: 'cash' | 'bank';
  account_id?: number;
  direction?: 'in' | 'out';
  category?: string;
  date_start?: string;
  date_end?: string;
  search?: string;
}