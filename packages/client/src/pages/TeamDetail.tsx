import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TeamForm } from '../components/teams/TeamForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useTeamStore } from '../store/teamStore';
import { usePlayerStore } from '../store/playerStore';
import { PlayerTable } from '../components/players/PlayerTable';
import { PlayerForm, PLAYER_POSITIONS } from '../components/players/PlayerForm';
import { PlayerFilter } from '../components/players/PlayerFilter';
import { Player } from '../types';

type Tab = 'players' | 'formations' | 'stats';

export function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { currentTeam, isLoading: teamLoading, error, fetchTeam, updateTeam, deleteTeam } = useTeamStore();
  const { players, isLoading: playersLoading, fetchPlayers, createPlayer, updatePlayer, deletePlayer } = usePlayerStore();

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

  useEffect(() => {
    if (teamId) fetchTeam(teamId);
  }, [teamId, fetchTeam]);

  useEffect(() => {
    if (teamId) fetchPlayers(teamId, positionFilter ?? undefined);
  }, [teamId, positionFilter, fetchPlayers]);

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
              positions={PLAYER_POSITIONS}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Formaciones tácticas</h3>
          <p className="text-gray-500 mb-6">
            Creá y gestioná las formaciones de tu equipo para cada partido.
          </p>
          <button
            onClick={() => navigate(`/teams/${teamId}/formations`)}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ir a formaciones
          </button>
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Estadísticas del equipo</h3>
          <p className="text-gray-500 mb-6">
            Visualizá las estadísticas de tus jugadores: goles, asistencias, tarjetas y minutos jugados.
          </p>
          <button
            onClick={() => navigate(`/teams/${teamId}/stats`)}
            className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Ver estadísticas
          </button>
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
