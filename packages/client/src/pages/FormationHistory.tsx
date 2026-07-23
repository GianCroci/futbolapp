import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useFormationStore } from '../store/formationStore';
import { Formation } from '../types';
import { getPresetPositions } from '../utils/formationPresets';

export function FormationHistoryPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { formations, isLoading, fetchFormations, deleteFormation } = useFormationStore();

  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (teamId) fetchFormations(teamId);
  }, [teamId, fetchFormations]);

  const handleDeleteFormation = async () => {
    if (!teamId || !deletingFormation) return;
    setIsDeleting(true);
    try {
      await deleteFormation(teamId, deletingFormation.id);
      setDeletingFormation(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getFormationLabel = (ft: string | null): string => {
    if (!ft) return 'Personalizado';
    const labels: Record<string, string> = {
      F_4_4_2: '4-4-2',
      F_4_3_3: '4-3-3',
      F_3_5_2: '3-5-2',
      F_4_2_3_1: '4-2-3-1',
      F_5_3_2: '5-3-2',
      F_4_1_4_1: '4-1-4-1',
      F_3_4_3: '3-4-3',
    };
    return labels[ft] || ft;
  };

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate(`/teams/${teamId}`)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al equipo
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Formaciones</h2>
          <button
            onClick={() => navigate(`/teams/${teamId}/formations/new`)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nueva formación
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : formations.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Sin formaciones</h3>
          <p className="text-gray-500 mb-4">Todavía no creaste ninguna formación para este equipo.</p>
          <button
            onClick={() => navigate(`/teams/${teamId}/formations/new`)}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Crear primera formación
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formations.map((formation) => (
            <div
              key={formation.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/teams/${teamId}/formations/view/${formation.id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-gray-800">{formation.name}</h3>
                  <span className="text-xs text-gray-400">
                    {new Date(formation.date).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingFormation(formation);
                  }}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium">
                  {getFormationLabel(formation.formationType)}
                </span>
                <span className="text-gray-400 text-xs">
                  {(formation as Formation & { _count?: { players: number } })._count?.players || 0} jugadores
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingFormation}
        onClose={() => setDeletingFormation(null)}
        onConfirm={handleDeleteFormation}
        title="Eliminar formación"
        message={`¿Estás seguro de que querés eliminar "${deletingFormation?.name}"?`}
        isLoading={isDeleting}
        confirmLabel="Eliminar formación"
      />
    </AppLayout>
  );
}
