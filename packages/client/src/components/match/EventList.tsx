import { useState } from 'react';
import { useMatchEventStore } from '../../store/matchEventStore';
import { MatchEvent, MatchEventType } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface EventListProps {
  events: MatchEvent[];
  formationId: string;
  playerNames: Record<string, string>;
}

const EVENT_CONFIG: Record<MatchEventType, { label: string; icon: string; color: string }> = {
  GOAL: { label: 'Gol', icon: '⚽', color: 'text-green-700 bg-green-50' },
  ASSIST: { label: 'Asistencia', icon: '🅰️', color: 'text-blue-700 bg-blue-50' },
  YELLOW_CARD: { label: 'Tarjeta amarilla', icon: '🟨', color: 'text-yellow-700 bg-yellow-50' },
  RED_CARD: { label: 'Tarjeta roja', icon: '🟥', color: 'text-red-700 bg-red-50' },
  SUB_IN: { label: 'Ingreso', icon: '🟢', color: 'text-emerald-700 bg-emerald-50' },
  SUB_OUT: { label: 'Salida', icon: '🔴', color: 'text-rose-700 bg-rose-50' },
};

export function EventList({ events, formationId, playerNames }: EventListProps) {
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
      await deleteEvent(formationId, deletingEvent.id);
      setDeletingEvent(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <div className="text-4xl mb-2">📝</div>
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
              <span className="text-lg">{config.icon}</span>
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
