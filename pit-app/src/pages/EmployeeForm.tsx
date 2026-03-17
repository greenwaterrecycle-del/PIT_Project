import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { EmployeeFormData } from '../types/employee';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus, ArrowLeft, Save, Loader2 } from 'lucide-react';

export default function EmployeeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState<EmployeeFormData>({
    ma_nv: '',
    ho_ten: '',
    don_vi: '',
    ma_so_thue: '',
    so_cccd: '',
    da_nghi_viec: false
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode && id) {
      loadEmployee(id);
    }
  }, [id, isEditMode]);

  const loadEmployee = async (employeeId: string) => {
    try {
      setLoading(true);
      const data = await employeeService.getById(employeeId);
      if (data) {
        setFormData({
          ma_nv: data.ma_nv,
          ho_ten: data.ho_ten,
          don_vi: data.don_vi || '',
          ma_so_thue: data.ma_so_thue || '',
          so_cccd: data.so_cccd || '',
          da_nghi_viec: data.da_nghi_viec
        });
      }
    } catch (err: any) {
      setError(`Lỗi tải thông tin: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setSaving(true);
      setError(null);
      
      if (isEditMode && id) {
        await employeeService.update(id, formData);
      } else {
        await employeeService.create(formData, user.id);
      }
      
      navigate('/employees');
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
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-primary-600" />
            {isEditMode ? 'Chỉnh sửa Nhân viên' : 'Thêm mới Nhân viên'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isEditMode ? 'Cập nhật thông tin hồ sơ nhân viên' : 'Điền thông tin để tạo hồ sơ nhân viên mới'}
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
              <label htmlFor="ma_nv" className="block text-sm font-medium text-slate-700">Mã nhân viên <span className="text-red-500">*</span></label>
              <input
                type="text"
                id="ma_nv"
                name="ma_nv"
                required
                value={formData.ma_nv}
                onChange={handleChange}
                disabled={isEditMode}
                className={`mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${isEditMode ? 'bg-slate-100 cursor-not-allowed' : ''}`}
              />
            </div>

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

            <div className="col-span-1 md:col-span-2">
              <label htmlFor="don_vi" className="block text-sm font-medium text-slate-700">Đơn vị / Phòng ban</label>
              <input
                type="text"
                id="don_vi"
                name="don_vi"
                value={formData.don_vi}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>

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
          </div>

          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center">
              <input
                id="da_nghi_viec"
                name="da_nghi_viec"
                type="checkbox"
                checked={formData.da_nghi_viec}
                onChange={handleChange}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
              />
              <label htmlFor="da_nghi_viec" className="ml-2 block text-sm font-medium text-slate-700">
                Đánh dấu nhân viên đã nghỉ việc (Không tính vào bảng lương/thuế)
              </label>
            </div>
          </div>

          <div className="pt-6 flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => navigate('/employees')}
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
