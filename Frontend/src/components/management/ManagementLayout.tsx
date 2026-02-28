import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, QrCode, Users, History, LogOut, ShieldCheck } from 'lucide-react';
import { useStore } from '../../lib/store';
import { getHostelAccent } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function ManagementLayout() {
  const { adminUser, logout } = useStore();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    nav('/');
  };

  const navItems = [
    { to: '/management', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/management/scanner', label: 'Scanner', icon: QrCode },
    { to: '/management/students', label: 'Students', icon: Users },
    { to: '/management/history', label: 'History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/5 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-none">OUTR Management</p>
            <p className={`text-xs font-semibold ${getHostelAccent(adminUser?.hostelName || '')}`}>
              {adminUser?.hostelName || 'All Hostels'} · {adminUser?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">{adminUser?.name}</span>
          <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-900/95 backdrop-blur-md border-t border-white/5 flex z-40">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 gap-1 transition-all ${
                isActive ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-emerald-500/20' : ''}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}