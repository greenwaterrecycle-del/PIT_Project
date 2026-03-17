export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Tổng quan</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <p className="text-slate-500">
          Chào mừng đến với hệ thống Quản lý tính thuế Thu nhập cá nhân.
        </p>
        <p className="text-slate-500 mt-2">
          Vui lòng chọn mục chức năng từ menu bên trái để tiếp tục.
        </p>
      </div>
    </div>
  );
}
