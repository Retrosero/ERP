// Dolibarr API Types

export interface DolibarrConfig {
  baseUrl: string;
  apiKey: string;
  apiPrefix: string;
  timeout: number;
}

// ThirdParty (Müşteri/Tedarikçi)
export interface ThirdParty {
  id: number;
  ref?: string;
  name: string;
  fullname?: string;
  email?: string;
  phone?: string;
  fax?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_id?: number;
  country_code?: string;
  customer_code?: string;
  supplier_code?: string;
  client?: number;
  supplier?: number;
  code_client?: string;
  code_fournisseur?: string;
  vat_number?: string;
  siret?: string;
  siren?: string;
  typent_id?: number;
  staff?: number;
  effectif_id?: number;
  capital?: number;
  date_creation?: string;
  date_modification?: string;
}

// Product (Ürün/Hizmet)
export interface Product {
  id: number;
  ref: string;
  label: string;
  description?: string;
  type?: number;
  price?: number;
  price_ttc?: number;
  price_min?: number;
  price_min_ttc?: number;
  barcode?: string;
  tva_tx?: number;
  stock_reel?: number;
  stock_virtual?: number;
  seuil_stock_alerte?: number;
  cost_price?: number;
  tosell?: number;
  tobuy?: number;
  date_creation?: string;
  date_modification?: string;
}

// Order (Sipariş)
export interface Order {
  id: number;
  ref: string;
  ref_client?: string;
  fk_soc?: number;
  fk_projet?: number;
  date_valid?: string;
  date_commande?: string;
  date_livraison?: string;
  fk_payment_term?: number;
  fk_payment_mode?: number;
  fk_cond_reglement?: number;
  note_private?: string;
  note_public?: string;
  lines?: OrderLine[];
  total_ht: number;
  total_tva: number;
  total_localtax1: number;
  total_localtax2: number;
  total_ttc: number;
  round_mode?: number;
  round_type?: number;
  status?: number;
  label_status?: string;
  date_creation?: string;
  date_modification?: string;
}

// Order Line
export interface OrderLine {
  id?: number;
  fk_parent_line?: number;
  fk_product?: number;
  product_type?: number;
  label?: string;
  description?: string;
  vat_src_code?: string;
  tva_tx?: number;
  localtax1_tx?: number;
  localtax2_tx?: number;
  qty?: number;
  unit?: string;
  unitprice?: number;
  subprice?: number;
  discount?: number;
  price_by_qty?: number;
  total_ht?: number;
  total_tva?: number;
  total_localtax1?: number;
  total_localtax2?: number;
  total_ttc?: number;
  date_start?: string;
  date_end?: string;
  buy_price_ht?: number;
  fk_warehouse?: number;
  special_code?: number;
}

// Proposal (Teklif)
export interface Proposal {
  id: number;
  ref: string;
  ref_client?: string;
  fk_soc?: number;
  fk_projet?: number;
  fk_user_author?: number;
  date_valid?: string;
  date_signature?: string;
  date_close?: string;
  date_valid_from?: string;
  date_valid_to?: string;
  fk_payment_term?: number;
  fk_payment_mode?: number;
  fk_cond_reglement?: number;
  note_private?: string;
  note_public?: string;
  lines?: ProposalLine[];
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  status?: number;
  label_status?: string;
  date_creation?: string;
  date_modification?: string;
}

// Proposal Line
export interface ProposalLine {
  id?: number;
  fk_parent_line?: number;
  fk_product?: number;
  product_type?: number;
  label?: string;
  description?: string;
  vat_src_code?: string;
  tva_tx?: number;
  qty?: number;
  unit?: string;
  unitprice?: number;
  subprice?: number;
  discount?: number;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  date_start?: string;
  date_end?: string;
  buy_price_ht?: number;
  fk_warehouse?: number;
}

