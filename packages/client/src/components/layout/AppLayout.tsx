import { useAuth } from '../../hooks/useAuth';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-green-800 text-white flex flex-col">
        <div className="p-4 border-b border-green-700">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <span>⚽</span> FutbolApp
          </h1>
        </div>

        <nav className="flex-1 p-4">
          <a
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <span>📋</span> Mis Equipos
          </a>
        </nav>

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
            className="w-full text-sm text-green-300 hover:text-white transition-colors text-left px-1"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
