import { Modal } from '../common/Modal';
import { useState } from 'react';

export const PLAYER_POSITIONS = [
  { value: 'ARQUERO', label: 'Arquero' },
  { value: 'DEFENSOR_CENTRAL', label: 'Defensor Central' },
  { value: 'LATERAL_DERECHO', label: 'Lateral Derecho' },
  { value: 'LATERAL_IZQUIERDO', label: 'Lateral Izquierdo' },
  { value: 'MEDIOCENTRO_DEFENSIVO', label: 'Mediocentro Defensivo' },
  { value: 'MEDIOCENTRO_OFENSIVO', label: 'Mediocentro Ofensivo' },
  { value: 'EXTREMO_DERECHO', label: 'Extremo Derecho' },
  { value: 'EXTREMO_IZQUIERDO', label: 'Extremo Izquierdo' },
  { value: 'ENGANCHE', label: 'Enganche' },
  { value: 'DELANTERO_CENTRO', label: 'Delantero Centro' },
  { value: 'DELANTERO_PUNTA', label: 'Delantero Punta' },
];

interface PlayerFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; position: string; dorsal?: number | null }) => Promise<void>;
  initialData?: { name: string; position: string; dorsal?: number | null };
  title: string;
}

export function PlayerForm({ isOpen, onClose, onSubmit, initialData, title }: PlayerFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [dorsal, setDorsal] = useState<string>(initialData?.dorsal?.toString() || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !position) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        name: name.trim(),
        position,
        dorsal: dorsal ? parseInt(dorsal, 10) : null,
      });
      setName('');
      setPosition('');
      setDorsal('');
      onClose();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Error al guardar el jugador');
      } else {
        setError('Error al guardar el jugador');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="player-name" className="block text-sm font-medium text-gray-700 mb-1">
            Nombre *
          </label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Lionel Messi"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
            autoFocus
            required
          />
        </div>

        <div>
          <label htmlFor="player-position" className="block text-sm font-medium text-gray-700 mb-1">
            Posición *
          </label>
          <select
            id="player-position"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
            required
          >
            <option value="">Seleccionar posición</option>
            {PLAYER_POSITIONS.map((pos) => (
              <option key={pos.value} value={pos.value}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="player-dorsal" className="block text-sm font-medium text-gray-700 mb-1">
            Dorsal
          </label>
          <input
            id="player-dorsal"
            type="number"
            min={1}
            max={99}
            value={dorsal}
            onChange={(e) => setDorsal(e.target.value)}
            placeholder="Ej: 10"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
          />
          <p className="text-xs text-gray-400 mt-1">Número entre 1 y 99 (opcional)</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !position}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
