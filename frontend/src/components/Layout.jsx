import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAlerts } from '../api/alerts';
import {
  Building2,
  LayoutGrid,
  Home,
  Wrench,
  Receipt,
  Bell,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid, managerOnly: true },
  { to: '/units', label: 'Units', icon: Home, managerOnly: true },
  { to: '/requests', label: 'Maintenance', icon: Wrench, managerOnly: false },
  { to: '/payments', label: 'Rent', icon: Receipt, managerOnly: true },
  { to: '/alerts', label: 'Alerts', icon: Bell, managerOnly: true },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);

  const isManager = user?.role === 'manager';
  const visibleItems = NAV_ITEMS.filter((item) => !item.managerOnly || isManager);

  useEffect(() => {
    if (!isManager) {
      return;
    }

    let cancelled = false;

    const loadAlertCount = () => {
      getAlerts()
        .then((res) => {
          if (!cancelled) {
            setAlertCount((res.data.alerts || []).length);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setAlertCount(0);
          }
        });
    };

    loadAlertCount();
    const interval = setInterval(loadAlertCount, 60000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isManager]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = (user?.name || user?.email || '?')
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[color:var(--paper)]">
      {/* Sidebar — desktop */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-[color:var(--border)] bg-[color:var(--surface)] lg:flex">
        <SidebarContent
          visibleItems={visibleItems}
          user={user}
          initials={initials}
          onLogout={handleLogout}
          alertCount={alertCount}
        />
      </aside>

      {/* Sidebar — mobile drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative flex h-full w-72 flex-col bg-[color:var(--surface)] shadow-2xl">
            <button
              onClick={() => setMobileNavOpen(false)}
              aria-label="Close navigation"
              className="absolute right-3 top-3 rounded-lg p-2 text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]"
            >
              <X className="h-5 w-5" />
            </button>
            <SidebarContent
              visibleItems={visibleItems}
              user={user}
              initials={initials}
              onLogout={handleLogout}
              onNavigate={() => setMobileNavOpen(false)}
              alertCount={alertCount}
            />
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar — mobile only */}
        <header className="flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--surface)] px-4 py-3 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            className="rounded-lg p-2 text-[color:var(--ink)] hover:bg-[color:var(--surface-2)]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--brand)]">
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-['Fraunces'] text-base font-semibold text-[color:var(--ink)]">
              Rental Desk
            </span>
          </div>

          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--brand-tint)] text-xs font-semibold text-[color:var(--brand)]">
            {initials}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-5 py-6 sm:px-8 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ visibleItems, user, initials, onLogout, onNavigate, alertCount }) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 pb-5 pt-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand)]">
          <Building2 className="h-4 w-4 text-white" />
        </div>
        <span className="font-['Fraunces'] text-lg font-semibold leading-tight text-[color:var(--ink)]">
          Rental Desk
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3.5">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-[color:var(--brand)] text-white shadow-sm'
                  : 'text-[color:var(--ink-soft)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/alerts' && alertCount > 0 && (
              <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[color:var(--red)] px-1.5 text-[11px] font-semibold text-white">
                {alertCount > 99 ? '99+' : alertCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="mt-4 border-t border-[color:var(--border)] px-3.5 py-4">
        <div className="flex items-center gap-3 rounded-xl px-2.5 py-2">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--brand-tint)] text-xs font-semibold text-[color:var(--brand)]">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[color:var(--ink)]">
              {user?.name || user?.email}
            </p>
            <p className="truncate text-xs capitalize text-[color:var(--ink-faint)]">
              {user?.role}
            </p>
          </div>
          <button
            onClick={onLogout}
            aria-label="Log out"
            title="Log out"
            className="rounded-lg p-2 text-[color:var(--ink-faint)] transition hover:bg-[color:var(--red-tint)] hover:text-[color:var(--red)]"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
