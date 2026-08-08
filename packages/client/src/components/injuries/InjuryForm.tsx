import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import type { Injury, CreateInjuryPayload } from '../../types';

interface InjuryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateInjuryPayload) => Promise<void>;
  players: { id: string; name: string }[];
  initialData?: Injury | null;
  title: string;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function InjuryForm({ isOpen, onClose, onSubmit, players, initialData, title }: InjuryFormProps) {
  const [playerId, setPlayerId] = useState('');
  const [injuryType, setInjuryType] = useState('');
  const [incidentDate, setIncidentDate] = useState('');
  const [recoveryDate, setRecoveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  /* Reset or pre-fill form whenever the modal opens or initialData changes */
  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setPlayerId(initialData.playerId);
      setInjuryType(initialData.injuryType);
      setIncidentDate(initialData.incidentDate.split('T')[0]);
      setRecoveryDate(initialData.recoveryDate?.split('T')[0] ?? '');
      setNotes(initialData.notes ?? '');
    } else {
      setPlayerId('');
      setInjuryType('');
      setIncidentDate(getToday());
      setRecoveryDate('');
      setNotes('');
    }
    setFormError(null);
    setErrors({});
  }, [isOpen, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerId || !injuryType.trim() || !incidentDate) return;

    setIsSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      await onSubmit({
        playerId,
        injuryType: injuryType.trim(),
        incidentDate,
        ...(recoveryDate ? { recoveryDate } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });
      onClose();
    } catch (err: unknown) {
      let message = 'Error al guardar la lesión';
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        message = axiosErr.response?.data?.error || message;
      } else if (err instanceof Error) {
        message = err.message;
      }

      if (message.toLowerCase().includes('recuperación') || message.toLowerCase().includes('recovery')) {
        setErrors({ recoveryDate: message });
      } else {
        setFormError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = playerId && injuryType.trim() && incidentDate;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player select */}
        <div>
          <label htmlFor="injury-player" className="block text-sm font-medium text-gray-700 mb-1">
            Jugador *
          </label>
          {players.length === 0 ? (
            <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
              No hay jugadores en el equipo. Agregá jugadores primero desde la pestaña Jugadores.
            </p>
          ) : (
            <select
              id="injury-player"
              value={playerId}
              onChange={(e) => setPlayerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
              required
              disabled={isSubmitting}
            >
              <option value="">Seleccionar jugador</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Injury type */}
        <div>
          <label htmlFor="injury-type" className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de lesión *
          </label>
          <input
            id="injury-type"
            type="text"
            value={injuryType}
            onChange={(e) => setInjuryType(e.target.value)}
            placeholder="Ej: Desgarro, Esguince, Contusión..."
            maxLength={200}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            autoFocus
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Incident date */}
        <div>
          <label htmlFor="incident-date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha del incidente *
          </label>
          <input
            id="incident-date"
            type="date"
            value={incidentDate}
            onChange={(e) => setIncidentDate(e.target.value)}
            max={getToday()}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Recovery date */}
        <div>
          <label htmlFor="recovery-date" className="block text-sm font-medium text-gray-700 mb-1">
            Fecha de recuperación
          </label>
          <input
            id="recovery-date"
            type="date"
            value={recoveryDate}
            onChange={(e) => { setRecoveryDate(e.target.value); if (errors.recoveryDate) setErrors({}); }}
            min={incidentDate || undefined}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors ${errors.recoveryDate ? 'border-red-500' : 'border-gray-300'}`}
            disabled={isSubmitting}
          />
          {errors.recoveryDate && (
            <p className="text-sm text-red-600 mt-1">{errors.recoveryDate}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="injury-notes" className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            id="injury-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles adicionales..."
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors resize-none"
            disabled={isSubmitting}
          />
        </div>

        {formError && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{formError}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isValid}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
