import { useState, useEffect, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, Goal, LayoutDashboard, Dumbbell, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  onNavigate: () => void;
}

function NavItem({ to, icon, label, onNavigate }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors ${
          isActive ? 'bg-green-700 font-medium' : 'hover:bg-green-700/70'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  );
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close drawer on Esc key while open
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-green-800 text-white flex items-center gap-3 px-4 py-3 shadow">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-1.5 rounded-lg hover:bg-green-700 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-bold flex items-center gap-2 text-lg">
          <Goal size={22} /> FutbolApp
        </h1>
      </header>

      {/* Overlay (mobile only, when drawer is open) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: fixed slide-in drawer on mobile, static column on md+ */}
      <div className="flex flex-1 min-w-0">
        <aside
          className={`bg-green-800 text-white flex flex-col w-72 fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:static md:translate-x-0 md:w-64 lg:w-72`}
        >
          {/* Header */}
          <div className="p-4 border-b border-green-700 flex items-center justify-between">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Goal size={24} /> FutbolApp
            </h1>
            <button
              onClick={closeSidebar}
              className="p-1.5 rounded-lg hover:bg-green-700 transition-colors md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            <NavItem
              to="/dashboard"
              icon={<LayoutDashboard size={18} />}
              label="Mis Equipos"
              onNavigate={closeSidebar}
            />
            <NavItem
              to="/entrenamientos"
              icon={<Dumbbell size={18} />}
              label="Entrenamientos"
              onNavigate={closeSidebar}
            />
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-green-700">
            <div className="flex items-center gap-3 mb-3">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-sm font-bold">
                  {user?.name?.charAt(0) || '?'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-green-300 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-green-300 hover:text-white hover:bg-green-700/70 transition-colors"
            >
              <LogOut size={18} /> Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
