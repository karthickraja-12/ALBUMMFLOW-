import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Images, Upload, BarChart2,
  Palette, HardDrive, User, LogOut, Settings, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import clsx from 'clsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/collections', icon: Images, label: 'Collections' },
  { to: '/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/branding', icon: Palette, label: 'Branding' },
  { to: '/settings/drive', icon: HardDrive, label: 'Google Drive' },
  { to: '/account', icon: User, label: 'Account' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    toast.success('Signed out successfully');
    navigate('/login');
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside className="w-[260px] bg-white border-r border-slate-100 flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">AF</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">AlbumFlow</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Photo Management</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to}>
              {({ isActive }) => (
                <span className={clsx('sidebar-item', isActive && 'active')}>
                  <Icon size={16} />
                  {label}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t border-slate-100">
          {/* License badge */}
          <div className="px-3 py-2 mb-2 rounded-btn bg-slate-50 border border-slate-100">
            <p className="text-xs text-slate-500">License</p>
            <p className="text-xs font-semibold text-slate-700 capitalize mt-0.5">
              {user?.plan?.toLowerCase()} · {user?.license_status?.toLowerCase()}
            </p>
          </div>

          {/* User info */}
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-btn hover:bg-slate-50 cursor-default">
            <div className="w-7 h-7 rounded-full bg-navy-700 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {user?.full_name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-item w-full mt-1 text-red-500 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
