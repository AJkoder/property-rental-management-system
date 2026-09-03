import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Building2,
  Wrench,
  Receipt,
  Bell,
  LogOut,
} from 'lucide-react';

const managerLinks = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/units', label: 'Units', icon: Building2 },
  { to: '/requests', label: 'Maintenance', icon: Wrench },
  { to: '/payments', label: 'Rent', icon: Receipt },
  { to: '/alerts', label: 'Alerts', icon: Bell },
];

const contractorLinks = [
  { to: '/requests', label: 'My Requests', icon: Wrench },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'manager' ? managerLinks : contractorLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div className="flex h-screen bg-[color:var(--paper)]">
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[color:var(--ink)]/8 bg-[color:var(--surface)]">
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--brand)]">
            <Building2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-['Fraunces'] text-[15px] font-semibold text-[color:var(--ink)]">
            Property Manager
          </span>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-[color:var(--brand-tint)] text-[color:var(--brand-dark)]'
                    : 'text-[color:var(--ink-soft)] hover:bg-[color:var(--paper)] hover:text-[color:var(--ink)]'
                }`
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[color:var(--ink)]/8 p-3">
          <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--gold)] text-xs font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[color:var(--ink)]">{user?.name}</p>
              <p className="text-xs capitalize text-[color:var(--ink-faint)]">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-[color:var(--ink-soft)] transition hover:bg-[color:var(--coral-tint)] hover:text-[color:var(--coral)]"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <main className="h-screen flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-8">{children}</div>
      </main>
    </div>
  );
}