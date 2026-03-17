import React, { useState, useEffect } from 'react';
import { taxService } from '../services/taxService';
import type { TaxRecord, TaxCalculationParams } from '../types/tax';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import { Calculator, Upload, CheckCircle2, AlertCircle, Calendar, Download, Search } from 'lucide-react';
import * as xlsx from 'xlsx';
import { format } from 'date-fns';

export default function TaxCalculation() {
  const { user } = useAuth();
  const [records, setRecords] = useState<TaxRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedMonth) {
      loadTaxRecords();
    }
  }, [selectedMonth]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadTaxRecords = async () => {
    try {
      setLoading(true);
      const queryMonth = `${selectedMonth}-01`;
      const data = await taxService.getHistory(queryMonth);
      setRecords(data);
    } catch (error: any) {
      showNotification('error', `Lỗi tải danh sách: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setCalculating(true);
    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result;
          const wb = xlsx.read(bstr, { type: 'binary' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = xlsx.utils.sheet_to_json<any>(ws);

          const params: TaxCalculationParams[] = data.map(row => ({
            ma_nv: String(row['Mã nhân viên'] || row['MaNV'] || '').trim(),
            ho_ten: String(row['Họ tên'] || row['HoTen'] || '').trim(),
            ma_so_thue: String(row['Mã số thuế'] || row['MaSoThue'] || '').trim(),
            tong_thu_nhap: Number(row['Tổng thu nhập'] || row['TongThuNhap'] || 0),
            kho_chiu_thue: Number(row['Không chịu thuế'] || row['KhoChiuThue'] || 0),
            bao_hiem: Number(row['Bảo hiểm'] || row['BaoHiem'] || 0)
          })).filter(r => r.ma_nv && r.ho_ten);

          if (params.length === 0) {
            throw new Error('Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra lại cấu trúc cột.');
          }

          const calculatedRecords = await taxService.calculateTaxes(params, selectedMonth, user.id);
          setRecords(calculatedRecords);
          showNotification('success', `Đã tính toán và lưu thuế TNCN cho ${calculatedRecords.length} nhân viên thành công.`);
        } catch (error: any) {
          showNotification('error', `Lỗi tính thuế: ${error.message}`);
        }
      };
      reader.readAsBinaryString(file);
    } catch (error: any) {
      showNotification('error', `Không thể đọc file: ${error.message}`);
    } finally {
      setCalculating(false);
      // Reset input value to allow uploading same file again
      if (e.target) e.target.value = '';
    }
  };

  const handleExportExcel = () => {
    if (records.length === 0) return;

    const exportData = records.map(r => ({
      'Tháng/Năm': format(new Date(r.thang_nam), 'MM/yyyy'),
      'Mã nhân viên': r.ma_nv,
      'Họ và tên': r.ho_ten,
      'Mã số thuế': r.ma_so_thue,
      'Tổng thu nhập': r.tong_thu_nhap,
      'Không chịu thuế': r.kho_chiu_thue,
      'Bảo hiểm': r.bao_hiem,
      'Số NPT': r.so_nguoi_phu_thuoc,
      'Thu nhập tính thuế': r.thu_nhap_tinh_thue,
      'Thuế TNCN Phải Nộp': r.thue_tncn_phai_nop
    }));

    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "BangTinhThue");
    xlsx.writeFile(wb, `Bang_Tinh_Thue_${selectedMonth}.xlsx`);
  };

  const filteredRecords = records.filter(r => 
    r.ho_ten.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.ma_nv.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Totals calculation
  const totalThuNhap = filteredRecords.reduce((acc, curr) => acc + Number(curr.tong_thu_nhap), 0);
  const totalThuePhaNop = filteredRecords.reduce((acc, curr) => acc + Number(curr.thue_tncn_phai_nop), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-primary-600" />
            Tính & Lịch sử Thuế TNCN
          </h1>
          <p className="text-slate-500 mt-1">Quản lý bảng tính thuế hàng tháng từ file thu nhập Excel</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <input 
               type="month"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               className="pl-9 pr-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm focus:ring-primary-500 focus:border-primary-500"
             />
          </div>

          <label className="relative cursor-pointer">
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={calculating}
            />
            <div className={`flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium ${calculating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700 transition-colors'}`}>
              <Upload className="w-4 h-4" />
              {calculating ? 'Đang tính toán...' : 'Import Data & Tính'}
            </div>
          </label>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
           <p className="text-sm font-medium text-slate-500 mb-1">Tổng SL nhân viên (Bảng lương)</p>
           <p className="text-2xl font-bold text-slate-900">{filteredRecords.length}</p>
         </div>
         <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm md:col-span-2">
           <p className="text-sm font-medium text-slate-500 mb-1">Tổng thu nhập toàn công ty</p>
           <p className="text-2xl font-bold text-slate-900">{formatCurrency(totalThuNhap)}</p>
         </div>
         <div className="bg-primary-50 p-4 rounded-lg border border-primary-100 shadow-sm">
           <p className="text-sm font-medium text-primary-700 mb-1">Tổng Thuế TNCN Phải Nộp</p>
           <p className="text-2xl font-bold text-primary-700">{formatCurrency(totalThuePhaNop)}</p>
         </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="relative max-w-sm w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Tìm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Xuất Excel
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">
                  Mã nhân viên
                </th>
                <th scope="col" className="px-4 py-3 text-left font-medium text-slate-500 uppercase tracking-wider">
                  Họ và tên
                </th>
                <th scope="col" className="px-4 py-3 justify-end text-right font-medium text-slate-500 uppercase tracking-wider">
                  Tổng thu nhập
                </th>
                <th scope="col" className="px-4 py-3 text-center font-medium text-slate-500 uppercase tracking-wider">
                  NPT
                </th>
                <th scope="col" className="px-4 py-3 justify-end text-right font-medium text-slate-500 uppercase tracking-wider">
                  Bảo hiểm / KCT
                </th>
                <th scope="col" className="px-4 py-3 justify-end text-right font-medium text-primary-700 uppercase tracking-wider">
                  Thu nhập TT
                </th>
                <th scope="col" className="px-4 py-3 justify-end text-right font-medium text-red-700 uppercase tracking-wider bg-red-50">
                  Thuế Phải Nộp
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                       <span className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></span>
                       Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                    Chưa có bảng tính thuế cho tháng này.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-900 font-medium">
                      {record.ma_nv}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-900">
                      {record.ho_ten}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right font-medium">
                      {formatCurrency(Number(record.tong_thu_nhap))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-slate-500">
                      {record.so_nguoi_phu_thuoc}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-slate-500">
                      <div>BH: {formatCurrency(Number(record.bao_hiem))}</div>
                      <div className="text-xs">KCT: {formatCurrency(Number(record.kho_chiu_thue))}</div>
                    </td>
                     <td className="px-4 py-3 whitespace-nowrap text-right text-primary-700 font-medium bg-primary-50/30">
                      {formatCurrency(Number(record.thu_nhap_tinh_thue))}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-red-700 font-bold bg-red-50">
                      {formatCurrency(Number(record.thue_tncn_phai_nop))}
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
