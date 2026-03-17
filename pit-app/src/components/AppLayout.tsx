import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, FileSpreadsheet, Calculator, LogOut, Loader2 } from 'lucide-react';

export default function AppLayout() {
  const { user, session, signOut } = useAuth();
  const location = useLocation();

  if (session === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const navigation = [
    { name: 'Dashboard', href: '/', icon: FileSpreadsheet },
    { name: 'Nhân viên', href: '/employees', icon: Users },
    { name: 'Tính thuế TNCN', href: '/calculate-tax', icon: Calculator },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="text-xl font-bold text-primary-600">PIT App</h1>
        </div>
        
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || 
                             (item.href !== '/' && location.pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto absolute bottom-0 w-64 p-4 border-t">
          <div className="flex items-center gap-3 mb-4 truncate px-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm font-medium text-slate-700 truncate">
              {user.email}
            </div>
          </div>
          
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
