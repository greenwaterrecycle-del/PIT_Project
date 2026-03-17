import React, { useState, useEffect } from 'react';
import type { Employee } from '../types/employee';
import { employeeService } from '../services/employeeService';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Plus, Search, Upload, 
  Edit, Trash2, UserPlus, Info, CheckCircle2, AlertCircle
} from 'lucide-react';
import * as xlsx from 'xlsx';
import { useNavigate } from 'react-router-dom';

export default function EmployeeList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [importing, setImporting] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const data = await employeeService.getAll();
      setEmployees(data);
    } catch (error: any) {
      showNotification('error', `Lỗi tải danh sách nhân viên: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này? Tất cả người phụ thuộc của nhân viên này cũng sẽ bị xóa.')) {
      return;
    }
    
    try {
      await employeeService.delete(id);
      setEmployees(employees.filter(emp => emp.id !== id));
      showNotification('success', 'Xóa nhân viên thành công');
    } catch (error: any) {
      showNotification('error', `Lỗi khi xóa: ${error.message}`);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setImporting(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = xlsx.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = xlsx.utils.sheet_to_json<any>(ws);

          const formattedData = data.map(row => ({
            ma_nv: String(row['Mã nhân viên'] || row['MaNV'] || '').trim(),
            ho_ten: String(row['Họ tên'] || row['HoTen'] || '').trim(),
            don_vi: String(row['Đơn vị'] || row['DonVi'] || '').trim(),
            ma_so_thue: String(row['Mã số thuế'] || row['MaSoThue'] || '').trim(),
            so_cccd: String(row['Số CCCD'] || row['SoCCCD'] || '').trim(),
            da_nghi_viec: String(row['Đã nghỉ việc'] || '').toUpperCase() === 'X' || String(row['Đã nghỉ việc'] || '').toUpperCase() === 'CÓ'
          })).filter(emp => emp.ma_nv && emp.ho_ten); // Filter out empty rows

          if (formattedData.length === 0) {
            throw new Error('Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra lại cấu trúc cột.');
          }

          await employeeService.bulkCreate(formattedData, user.id);
          showNotification('success', `Đã import thành công ${formattedData.length} nhân viên.`);
          loadEmployees();
        } catch (error: any) {
          showNotification('error', `Lỗi xử lý file Excel: ${error.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      showNotification('error', `Không thể đọc file: ${error.message}`);
    } finally {
      setImporting(false);
      // Reset input value to allow uploading same file again
      if (e.target) e.target.value = '';
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.ma_nv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.don_vi && emp.don_vi.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary-600" />
            Quản lý Nhân viên
          </h1>
          <p className="text-slate-500 mt-1">Quản lý thông tin chung và người phụ thuộc</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="relative cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={importing}
            />
            <div className={`flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium ${importing ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-700 hover:bg-slate-50 transition-colors'}`}>
              <Upload className="w-4 h-4" />
              {importing ? 'Đang Import...' : 'Import Excel'}
            </div>
          </label>
          <button 
            onClick={() => navigate('/employees/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm mới
          </button>
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-md border flex items-start gap-3 ${
          notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-green-600" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
          )}
          <p className="text-sm font-medium">{notification.message}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm theo Mã NV, Tên, Đơn vị..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Mã nhân viên
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Đơn vị
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  MST / CCCD
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Hành động</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                       <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
                       Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Info className="w-10 h-10 text-slate-300 mb-2" />
                      <p>Không tìm thấy nhân viên nào.</p>
                      <p className="text-sm mt-1">Hãy thêm mới hoặc import từ file Excel.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      {employee.ma_nv}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 font-medium">
                      {employee.ho_ten}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {employee.don_vi || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>{employee.ma_so_thue || '-'}</div>
                      <div className="text-xs text-slate-400 mt-1">{employee.so_cccd || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {employee.da_nghi_viec ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                           Đã nghỉ việc
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Đang làm việc
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          title="Người phụ thuộc"
                          onClick={() => navigate(`/employees/${employee.id}/dependents`)}
                          className="text-primary-600 hover:text-primary-900 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                        </button>
                        <button 
                          title="Sửa thông tin"
                          onClick={() => navigate(`/employees/${employee.id}/edit`)}
                          className="text-amber-600 hover:text-amber-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          title="Xóa"
                          onClick={() => handleDelete(employee.id)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
