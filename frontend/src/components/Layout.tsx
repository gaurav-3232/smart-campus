import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, CalendarDays, Building2, BarChart3,
  LogOut, Menu, X, ChevronRight, GraduationCap,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/resources', label: 'Resources', icon: Building2 },
  { path: '/bookings', label: 'My Bookings', icon: CalendarDays },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, staffOnly: true },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isStaff } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNav = navItems.filter((item) => !item.staffOnly || isStaff);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-campus-950 text-white transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-campus-800">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-campus-400 to-accent-500 flex items-center justify-center">
            <GraduationCap size={20} />
          </div>
          <div>
            <h1 className="font-display font-bold text-sm tracking-tight">Smart Campus</h1>
            <p className="text-[11px] text-campus-300 font-mono">BOOKING SYSTEM</p>
          </div>
        </div>

        <nav className="mt-6 px-3 space-y-1">
          {filteredNav.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-campus-700/50 text-white'
                    : 'text-campus-300 hover:text-white hover:bg-campus-800/50'
                }`}
              >
                <item.icon size={18} />
                {item.label}
                {active && <ChevronRight size={14} className="ml-auto opacity-50" />}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-campus-800">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-campus-700 flex items-center justify-center text-xs font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-[11px] text-campus-400 capitalize font-mono">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-campus-400 hover:text-white hover:bg-campus-800/50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3 flex items-center gap-4 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-1">
            <Menu size={22} className="text-slate-600" />
          </button>
          <h2 className="font-display font-semibold text-sm">Smart Campus</h2>
        </header>

        <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
