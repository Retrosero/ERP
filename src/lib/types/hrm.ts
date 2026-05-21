// Dolibarr HRM (Human Resources) Types

// ============ EMPLOYEE / USER TYPES ============

export interface User {
  id: number;
  entity?: number;
  ref?: string;
  ref_ext?: string;
  civility?: string;
  lastname: string;
  firstname: string;
  name: string; // Full name (firstname + lastname)
  login?: string;
  password?: string;
  admin?: number; // 0 = not admin, 1 = admin
  photo?: string;
  authdevice?: string;
  email: string;
  sigfox_password?: string;
  api_key?: string;
  phone?: string;
  phone_perso?: string;
  phone_mobile?: string;
  office_phone?: string;
  office_fax?: string;
  address?: string;
  zip?: string;
  town?: string;
  state_id?: number;
  country_id?: number;
  country_code?: string;
  birth?: string;
  job?: string;
  sex?: string;
  national_id?: string;
  social_security_number?: string;
  badge?: string;
  dateemployment?: string | number;
  dateemploymentend?: string | number;
  default_lang?: string;
  color?: string;
  barcode?: string;
  accountancy_code?: string;
  fk_user?: number; // Mentor/Supervisor ID
  fk_user_creat?: number;
  fk_user_modif?: number;
  tms?: string;
  note_public?: string;
  note_private?: string;
  import_key?: string;
  code_client?: string;
  code_fournisseur?: string;
  model_pdf?: string;
  last_login?: string | number;
  previous_last_login?: string | number;
  datelastlogin?: string;
  datepreviouslastlogin?: string;
  datecreation?: string;
  datemodification?: string;
  statut?: number; // 0 = disabled, 1 = enabled
  salary?: number;
  salary_extra?: number;
  weeklyhours?: number;
  skill?: string;
  gender?: string;
}

export interface UserProfile extends User {
  supervisor?: User;
  subordinates?: User[];
  permissions?: Permission[];
}

export interface UserGroup {
  id: number;
  nom?: string;
  label?: string;
  description?: string;
  date_creation?: string;
}

export interface Permission {
  id: number;
  entity?: number;
  libelle?: string;
  module?: string;
}

// ============ LEAVE / HOLIDAY TYPES ============

export interface Holiday {
  id: number;
  ref?: string;
  ref_ext?: string;
  entity?: number;
  fk_user: number; // Requester ID
  fk_user_validator?: number; // Approver ID
  fk_user_cancel?: number;
  fk_user_appoved?: number;
  date_debut: string | number; // Start date
  date_fin: string | number; // End date
  halfday?: number; // 0 = full day, 1 = morning, 2 = afternoon
  duration: number; // In days
  fk_type: number; // Leave type ID
  code_type?: string; // Leave type code
  libelle_type?: string; // Leave type label
  statuts?: number; // Status code
  status?: number; // Alternative status field
  label_status?: string;
  date_valid?: string; // Validation date
  date_approve?: string; // Approval date
  date_refuse?: string; // Refusal date
  date_cancel?: string; // Cancellation date
  date_created?: string;
  date_modified?: string;
  note_private?: string;
  note_public?: string;
  fk_notify_1?: number;
  fk_notify_2?: number;
}

export interface LeaveType {
  id: number;
  entity?: number;
  code: string;
  label: string;
  active: number;
 迟迟?: number;
  delay?: number;
  delay_unit?: string;
  fk_user_author?: number;
  sortorder?: number;
  isDefault?: number;
  isLegallyOutdated?: number;
  block_if_negative?: number;
}

export interface LeaveBalance {
  id: number;
  fk_user: number;
  year: number;
  fk_leave_type: number;
  code_type?: string;
  label_type?: string;
  days_available?: number;
  days_taken?: number;
  days_planned?: number;
  // Extended UI fields
  remaining?: number;
  annual_quota?: number;
  total_days?: number;
  used?: number;
}

// ============ EXPENSE REPORT TYPES ============

