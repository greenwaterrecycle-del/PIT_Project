export interface TaxRecord {
  id: string;
  accountant_id: string;
  thang_nam: string;
  ma_nv: string;
  ho_ten: string;
  ma_so_thue: string | null;
  tong_thu_nhap: number;
  kho_chiu_thue: number;
  bao_hiem: number;
  so_nguoi_phu_thuoc: number;
  thu_nhap_tinh_thue: number;
  thue_tncn_phai_nop: number;
  created_at: string;
}

export interface TaxCalculationParams {
  ma_nv: string;
  ho_ten: string;
  ma_so_thue?: string;
  tong_thu_nhap: number;
  kho_chiu_thue: number;
  bao_hiem: number;
}
