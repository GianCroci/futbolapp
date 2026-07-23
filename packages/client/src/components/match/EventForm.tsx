import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useMatchEventStore } from '../../store/matchEventStore';
import { MatchEventType, FormationPlayer } from '../../types';

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  formationId: string;
  players: FormationPlayer[];
}

const EVENT_TYPES: { value: MatchEventType; label: string }[] = [
  { value: 'GOAL', label: 'Gol' },
  { value: 'ASSIST', label: 'Asistencia' },
  { value: 'YELLOW_CARD', label: 'Tarjeta amarilla' },
  { value: 'RED_CARD', label: 'Tarjeta roja' },
  { value: 'SUB_IN', label: 'Ingreso' },
  { value: 'SUB_OUT', label: 'Salida' },
];

export function EventForm({ isOpen, onClose, formationId, players }: EventFormProps) {
  const { createEvent } = useMatchEventStore();
  const [playerId, setPlayerId] = useState('');
  const [eventType, setEventType] = useState<MatchEventType>('GOAL');
  const [minute, setMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerId) {
      setError('Seleccioná un jugador');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createEvent(formationId, {
        playerId,
        eventType,
        minute: minute ? parseInt(minute, 10) : undefined,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar')
          : 'Error al guardar';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPlayerId('');
    setEventType('GOAL');
    setMinute('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar evento">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player dropdown */}
        <div>
          <label htmlFor="playerId" className="block text-sm font-medium text-gray-700 mb-1">
            Jugador
          </label>
          <select
            id="playerId"
            value={playerId}
            onChange={(e) => setPlayerId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="">Seleccionar jugador...</option>
            {players.map((fp) => (
              <option key={fp.playerId} value={fp.playerId}>
                {fp.player?.name ?? fp.playerId}
                {fp.player?.dorsal ? ` (#${fp.player.dorsal})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Event type */}
        <div>
          <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de evento
          </label>
          <select
            id="eventType"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as MatchEventType)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            {EVENT_TYPES.map((et) => (
              <option key={et.value} value={et.value}>
                {et.label}
              </option>
            ))}
          </select>
        </div>

        {/* Minute input */}
        <div>
          <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-1">
            Minuto (opcional)
          </label>
          <input
            id="minute"
            type="number"
            min={0}
            max={120}
            value={minute}
            onChange={(e) => setMinute(e.target.value)}
            placeholder="0-120"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
        </div>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Guardando...' : 'Registrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
