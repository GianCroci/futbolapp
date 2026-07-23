import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { StatsTable } from '../components/stats/StatsTable';
import { useStatsStore } from '../store/statsStore';

export function StatsPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { stats, isLoading, error, fetchStats } = useStatsStore();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  useEffect(() => {
    if (teamId) fetchStats(teamId, from || undefined, to || undefined);
  }, [teamId, from, to, fetchStats]);

  return (
    <AppLayout>
      <div className="mb-4">
        <button
          onClick={() => navigate(`/teams/${teamId}`)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al equipo
        </button>

        <h2 className="text-2xl font-bold text-gray-800">Estadísticas</h2>
      </div>

      {/* Date filters */}
      <div className="flex items-center gap-4 mb-6">
        <div>
          <label htmlFor="from" className="block text-xs font-medium text-gray-500 mb-1">
            Desde
          </label>
          <input
            id="from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="to" className="block text-xs font-medium text-gray-500 mb-1">
            Hasta
          </label>
          <input
            id="to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>
        {(from || to) && (
          <button
            onClick={() => { setFrom(''); setTo(''); }}
            className="mt-5 text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <div className="text-center py-20">
          <p className="text-red-600 mb-2">Error al cargar estadísticas</p>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <StatsTable stats={stats} />
        </div>
      )}
    </AppLayout>
  );
}
