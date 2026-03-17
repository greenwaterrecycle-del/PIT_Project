import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { DependentFormData } from '../types/dependent';
import type { Employee } from '../types/employee';
import { dependentService } from '../services/dependentService';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowLeft, Save, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function DependentForm() {
  const { employeeId, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState<DependentFormData>({
    ho_ten: '',
    moi_quan_he: '',
    ngay_sinh: '',
    ma_so_thue: '',
    so_cccd: '',
    tu_thang: format(new Date(), 'yyyy-MM'),
    den_thang: '',
    khong_su_dung: false
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (employeeId) {
      loadInitialData(employeeId, id);
    }
  }, [employeeId, id]);

  const loadInitialData = async (empId: string, depId?: string) => {
    try {
      setLoading(true);
      const empData = await employeeService.getById(empId);
      setEmployee(empData);

      if (isEditMode && depId) {
        const depData = await dependentService.getById(depId);
        if (depData) {
          setFormData({
            ho_ten: depData.ho_ten,
            moi_quan_he: depData.moi_quan_he,
            ngay_sinh: depData.ngay_sinh || '',
            ma_so_thue: depData.ma_so_thue || '',
            so_cccd: depData.so_cccd || '',
            tu_thang: getYearMonth(depData.tu_thang),
            den_thang: depData.den_thang ? getYearMonth(depData.den_thang) : '',
            khong_su_dung: depData.khong_su_dung
          });
        }
      }
    } catch (err: any) {
      setError(`Lỗi tải thông tin: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getYearMonth = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, 'yyyy-MM');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !employeeId) return;
    
    try {
      setSaving(true);
      setError(null);
      
      if (isEditMode && id) {
        await dependentService.update(id, formData);
      } else {
        await dependentService.create(employeeId, formData);
      }
      
      navigate(`/employees/${employeeId}/dependents`);
    } catch (err: any) {
      setError(`Lỗi lưu dữ liệu: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(`/employees/${employeeId}/dependents`)}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary-600" />
            {isEditMode ? 'Chỉnh sửa Người phụ thuộc' : 'Thêm mới Người phụ thuộc'}
          </h1>
          <p className="text-slate-500 mt-1">
            Nhân viên: <span className="font-semibold">{employee?.ho_ten}</span>
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-1">
              <label htmlFor="ho_ten" className="block text-sm font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="ho_ten"
                name="ho_ten"
                required
                value={formData.ho_ten}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="moi_quan_he" className="block text-sm font-medium text-slate-700">Mối quan hệ <span className="text-red-500">*</span></label>
              <select
                id="moi_quan_he"
                name="moi_quan_he"
                required
                value={formData.moi_quan_he}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">-- Chọn mối quan hệ --</option>
                <option value="Con">Con ruột / Con nuôi hợp pháp</option>
                <option value="Vợ/Chồng">Vợ / Chồng</option>
                <option value="Cha/Mẹ">Cha / Mẹ</option>
                <option value="Khác">Cá nhân khác</option>
              </select>
            </div>

            <div className="col-span-1">
              <label htmlFor="ngay_sinh" className="block text-sm font-medium text-slate-700">Ngày sinh</label>
              <input
                type="date"
                id="ngay_sinh"
                name="ngay_sinh"
                value={formData.ngay_sinh}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1"></div>

            <div className="col-span-1">
              <label htmlFor="ma_so_thue" className="block text-sm font-medium text-slate-700">Mã số thuế</label>
              <input
                type="text"
                id="ma_so_thue"
                name="ma_so_thue"
                value={formData.ma_so_thue}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="so_cccd" className="block text-sm font-medium text-slate-700">Số CCCD</label>
              <input
                type="text"
                id="so_cccd"
                name="so_cccd"
                value={formData.so_cccd}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="tu_thang" className="block text-sm font-medium text-slate-700">Thời điểm tính giảm trừ <span className="text-red-500">*</span></label>
              <input
                type="month"
                id="tu_thang"
                name="tu_thang"
                required
                value={formData.tu_thang}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

            <div className="col-span-1">
              <label htmlFor="den_thang" className="block text-sm font-medium text-slate-700">Kết thúc giảm trừ (Bỏ trống nếu vô thời hạn)</label>
              <input
                type="month"
                id="den_thang"
                name="den_thang"
                value={formData.den_thang}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center">
              <input
                id="khong_su_dung"
                name="khong_su_dung"
                type="checkbox"
                checked={formData.khong_su_dung}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
              />
              <label htmlFor="khong_su_dung" className="ml-2 block text-sm font-medium text-slate-700">
                Đánh dấu người phụ thuộc không còn sử dụng (không tính giảm trừ)
              </label>
            </div>
          </div>

          <div className="pt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate(`/employees/${employeeId}/dependents`)}
              className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Đang lưu...' : 'Lưu hồ sơ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