export interface ExpenseReport {
  id: number;
  ref: string;
  ref_ext?: string;
  entity?: number;
  fk_user_author: number;
  fk_user_validator?: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  date_valid?: string;
  date_refuse?: string;
  date_approve?: string;
  date_cancel?: string;
  date_payment?: string;
  paid: number; // 0 = unpaid, 1 = paid
  fk_bank?: number;
  fk_payment_mode?: number;
  fk_payment_term?: number;
  total_ht: number;
  total_tva: number;
  total_localtax1: number;
  total_localtax2: number;
  total_ttc: number;
  note_private?: string;
  note_public?: string;
  statut?: number;
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
  expense_type?: string;
  fk_social_cosine?: number;
  fk_pj?: number;
  fk_projet?: number;
  date: string | number;
  date_start?: string | number;
  date_end?: string | number;
  libelle: string; // Description
  qty?: number;
  value_unit?: number;
  value_unit_ht?: number;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  vat_src_code?: string;
  tva_tx?: number;
  localtax1_tx?: number;
  localtax2_tx?: number;
  receipt?: string;
}

export interface ExpenseType {
  id: number;
  entity?: number;
  code: string;
  label: string;
  active: number;
  accountancy_code?: string;
  fk_user_author?: number;
  sortorder?: number;
}

// ============ RECRUITMENT TYPES ============

export interface RecruitmentCandidate {
  id: number;
  ref?: string;
  entity?: number;
  fk_job?: number; // Job position ID
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  phone_mobile?: string;
  date_creation?: string;
  date_modification?: string;
  status?: number;
  label_status?: string;
  description?: string;
  salary_date_aval?: string;
  salary_kw?: string;
  salary_kw_text?: string;
  availability?: number;
  fk_user_creat?: number;
  fk_user_modif?: number;
  // Extended fields for UI
  birth?: string;
  place_of_birth?: string;
  country?: string;
  state?: string;
  motivations?: string;
}

export interface RecruitmentJobPosition {
  id: number;
  ref?: string;
  entity?: number;
  label: string;
  description?: string;
  fk_department?: number;
  fk_contrat?: number;
  salary?: number;
  salary_sup?: number;
  salary_unit?: number;
  status?: number;
  label_status?: string;
  date_creation?: string;
  date_modification?: string;
  date_start?: string;
  date_end?: string;
  fk_user_creat?: number;
  fk_user_modif?: number;
  candidates?: RecruitmentCandidate[];
  // Extended fields for UI
  location?: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  nb_candidates?: number;
  keywords?: string;
}

// ============ ATTENDANCE TYPES ============

export interface Attendance {
  id: number;
  entity?: number;
  fk_user: number;
  type: number; // 0 = in, 1 = out
  punch_in?: string;
  punch_out?: string;
  punching_date: string;
  punching_time: string;
  ip_address?: string;
  fk_user_app?: number;
  note?: string;
  date_creation?: string;
}

// ============ HRM CONFIG TYPES ============

export interface HRMSettings {
  automatic_holiday_validation?: number;
  holiday_check_delay?: number;
  holiday_dates_see?: number;
  hr_expense_approve?: number;
  leave_approve_own?: number;
}

// ============ CREATE DTOs ============

export interface CreateUserDto {
  lastname: string;
  firstname: string;
  login?: string;
  password?: string;
  email: string;
  admin?: number;
  employee?: number;
  civility?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_id?: number;
  phone?: string;
  phone_perso?: string;
  phone_mobile?: string;
  job?: string;
  sex?: string;
  birth?: string;
  dateemployment?: string;
  dateemploymentend?: string;
  salary?: number;
  salary_extra?: number;
  weeklyhours?: number;
  note_public?: string;
  note_private?: string;
}

export interface CreateHolidayDto {
  fk_user?: number;
  date_debut: string | number;
  date_fin: string | number;
  halfday?: number;
  fk_type: number;
  libelle?: string;
  note_private?: string;
  note_public?: string;
}

export interface CreateExpenseReportDto {
  fk_user_author?: number;
  fk_user_validator?: number;
  date_debut?: string | number;
  date_fin?: string | number;
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
  }[];
}

export interface CreateCandidateDto {
  fk_job?: number;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  phone_mobile?: string;
  description?: string;
  salary_kw?: string;
  salary_kw_text?: string;
}

export interface CreateJobPositionDto {
  label: string;
  description?: string;
  fk_department?: number;
  fk_contrat?: number;
  salary?: number;
  salary_sup?: number;
  salary_unit?: number;
  date_start?: string;
  date_end?: string;
  // Extended fields for UI
  status?: number;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  contract_type?: string;
  nb_candidates?: number;
  keywords?: string;
  fk_user_card?: number;
  removenotify?: number;
  notify_email?: string;
}