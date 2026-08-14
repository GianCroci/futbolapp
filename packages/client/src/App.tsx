import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Home, Telescope } from 'lucide-react';
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
  // The Auth0 isLoading/error gate moved into ProtectedRoute so public routes
  // (the future `/` landing) paint instantly instead of waiting on Auth0.
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
