import { useEffect, useState } from 'react';
import { Check, HeartPulse, Pencil, Plus, Trash2 } from 'lucide-react';
import { useInjuryStore } from '../../store/injuryStore';
import { usePlayerStore } from '../../store/playerStore';
import { InjuryForm } from './InjuryForm';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import type { Injury, CreateInjuryPayload } from '../../types';

interface InjuryTabProps {
  teamId: string;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  // Server stores dates as UTC midnight — use UTC to avoid timezone day shifts
  return d.toLocaleDateString('es-AR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function InjuryTab({ teamId }: InjuryTabProps) {
  const {
    injuries,
    isLoading,
    fetchInjuries,
    createInjury,
    updateInjury,
    deleteInjury,
    markRecovered,
  } = useInjuryStore();
  const { players, fetchPlayers } = usePlayerStore();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInjury, setEditingInjury] = useState<Injury | null>(null);
  const [deletingInjury, setDeletingInjury] = useState<Injury | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInjuries(teamId);
    fetchPlayers(teamId);
  }, [teamId, fetchInjuries, fetchPlayers]);

  const handleFormSubmit = async (data: CreateInjuryPayload) => {
    if (editingInjury) {
      await updateInjury(teamId, editingInjury.id, data);
    } else {
      await createInjury(teamId, data);
    }
    setIsFormOpen(false);
    setEditingInjury(null);
  };

  const handleEdit = (injury: Injury) => {
    setEditingInjury(injury);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingInjury) return;
    setIsDeleting(true);
    try {
      await deleteInjury(teamId, deletingInjury.id);
      setDeletingInjury(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkRecovered = async (injury: Injury) => {
    await markRecovered(teamId, injury.id);
  };

  const getPlayerName = (playerId: string): string => {
    const injury = injuries.find((i) => i.playerId === playerId);
    if (injury?.playerName) return injury.playerName;
    const player = players.find((p) => p.id === playerId);
    return player?.name || 'Jugador desconocido';
  };

  // Active injuries first, then sorted by incident date descending
  const sorted = [...injuries].sort((a, b) => {
    if (!a.recoveryDate && b.recoveryDate) return -1;
    if (a.recoveryDate && !b.recoveryDate) return 1;
    return new Date(b.incidentDate).getTime() - new Date(a.incidentDate).getTime();
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700">Lesiones</h3>
        <button
          onClick={() => {
            setEditingInjury(null);
            setIsFormOpen(true);
          }}
          className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Registrar lesión
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="w-10 h-10 text-green-600" />}
          title="No hay lesiones registradas"
          message="Todavía no registraste ninguna lesión para este equipo."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((injury) => (
            <InjuryCard
              key={injury.id}
              injury={injury}
              playerName={getPlayerName(injury.playerId)}
              onEdit={() => handleEdit(injury)}
              onDelete={() => setDeletingInjury(injury)}
              onMarkRecovered={() => handleMarkRecovered(injury)}
            />
          ))}
        </div>
      )}

      <InjuryForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingInjury(null);
        }}
        onSubmit={handleFormSubmit}
        players={players.map((p) => ({ id: p.id, name: p.name }))}
        initialData={editingInjury}
        title={editingInjury ? 'Editar lesión' : 'Registrar lesión'}
      />

      <ConfirmDialog
        isOpen={!!deletingInjury}
        onClose={() => setDeletingInjury(null)}
        onConfirm={handleDelete}
        title="Eliminar lesión"
        message={`¿Estás seguro de que querés eliminar la lesión de "${deletingInjury ? getPlayerName(deletingInjury.playerId) : ''}"?`}
        isLoading={isDeleting}
        confirmLabel="Eliminar lesión"
      />
    </div>
  );
}

/* Injury Card */

interface InjuryCardProps {
  injury: Injury;
  playerName: string;
  onEdit: () => void;
  onDelete: () => void;
  onMarkRecovered: () => void;
}

function InjuryCard({ injury, playerName, onEdit, onDelete, onMarkRecovered }: InjuryCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-800">{playerName}</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
              {injury.injuryType}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 text-sm text-gray-500">
            <span>Incidente: {formatDate(injury.incidentDate)}</span>
            {injury.recoveryDate ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                <Check className="w-3 h-3" />
                Recuperado: {formatDate(injury.recoveryDate)}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                En recuperación
              </span>
            )}
          </div>
          {injury.notes && (
            <p className="mt-1 text-sm text-gray-400 italic truncate max-w-md">{injury.notes}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!injury.recoveryDate && (
            <button
              onClick={onMarkRecovered}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Marcar recuperado"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
