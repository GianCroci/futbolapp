import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';
import { Goal, Home, Telescope } from 'lucide-react';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { CallbackPage } from './pages/Callback';
import { DashboardPage } from './pages/Dashboard';
import { TeamDetailPage } from './pages/TeamDetail';
import { FormationHistoryPage } from './pages/FormationHistory';
import { FormationViewPage } from './pages/FormationView';
import FormationBuilderPage from './pages/FormationBuilder';
import { StatsPage } from './pages/StatsPage';
import { TrainingSessionsPage } from './pages/TrainingSessionsPage';
import { TrainingSessionDetail } from './pages/TrainingSessionDetail';

function App() {
  const { isLoading, error } = useAuth0();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Goal className="w-16 h-16 text-green-600 animate-pulse mx-auto mb-4" />
          <p className="text-gray-500">Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de conexión</h2>
          <p className="text-gray-600 mb-4">
            No se pudo conectar con el servicio de autenticación. Verificá tu conexión e intentá de nuevo.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/callback" element={<CallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId"
          element={
            <ProtectedRoute>
              <TeamDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/formations"
          element={
            <ProtectedRoute>
              <FormationHistoryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/formations/new"
          element={
            <ProtectedRoute>
              <FormationBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/formations/edit/:formationId"
          element={
            <ProtectedRoute>
              <FormationBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/formations/view/:formationId"
          element={
            <ProtectedRoute>
              <FormationViewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teams/:teamId/stats"
          element={
            <ProtectedRoute>
              <StatsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entrenamientos"
          element={
            <ProtectedRoute>
              <TrainingSessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/entrenamientos/:id"
          element={
            <ProtectedRoute>
              <TrainingSessionDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center px-4">
                <Telescope className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">404</h2>
                <p className="text-gray-500">Página no encontrada</p>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 text-green-600 hover:underline mt-4"
                >
                  <Home className="w-4 h-4" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
