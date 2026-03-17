import { supabase } from '../lib/supabase';
import type { Dependent, DependentFormData } from '../types/dependent';

export const dependentService = {
  async getByEmployeeId(employeeId: string): Promise<Dependent[]> {
    const { data, error } = await supabase
      .from('dependents')
      .select('*')
      .eq('employee_id', employeeId)
      .order('ho_ten', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Dependent | null> {
    const { data, error } = await supabase
      .from('dependents')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(employee_id: string, dependent: DependentFormData): Promise<Dependent> {
    // Convert empty strings for dates to null
    const payload = {
      ...dependent,
      employee_id,
      ngay_sinh: dependent.ngay_sinh || null,
      den_thang: dependent.den_thang ? `${dependent.den_thang}-01` : null, // Assuming YYYY-MM format from form
      tu_thang: `${dependent.tu_thang}-01` // Ensure it's a valid date
    };

    const { data, error } = await supabase
      .from('dependents')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, dependent: DependentFormData): Promise<Dependent> {
    const payload = {
      ...dependent,
      ngay_sinh: dependent.ngay_sinh || null,
      den_thang: dependent.den_thang ? `${dependent.den_thang}-01` : null,
      tu_thang: `${dependent.tu_thang}-01`
    };

    const { data, error } = await supabase
      .from('dependents')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('dependents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
