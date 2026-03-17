import { supabase } from '../lib/supabase';
import type { TaxRecord, TaxCalculationParams } from '../types/tax';
import { dependentService } from './dependentService';
import { employeeService } from './employeeService';
import { parse, isAfter, isBefore, isEqual, startOfMonth, format } from 'date-fns';

// Vietnamese PIT constants (in VND)
const BASE_DEDUCTION = 11_000_000;
const DEPENDENT_DEDUCTION = 4_400_000;

export const taxService = {
  // Fetch tax history, optionally filtered by month (YYYY-MM-DD format, usually first day of month)
  async getHistory(monthYear?: string): Promise<TaxRecord[]> {
    let query = supabase
      .from('tax_records')
      .select('*')
      .order('thang_nam', { ascending: false })
      .order('ho_ten', { ascending: true });

    if (monthYear) {
      query = query.eq('thang_nam', monthYear);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // Calculate PIT for a specific month
  async calculateTaxes(
    records: TaxCalculationParams[], 
    monthYearStr: string, // format: YYYY-MM
    accountantId: string
  ): Promise<TaxRecord[]> {
    const targetDate = startOfMonth(parse(`${monthYearStr}-01`, 'yyyy-MM-dd', new Date()));
    
    // 1. Fetch all employees to map ma_nv -> id
    const employees = await employeeService.getAll();
    const empMap = new Map(employees.map(e => [e.ma_nv, e]));

    // 2. Fetch dependents for those employees to calculate valid dependents
    const processedRecords = [];

    for (const record of records) {
      const emp = empMap.get(record.ma_nv);
      let validDependentCount = 0;

      if (emp) {
        // Find valid dependents for this month
        const dependents = await dependentService.getByEmployeeId(emp.id);
        
        validDependentCount = dependents.filter(dep => {
          if (dep.khong_su_dung) return false;
          
          const startDate = parse(dep.tu_thang, 'yyyy-MM-dd', new Date());
          const endDate = dep.den_thang ? parse(dep.den_thang, 'yyyy-MM-dd', new Date()) : null;

          const isAfterStart = isAfter(targetDate, startDate) || isEqual(targetDate, startDate);
          const isBeforeEnd = endDate ? (isBefore(targetDate, endDate) || isEqual(targetDate, endDate)) : true;

          return isAfterStart && isBeforeEnd;
        }).length;
      }

      // Calculate Tax logic
      const thuNhapChiuThue = Math.max(0, record.tong_thu_nhap - record.kho_chiu_thue);
      let thuNhapTinhThue = thuNhapChiuThue - BASE_DEDUCTION - (validDependentCount * DEPENDENT_DEDUCTION) - record.bao_hiem;
      
      // Prevent negative taxable income
      thuNhapTinhThue = Math.max(0, thuNhapTinhThue);

      const thueTNCN = taxService.calculatePitFormula(thuNhapTinhThue);

      processedRecords.push({
        accountant_id: accountantId,
        thang_nam: format(targetDate, 'yyyy-MM-dd'),
        ma_nv: record.ma_nv,
        ho_ten: record.ho_ten,
        ma_so_thue: record.ma_so_thue || null,
        tong_thu_nhap: record.tong_thu_nhap,
        kho_chiu_thue: record.kho_chiu_thue,
        bao_hiem: record.bao_hiem,
        so_nguoi_phu_thuoc: validDependentCount,
        thu_nhap_tinh_thue: thuNhapTinhThue,
        thue_tncn_phai_nop: thueTNCN
      });
    }

    // 3. Save to database
    // We use upsert based on accountant_id, thang_nam, ma_nv if we want to overwrite
    // But since Supabase schema doesn't have unique constraint for this combination, we will just delete old records for this month first
    const { error: delError } = await supabase
      .from('tax_records')
      .delete()
      .eq('accountant_id', accountantId)
      .eq('thang_nam', format(targetDate, 'yyyy-MM-dd'));

    if (delError) throw delError;

    const { data: savedRecords, error: insError } = await supabase
      .from('tax_records')
      .insert(processedRecords)
      .select();

    if (insError) throw insError;
    return savedRecords || [];
  },

  // Vietnamese Progressive Tax Formula
  calculatePitFormula(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;
    
    let tax = 0;
    const millions = taxableIncome; // working with full numbers

    if (millions <= 5_000_000) {
      tax = millions * 0.05;
    } else if (millions <= 10_000_000) {
      tax = (millions * 0.10) - 250_000;
    } else if (millions <= 18_000_000) {
      tax = (millions * 0.15) - 750_000;
    } else if (millions <= 32_000_000) {
      tax = (millions * 0.20) - 1_650_000;
    } else if (millions <= 52_000_000) {
      tax = (millions * 0.25) - 3_250_000;
    } else if (millions <= 80_000_000) {
      tax = (millions * 0.30) - 5_850_000;
    } else {
      tax = (millions * 0.35) - 9_850_000;
    }

    return Math.max(0, tax);
  }
};
