import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TeamForm } from '../components/teams/TeamForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useTeamStore } from '../store/teamStore';
import { usePlayerStore } from '../store/playerStore';
import { useFormationStore } from '../store/formationStore';
import { useStatsStore } from '../store/statsStore';
import { PlayerTable } from '../components/players/PlayerTable';
import { PlayerForm } from '../components/players/PlayerForm';
import { PlayerFilter } from '../components/players/PlayerFilter';
import { StatsTable } from '../components/stats/StatsTable';
import { Player, Formation } from '../types';
import { getPresetPositions } from '../utils/formationPresets';

type Tab = 'players' | 'formations' | 'stats';

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { currentTeam, isLoading: teamLoading, error, fetchTeam, updateTeam, deleteTeam } = useTeamStore();
  const { players, isLoading: playersLoading, fetchPlayers, createPlayer, updatePlayer, deletePlayer } = usePlayerStore();
  const { formations, isLoading: formationsLoading, fetchFormations, deleteFormation } = useFormationStore();
  const { stats, isLoading: statsLoading, fetchStats } = useStatsStore();

  // Team state
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Tabs
  const [activeTab, setActiveTab] = useState<Tab>('players');

  // Player form
  const [isPlayerFormOpen, setIsPlayerFormOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deletingPlayer, setDeletingPlayer] = useState<Player | null>(null);
  const [isDeletingPlayer, setIsDeletingPlayer] = useState(false);

  // Player filter
  const [positionFilter, setPositionFilter] = useState<string | null>(null);

  // Formations state
  const [deletingFormation, setDeletingFormation] = useState<Formation | null>(null);
  const [isDeletingFormation, setIsDeletingFormation] = useState(false);

  // Stats state
  const [statsFrom, setStatsFrom] = useState('');
  const [statsTo, setStatsTo] = useState('');

  // Map category to actual positions for API filtering
  const POSITION_MAP: Record<string, string[]> = {
    ARQUERO: ['ARQUERO'],
    DEFENSOR: ['DEFENSOR_CENTRAL', 'LATERAL_DERECHO', 'LATERAL_IZQUIERDO'],
    MEDIOCAMPO: ['MEDIOCENTRO_DEFENSIVO', 'MEDIOCENTRO_OFENSIVO', 'ENGANCHE', 'EXTREMO_DERECHO', 'EXTREMO_IZQUIERDO'],
    DELANTERO: ['DELANTERO_CENTRO', 'DELANTERO_PUNTA'],
  };

  useEffect(() => {
    if (teamId) fetchTeam(teamId);
  }, [teamId, fetchTeam]);

  useEffect(() => {
    if (teamId) fetchPlayers(teamId, positionFilter ? POSITION_MAP[positionFilter] : undefined);
  }, [teamId, positionFilter, fetchPlayers]);

  useEffect(() => {
    if (teamId && activeTab === 'formations') fetchFormations(teamId);
  }, [teamId, activeTab, fetchFormations]);

  useEffect(() => {
    if (teamId && activeTab === 'stats') fetchStats(teamId, statsFrom || undefined, statsTo || undefined);
  }, [teamId, activeTab, statsFrom, statsTo, fetchStats]);

  // Team handlers
  const handleEditTeam = async (name: string) => {
    if (teamId) {
      await updateTeam(teamId, name);
      setIsEditing(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    setIsDeleting(true);
    try {
      await deleteTeam(teamId);
      navigate('/dashboard', { replace: true });
    } finally {
      setIsDeleting(false);
    }
  };

  // Player handlers
  const handleCreatePlayer = async (data: { name: string; position: string; dorsal?: number | null }) => {
    if (!teamId) return;
    await createPlayer(teamId, data);
  };

  const handleEditPlayer = async (data: { name: string; position: string; dorsal?: number | null }) => {
    if (!teamId || !editingPlayer) return;
    await updatePlayer(teamId, editingPlayer.id, data);
  };

  const handleDeletePlayer = async () => {
    if (!teamId || !deletingPlayer) return;
    setIsDeletingPlayer(true);
    try {
      await deletePlayer(teamId, deletingPlayer.id);
      setDeletingPlayer(null);
    } finally {
      setIsDeletingPlayer(false);
    }
  };

  // Formation handlers
  const handleDeleteFormation = async () => {
    if (!teamId || !deletingFormation) return;
    setIsDeletingFormation(true);
    try {
      await deleteFormation(teamId, deletingFormation.id);
      setDeletingFormation(null);
    } finally {
      setIsDeletingFormation(false);
    }
  };

  const getFormationLabel = (ft: string | null): string => {
    if (!ft) return 'Personalizado';
    const labels: Record<string, string> = {
      F_4_4_2: '4-4-2', F_4_3_3: '4-3-3', F_3_5_2: '3-5-2',
      F_4_2_3_1: '4-2-3-1', F_5_3_2: '5-3-2', F_4_1_4_1: '4-1-4-1', F_3_4_3: '3-4-3',
    };
    return labels[ft] || ft;
  };

  if (teamLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (error || !currentTeam) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {error || 'Equipo no encontrado'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-green-600 hover:underline mt-2"
          >
            Volver al dashboard
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver
        </button>

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{currentTeam.name}</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Eliminar
            </button>
          </div>
        </div>

        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>👥 {currentTeam._count?.players || 0} jugadores</span>
          <span>📋 {currentTeam._count?.formations || 0} formaciones</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('players')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'players'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👥 Jugadores
          </button>
          <button
            onClick={() => setActiveTab('formations')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'formations'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📋 Formaciones
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'stats'
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 Estadísticas
          </button>
        </div>
      </div>

      {/* Players Tab */}
      {activeTab === 'players' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <PlayerFilter
              active={positionFilter}
              onChange={setPositionFilter}
            />
            <button
              onClick={() => {
                setEditingPlayer(null);
                setIsPlayerFormOpen(true);
              }}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar jugador
            </button>
          </div>

          {playersLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <PlayerTable
                players={players}
                onEdit={(player) => {
                  setEditingPlayer(player);
                  setIsPlayerFormOpen(true);
                }}
                onDelete={(player) => setDeletingPlayer(player)}
              />
            </div>
          )}
        </div>
      )}

      {/* Formations Tab */}
      {activeTab === 'formations' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">Formaciones</h3>
            <button
              onClick={() => navigate(`/teams/${teamId}/formations/new`)}
              className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva formación
            </button>
          </div>

          {formationsLoading ? (
            <div className="flex justify-center py-12">
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
                          year: 'numeric', month: 'long', day: 'numeric',
                        })}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingFormation(formation); }}
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
            isLoading={isDeletingFormation}
            confirmLabel="Eliminar formación"
          />
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          <div className="flex items-center gap-4 mb-4">
            <div>
              <label htmlFor="statsFrom" className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input
                id="statsFrom"
                type="date"
                value={statsFrom}
                onChange={(e) => setStatsFrom(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="statsTo" className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input
                id="statsTo"
                type="date"
                value={statsTo}
                onChange={(e) => setStatsTo(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
            </div>
            {(statsFrom || statsTo) && (
              <button
                onClick={() => { setStatsFrom(''); setStatsTo(''); }}
                className="mt-5 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          {statsLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <StatsTable stats={stats} />
            </div>
          )}
        </div>
      )}

      {/* Edit Team Form */}
      <TeamForm
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSubmit={handleEditTeam}
        initialName={currentTeam.name}
        title="Editar equipo"
      />

      {/* Delete Team Confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteTeam}
        title="Eliminar equipo"
        message={`¿Estás seguro de que querés eliminar "${currentTeam.name}"? Se eliminarán todos los jugadores y formaciones asociados. Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />

      {/* Create/Edit Player Form */}
      <PlayerForm
        isOpen={isPlayerFormOpen}
        onClose={() => {
          setIsPlayerFormOpen(false);
          setEditingPlayer(null);
        }}
        onSubmit={editingPlayer ? handleEditPlayer : handleCreatePlayer}
        initialData={
          editingPlayer
            ? { name: editingPlayer.name, position: editingPlayer.position, dorsal: editingPlayer.dorsal }
            : undefined
        }
        title={editingPlayer ? 'Editar jugador' : 'Agregar jugador'}
      />

      {/* Delete Player Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingPlayer}
        onClose={() => setDeletingPlayer(null)}
        onConfirm={handleDeletePlayer}
        title="Eliminar jugador"
        message={`¿Estás seguro de que querés eliminar a "${deletingPlayer?.name}"?`}
        isLoading={isDeletingPlayer}
        confirmLabel="Eliminar jugador"
      />
    </AppLayout>
  );
}
