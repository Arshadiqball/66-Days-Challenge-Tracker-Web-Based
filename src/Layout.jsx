import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { LayoutDashboard, CalendarDays, Settings, Trophy, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const baseNavItems = [
  { name: 'Dashboard', page: 'Dashboard', icon: LayoutDashboard },
  { name: '66 Days',   page: 'Journey',   icon: CalendarDays },
];

const adminNavItems = [
  { name: 'Admin', page: 'Admin', icon: Settings },
];

export default function Layout({ children, currentPageName }) {
  const { user, logout } = useAuth();
  const navItems = user?.role === 'admin'
    ? [...baseNavItems, ...adminNavItems]
    : baseNavItems;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ background: 'var(--brand-navy)', fontFamily: 'Inter, sans-serif' }}>
      <style>{`
        :root {
          --brand-gold: #C9A84C;
          --brand-gold-light: #E8C96A;
          --brand-gold-dark: #A8882A;
          --brand-dark: #1A1A2E;
          --brand-navy: #0F0F23;
          --brand-mid: #16213E;
          --brand-surface: #1E2A45;
          --brand-surface-light: #243356;
          --text-primary: #F5F0E8;
          --text-secondary: #B8B0A0;
          --text-muted: #7A7268;
        }
        .border-gold { border-color: rgba(201,168,76,0.2) !important; }
        .glass-card { background: rgba(30,42,69,0.8); backdrop-filter: blur(12px); border: 1px solid rgba(201,168,76,0.15); }
        .day-card:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(201,168,76,0.15); border-color: rgba(201,168,76,0.4); }
        .day-card { transition: all 0.25s ease; }
        .font-playfair { font-family: 'Playfair Display', serif; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease forwards; }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        .text-gold-gradient { background: linear-gradient(135deg, #C9A84C, #E8C96A, #C9A84C); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        textarea, input { background: transparent !important; }
        textarea::placeholder, input::placeholder { color: var(--text-muted); }
      `}</style>

      {/* Sidebar – desktop */}
      <aside className="fixed left-0 top-0 h-full w-56 flex-col hidden md:flex z-40"
        style={{ background: 'rgba(15,15,35,0.97)', borderRight: '1px solid rgba(201,168,76,0.12)' }}>
        {/* Logo */}
        <div className="px-6 py-7 border-b" style={{ borderColor: 'rgba(201,168,76,0.12)' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)' }}>
              <Trophy size={16} style={{ color: '#1A1A2E' }} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-gold-gradient">66 Days</p>
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Challenge</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(({ name, page, icon: Icon }) => {
            const active = currentPageName === page;
            return (
              <Link key={page} to={createPageUrl(page)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(168,136,42,0.1))' : 'transparent',
                  color: active ? '#E8C96A' : 'var(--text-muted)',
                  borderLeft: active ? '2px solid #C9A84C' : '2px solid transparent',
                }}>
                <Icon size={16} />
                {name}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        {user && (
          <div className="px-4 pb-6 border-t pt-4" style={{ borderColor: 'rgba(201,168,76,0.12)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)', color: '#1A1A2E' }}>
                {(user.full_name || user.email || 'U')[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user.full_name || 'User'}
                </p>
                <p className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>{user.email}</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg w-full hover:bg-white/5 transition-colors"
              style={{ color: 'var(--text-muted)' }}>
              <LogOut size={12} /> Sign out
            </button>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{ background: 'rgba(15,15,35,0.97)', borderBottom: '1px solid rgba(201,168,76,0.12)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #C9A84C, #A8882A)' }}>
            <Trophy size={13} style={{ color: '#1A1A2E' }} />
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-gold-gradient">66 Days Challenge</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-1.5 rounded-lg hover:bg-white/10"
          style={{ color: 'var(--text-secondary)' }}>
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 pt-14"
          style={{ background: 'rgba(10,10,20,0.95)' }}
          onClick={() => setMobileOpen(false)}>
          <div className="px-4 py-6 space-y-1">
            {navItems.map(({ name, page, icon: Icon }) => (
              <Link key={page} to={createPageUrl(page)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
                style={{ color: currentPageName === page ? '#E8C96A' : 'var(--text-secondary)' }}>
                <Icon size={16} />
                {name}
              </Link>
            ))}
            {user && (
              <button onClick={logout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium w-full"
                style={{ color: 'var(--text-muted)' }}>
                <LogOut size={16} /> Sign out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:ml-56 pt-14 md:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}