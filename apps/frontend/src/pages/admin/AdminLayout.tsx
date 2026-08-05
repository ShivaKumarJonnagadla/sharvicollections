import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Tags,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';

export function AdminLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const links = [
    { to: '/admin', label: t('admin.dashboard'), icon: LayoutDashboard, end: true },
    { to: '/admin/products', label: t('admin.products'), icon: Package },
    { to: '/admin/categories', label: t('admin.categories'), icon: Tags },
    { to: '/admin/orders', label: t('admin.orders'), icon: ShoppingCart },
    { to: '/admin/analytics', label: t('admin.analytics'), icon: BarChart3 },
    { to: '/admin/customers', label: t('admin.customers'), icon: Users },
    { to: '/admin/media', label: t('admin.media'), icon: Image },
    { to: '/admin/settings', label: t('admin.settings'), icon: Settings },
  ];

  const onLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <p className="font-serif text-xl text-maroon-700">Sharvi</p>
        <p className="text-xs text-ink/50">Admin</p>
      </div>
      <nav className="flex-1 space-y-1 px-3">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition',
                isActive ? 'bg-maroon-600 text-white' : 'text-ink/70 hover:bg-maroon-50',
              )
            }
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-maroon-100 p-4">
        <p className="mb-2 px-2 text-xs text-ink/50">{user?.email}</p>
        <button onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-maroon-600 hover:bg-maroon-50">
          <LogOut className="h-4 w-4" /> {t('admin.logout')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="admin-scope min-h-screen bg-ivory lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-maroon-100 bg-white lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-maroon-100 bg-white p-4 lg:hidden">
        <button aria-label="Menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-serif text-maroon-700">Sharvi Admin</span>
        <button onClick={onLogout} aria-label="Logout">
          <LogOut className="h-5 w-5 text-maroon-600" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white">
            <div className="flex justify-end p-4">
              <button aria-label="Close" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}

      <main className="p-5 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
