export interface Employee {
  id: string;
  accountant_id: string;
  ma_nv: string;
  ho_ten: string;
  don_vi: string | null;
  ma_so_thue: string | null;
  so_cccd: string | null;
  da_nghi_viec: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeFormData {
  ma_nv: string;
  ho_ten: string;
  don_vi: string;
  ma_so_thue: string;
  so_cccd: string;
  da_nghi_viec: boolean;
}