// Invoice (Fatura)
export interface Invoice {
  id: number;
  ref: string;
  ref_client?: string;
  type?: number;
  socid?: number; // Third party ID (alternative name for fk_soc used by API)
  fk_soc?: number;
  fk_projet?: number;
  date?: string | number; // Creation date
  date_valid?: string | number;
  date_paye?: string | number;
  date_lim_reglement?: string | number; // Due date
  date_closing?: string | number;
  fk_payment_term?: number;
  fk_payment_mode?: number;
  fk_cond_reglement?: number;
  note_private?: string;
  note_public?: string;
  lines?: InvoiceLine[];
  total_ht: number;
  total_tva: number;
  total_localtax1: number;
  total_localtax2: number;
  total_ttc: number;
  total_paye?: number;
  remain_to_pay?: number;
  status?: number;
  label_status?: string;
  close_code?: string;
  close_note?: string;
  date_creation?: string;
  date_modification?: string;
}

// Invoice Line
export interface InvoiceLine {
  id?: number;
  fk_parent_line?: number;
  fk_product?: number;
  product_type?: number;
  label?: string;
  description?: string;
  vat_src_code?: string;
  tva_tx?: number;
  localtax1_tx?: number;
  localtax2_tx?: number;
  qty?: number;
  unit?: string;
  unitprice?: number;
  subprice?: number;
  discount?: number;
  price_by_qty?: number;
  total_ht?: number;
  total_tva?: number;
  total_localtax1?: number;
  total_localtax2?: number;
  total_ttc?: number;
  date_start?: string;
  date_end?: string;
  fk_warehouse?: number;
}

// Payment
export interface Payment {
  id?: number;
  ref?: string;
  entity?: number;
  datep?: string;
  datev?: string;
  tms?: string;
  fk_paiement?: number;
  payment_num?: string;
  fk_bank?: number;
  fk_user_creadit?: number;
  amount?: number;
  multicurrency_amount?: number;
  label?: string;
  description?: string;
  fk_soc?: number;
  fk_socpeople?: number;
  fk_invoice?: number;
  fk_invoice_supplier?: number;
  num_payment?: number;
  date_batch?: string;
}

// Stock Movement
export interface StockMovement {
  id?: number;
  ref?: string;
  date_creation?: string;
  tms?: string;
  datem?: number; // Unix timestamp
  fk_product?: number;
  product_id?: number; // Alternative name
  fk_entrepot?: number;
  fk_user_author?: number;
  value?: number;
  price_buy?: number;
  price_unit?: number;
  type_movement?: number;
  label?: string;
  fk_origin?: number;
  origin_type?: string;
  fk_projet?: number;
  batch?: string;
  inventorydate?: string;
  qty?: number; // Quantity (Dolibarr field)
  quantity?: number; // Alternative name for quantity
}

