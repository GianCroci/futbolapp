import { useState } from 'react';
import { Modal } from '../common/Modal';
import { useSubstitutionStore } from '../../store/substitutionStore';
import { FormationPlayer } from '../../types';

interface SubstitutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  formationId: string;
  starters: FormationPlayer[];
  substitutes: FormationPlayer[];
}

export function SubstitutionModal({
  isOpen,
  onClose,
  teamId,
  formationId,
  starters,
  substitutes,
}: SubstitutionModalProps) {
  const { createSubstitution } = useSubstitutionStore();
  const [playerOutId, setPlayerOutId] = useState('');
  const [playerInId, setPlayerInId] = useState('');
  const [minute, setMinute] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setPlayerOutId('');
    setPlayerInId('');
    setMinute('');
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerOutId) {
      setError('Seleccioná el jugador que sale');
      return;
    }
    if (!playerInId) {
      setError('Seleccioná el jugador que entra');
      return;
    }
    if (playerOutId === playerInId) {
      setError('No podés sustituir al mismo jugador');
      return;
    }
    if (!minute) {
      setError('Ingresá el minuto');
      return;
    }

    const minuteNum = parseInt(minute, 10);
    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 120) {
      setError('El minuto debe ser entre 0 y 120');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createSubstitution(teamId, formationId, {
        playerOutId,
        playerInId,
        minute: minuteNum,
      });
      resetForm();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ??
            'Error al guardar')
          : 'Error al guardar';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Registrar sustitución">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Player Out */}
        <div>
          <label htmlFor="playerOut" className="block text-sm font-medium text-gray-700 mb-1">
            Jugador que sale
          </label>
          <select
            id="playerOut"
            value={playerOutId}
            onChange={(e) => setPlayerOutId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="">Seleccionar jugador...</option>
            {starters.map((fp) => (
              <option key={fp.playerId} value={fp.playerId}>
                {fp.player?.name ?? fp.playerId}
                {fp.player?.dorsal ? ` (#${fp.player.dorsal})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Player In */}
        <div>
          <label htmlFor="playerIn" className="block text-sm font-medium text-gray-700 mb-1">
            Jugador que entra
          </label>
          <select
            id="playerIn"
            value={playerInId}
            onChange={(e) => setPlayerInId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          >
            <option value="">Seleccionar jugador...</option>
            {substitutes.map((fp) => (
              <option key={fp.playerId} value={fp.playerId}>
                {fp.player?.name ?? fp.playerId}
                {fp.player?.dorsal ? ` (#${fp.player.dorsal})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Minute */}
        <div>
          <label htmlFor="minute" className="block text-sm font-medium text-gray-700 mb-1">
            Minuto
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
          <div className="relative group">
            <button
              type="submit"
              disabled={isSubmitting || !playerOutId || !playerInId || !minute}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Guardando...' : 'Registrar'}
            </button>
            {(!playerOutId || !playerInId || !minute) && !isSubmitting && (
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                Completá jugador que sale, entra y minuto
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </span>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
}
