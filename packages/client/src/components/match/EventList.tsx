import { useState } from 'react';
import type { ReactNode } from 'react';
import { CircleDot, Goal, Pencil } from 'lucide-react';
import { useMatchEventStore } from '../../store/matchEventStore';
import { MatchEvent, MatchEventType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface EventListProps {
  events: MatchEvent[];
  teamId: string;
  formationId: string;
  playerNames: Record<string, string>;
}

const EVENT_CONFIG: Record<MatchEventType, { label: string; marker: ReactNode; color: string }> = {
  GOAL: { label: 'Gol', marker: <Goal className="w-5 h-5" />, color: 'text-green-700 bg-green-50' },
  ASSIST: { label: 'Asistencia', marker: <CircleDot className="w-5 h-5" />, color: 'text-emerald-700 bg-emerald-50' },
  YELLOW_CARD: {
    label: 'Tarjeta amarilla',
    marker: <span className="inline-block w-3 h-3 rounded-sm bg-yellow-400" />,
    color: 'text-yellow-700 bg-yellow-50',
  },
  RED_CARD: {
    label: 'Tarjeta roja',
    marker: <span className="inline-block w-3 h-3 rounded-sm bg-red-600" />,
    color: 'text-red-700 bg-red-50',
  },
  SUB_IN: {
    label: 'Ingreso',
    marker: <span className="inline-block w-3 h-3 rounded-full bg-green-600" />,
    color: 'text-emerald-700 bg-emerald-50',
  },
  SUB_OUT: {
    label: 'Salida',
    marker: <span className="inline-block w-3 h-3 rounded-full bg-red-500" />,
    color: 'text-rose-700 bg-rose-50',
  },
};

export function EventList({ events, teamId, formationId, playerNames }: EventListProps) {
  const { deleteEvent } = useMatchEventStore();
  const [deletingEvent, setDeletingEvent] = useState<MatchEvent | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const sorted = [...events].sort((a, b) => {
    const minA = a.minute ?? Infinity;
    const minB = b.minute ?? Infinity;
    return minA - minB;
  });

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setIsDeleting(true);
    try {
      await deleteEvent(teamId, formationId, deletingEvent.id);
      setDeletingEvent(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Pencil className="w-10 h-10 mx-auto mb-2" />
        <p className="text-sm">No hay eventos registrados</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {sorted.map((event) => {
          const config = EVENT_CONFIG[event.eventType];
          return (
            <div
              key={event.id}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${config.color}`}
            >
              <span className="flex items-center justify-center w-5 h-5 shrink-0">{config.marker}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {playerNames[event.playerId] ?? 'Jugador'}
                </p>
                <p className="text-xs opacity-75">{config.label}</p>
              </div>
              {event.minute != null && (
                <span className="text-xs font-mono opacity-75">{event.minute}&apos;</span>
              )}
              <button
                onClick={() => setDeletingEvent(event)}
                className="p-1 opacity-50 hover:opacity-100 transition-opacity"
                title="Eliminar evento"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        onConfirm={handleDelete}
        title="Eliminar evento"
        message="¿Estás seguro de que querés eliminar este evento?"
        isLoading={isDeleting}
        confirmLabel="Eliminar evento"
      />
    </>
  );
}
