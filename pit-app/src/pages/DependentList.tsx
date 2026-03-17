import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Employee } from '../types/employee';
import type { Dependent } from '../types/dependent';
import { employeeService } from '../services/employeeService';
import { dependentService } from '../services/dependentService';
import { Users, Plus, Edit, Trash2, ArrowLeft, Loader2, Info, UserRound } from 'lucide-react';
import { format } from 'date-fns';

export default function DependentList() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      loadData(employeeId);
    }
  }, [employeeId]);

  const loadData = async (empId: string) => {
    try {
      setLoading(true);
      const [empData, depsData] = await Promise.all([
        employeeService.getById(empId),
        dependentService.getByEmployeeId(empId)
      ]);
      setEmployee(empData);
      setDependents(depsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Đã xảy ra lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người phụ thuộc này?')) {
      return;
    }
    
    try {
      await dependentService.delete(id);
      setDependents(dependents.filter(dep => dep.id !== id));
    } catch (error: any) {
      alert(`Lỗi khi xóa: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-10">
        <Info className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-lg font-medium text-slate-900">Không tìm thấy nhân viên</h2>
        <button onClick={() => navigate('/employees')} className="mt-4 text-primary-600 hover:text-primary-800">
          Quay lại danh sách nhân viên
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/employees')}
          className="p-2 hover:bg-slate-200 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <UserRound className="w-6 h-6 text-primary-600" />
            Người phụ thuộc
          </h1>
          <p className="text-slate-500 mt-1">
            Nhân viên: <span className="font-semibold text-slate-700">{employee.ho_ten}</span> ({employee.ma_nv})
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          onClick={() => navigate(`/employees/${employeeId}/dependents/new`)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm người phụ thuộc
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Quan hệ
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  MST / CCCD
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Thời gian giảm trừ
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
              {dependents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <Users className="w-10 h-10 text-slate-300 mb-2" />
                      <p>Nhân viên này chưa có người phụ thuộc nào.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                dependents.map((dependent) => (
                  <tr key={dependent.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                      <div>{dependent.ho_ten}</div>
                      {dependent.ngay_sinh && (
                        <div className="text-xs text-slate-500 font-normal mt-0.5">
                          NS: {format(new Date(dependent.ngay_sinh), 'dd/MM/yyyy')}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {dependent.moi_quan_he}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      <div>{dependent.ma_so_thue || '-'}</div>
                      <div className="text-xs text-slate-400 mt-1">{dependent.so_cccd || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                      {format(new Date(dependent.tu_thang), 'MM/yyyy')} 
                      {' - '}
                      {dependent.den_thang ? format(new Date(dependent.den_thang), 'MM/yyyy') : 'Nay'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {dependent.khong_su_dung ? (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                           Ngừng giảm trừ
                         </span>
                      ) : (
                         <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                           Đang áp dụng
                         </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          title="Sửa thông tin"
                          onClick={() => navigate(`/employees/${employeeId}/dependents/${dependent.id}/edit`)}
                          className="text-amber-600 hover:text-amber-900 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          title="Xóa"
                          onClick={() => handleDelete(dependent.id)}
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
