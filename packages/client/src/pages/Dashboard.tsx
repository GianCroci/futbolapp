import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Shield } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { TeamCard } from '../components/teams/TeamCard';
import { TeamForm } from '../components/teams/TeamForm';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useTeamStore } from '../store/teamStore';
import { Team } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { teams, isLoading, error, fetchTeams, createTeam, updateTeam, deleteTeam } = useTeamStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  const handleCreate = async (name: string) => {
    await createTeam(name);
  };

  const handleEdit = async (name: string) => {
    if (editingTeam) {
      await updateTeam(editingTeam.id, name);
    }
  };

  const handleDelete = async () => {
    if (!deletingTeam) return;
    setIsDeleting(true);
    try {
      await deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Bienvenido, {user?.name || 'Invitado'}
            </h2>
            <p className="text-gray-500 mt-1">Gestioná tus equipos y formaciones</p>
          </div>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Nuevo equipo
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : teams.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-9 h-9" />}
          title="Todavía no tenés equipos"
          message="Creá tu primer equipo para empezar a gestionar jugadores y formaciones."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={(t) => {
                setEditingTeam(t);
                setIsFormOpen(true);
              }}
              onDelete={(t) => setDeletingTeam(t)}
              onClick={(t) => navigate(`/teams/${t.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Form */}
      <TeamForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTeam(null);
        }}
        onSubmit={editingTeam ? handleEdit : handleCreate}
        initialName={editingTeam?.name}
        title={editingTeam ? 'Editar equipo' : 'Nuevo equipo'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        onConfirm={handleDelete}
        title="Eliminar equipo"
        message={`¿Estás seguro de que querés eliminar "${deletingTeam?.name}"? Se eliminarán todos los jugadores y formaciones asociados. Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
