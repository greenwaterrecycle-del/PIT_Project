import { supabase } from '../lib/supabase';
import type { Employee, EmployeeFormData } from '../types/employee';

export const employeeService = {
  async getAll(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('ho_ten', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Employee | null> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(employee: EmployeeFormData, accountant_id: string): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert([{ ...employee, accountant_id }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, employee: Partial<EmployeeFormData>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async bulkCreate(employees: EmployeeFormData[], accountant_id: string): Promise<Employee[]> {
    const records = employees.map(emp => ({ ...emp, accountant_id }));
    const { data, error } = await supabase
      .from('employees')
      .upsert(records, { onConflict: 'accountant_id, ma_nv' })
      .select();

    if (error) throw error;
    return data || [];
  }
};
