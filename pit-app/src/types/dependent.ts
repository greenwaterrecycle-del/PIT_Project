export interface Dependent {
  id: string;
  employee_id: string;
  ho_ten: string;
  moi_quan_he: string;
  ngay_sinh: string | null;
  ma_so_thue: string | null;
  so_cccd: string | null;
  tu_thang: string;
  den_thang: string | null;
  khong_su_dung: boolean;
  created_at: string;
  updated_at: string;
}

export interface DependentFormData {
  ho_ten: string;
  moi_quan_he: string;
  ngay_sinh: string;
  ma_so_thue: string;
  so_cccd: string;
  tu_thang: string;
  den_thang: string;
  khong_su_dung: boolean;
}