// Warehouse (Depo)
export interface Warehouse {
  id?: number;
  ref?: string;
  label?: string;
  description?: string;
  address?: string;
  zip?: string;
  town?: string;
  fk_pays?: number;
  phone?: string;
  fax?: string;
  email?: string;
  status?: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  entity?: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Form data types
export interface CreateThirdPartyDto {
  name: string;
  client?: number;
  supplier?: number;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_id?: number;
  code_client?: string;
  code_fournisseur?: string;
  vat_number?: string;
  idprof1?: string; // Tax ID
  idprof2?: string;
  cond_reglement?: number;
  note_public?: string;
  note_private?: string;
  typent_id?: number;
  staff?: number;
  effectif_id?: number;
  capital?: number;
}

export interface CreateOrderDto {
  ref?: string;
  ref_client?: string;
  soccid?: number; // Third party ID (API uses soccid)
  fk_soc?: number; // Alternative
  fk_projet?: number;
  date?: string | number; // String or Unix timestamp
  date_commande?: string | number;
  date_livraison?: string | number;
  delivery_date?: string | number;
  fk_payment_term?: number;
  fk_payment_mode?: number;
  fk_cond_reglement?: number;
  payment_rule_code?: string;
  note_private?: string;
  note_public?: string;
  lines: {
    fk_product?: number;
    label?: string;
    description?: string;
    qty: number;
    unitprice?: number;
    price?: number;
    subprice?: number;
    discount?: number;
    tva_tx?: number;
    localtax1_tx?: number;
    localtax2_tx?: number;
    fk_warehouse?: number;
    date_start?: string;
    date_end?: string;
  }[];
}

export interface CreateProposalDto {
  ref?: string;
  ref_client?: string;
  soccid?: number; // Third party ID (API uses soccid)
  fk_soc?: number; // Alternative
  fk_projet?: number;
  date?: string | number; // String or Unix timestamp
  date_lim_quota?: string | number;
  date_valid_from?: string | number;
  date_valid_to?: string | number;
  fk_payment_term?: number;
  fk_payment_mode?: number;
  fk_cond_reglement?: number;
  payment_rule_code?: string;
  note_private?: string;
  note_public?: string;
  status?: number;
  lines: {
    fk_product?: number;
    label?: string;
    description?: string;
    qty: number;
    unitprice?: number;
    price?: number;
    subprice?: number;
    discount?: number;
    tva_tx?: number;
    date_start?: string;
    date_end?: string;
  }[];
}

export interface CreatePaymentDto {
  timestamp?: number;
  datep?: string | number; // Date payment
  datev?: string;
  fk_paiement?: number;
  payment_type?: string; // LIQ, VIR, CHQ, CB
  amount?: number;
  label?: string;
  note?: string;
  fk_soc?: number;
  fk_invoice?: number;
  fk_invoice_supplier?: number;
  num_payment?: string;
  facture?: number; // Invoice ID for payment
}

export interface CreateProductDto {
  ref?: string;
  label: string;
  description?: string;
  type?: number; // 0 = product, 1 = service
  price?: number;
  price_ttc?: number;
  price_min?: number;
  price_min_ttc?: number;
  barcode?: string;
  tva_tx?: number;
  cost_price?: number;
  tosell?: number; // 1 = for sale
  tobuy?: number; // 1 = for purchase
  stock_reel?: number;
  stock_virtual?: number;
  seuil_stock_alerte?: number;
  description_buyprice?: string;
  descriptionSellingPrice?: string;
 fk_product_type?: number;
}

// Expense Report
export interface ExpenseReport {
  id: number;
  ref: string;
  fk_user_author?: number;
  fk_user_validator?: number;
  date_valid?: string;
  date_refuse?: string;
  date_approve?: string;
  paid: number; // 0 = unpaid, 1 = paid
  date_payment?: string;
  tms?: string;
  total_ht: number;
  total_tva: number;
  total_localtax1: number;
  total_localtax2: number;
  total_ttc: number;
  fk_bank?: number;
  fk_payment_mode?: number;
  note_private?: string;
  note_public?: string;
  status?: number;
  label_status?: string;
  lines?: ExpenseReportLine[];
  date_creation?: string;
  date_modification?: string;
}

export interface ExpenseReportLine {
  id?: number;
  fk_expense_report?: number;
  fk_c_type_fees?: number;
  fk_social_cosine?: number;
  fk_pj?: number;
  date: string;
  date_start?: string;
  date_end?: string;
  expense_type?: string;
  libelle: string; // Description
  qty?: number;
  value_unit?: number;
  value_unit_ht?: number;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  vat_src_code?: string;
  localtax1_tx?: number;
  localtax2_tx?: number;
  localtax1_type?: string;
  localtax2_type?: string;
  interstring?: number;
  special_code?: number;
}

export interface CreateExpenseReportDto {
  ref?: string;
  fk_user_author?: number;
  fk_user_validator?: number;
  date_debut?: string | number;
  date_fin?: string | number;
  date_valid?: string | number;
  paid?: number;
  fk_bank?: number;
  fk_payment_mode?: number;
  note_private?: string;
  note_public?: string;
  lines: {
    fk_c_type_fees?: number;
    date: string | number;
    libelle: string;
    qty?: number;
    value_unit?: number;
    value_unit_ht?: number;
    tva_tx?: number;
    localtax1_tx?: number;
    localtax2_tx?: number;
  }[];
}

export interface CreateStockMovementDto {
  fk_product: number;
  fk_entrepot: number;
  qty: number;
  type_movement: number;
  label?: string;
  fk_origin?: number;
  origin_type?: string;
  price_buy?: number;
  date_start?: string;
}