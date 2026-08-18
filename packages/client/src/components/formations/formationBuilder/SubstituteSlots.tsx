import { Trash2 } from 'lucide-react';
import { Player } from '../../../types';

export interface SubstituteEntry {
  playerId: string;
  playerName: string;
  playerDorsal: number | null;
  subInMinute: number;
}

const POSITION_SHORT: Record<string, string> = {
  ARQUERO: 'ARQ',
  DEFENSOR_CENTRAL: 'DFC',
  LATERAL_DERECHO: 'LD',
  LATERAL_IZQUIERDO: 'LI',
  MEDIOCENTRO_DEFENSIVO: 'MCD',
  MEDIOCENTRO_OFENSIVO: 'MCO',
  EXTREMO_DERECHO: 'ED',
  EXTREMO_IZQUIERDO: 'EI',
  ENGANCHE: 'ENG',
  DELANTERO_CENTRO: 'DC',
  DELANTERO_PUNTA: 'DP',
};

interface SubstituteSlotsProps {
  substitutes: SubstituteEntry[];
  allPlayers: Player[];
  minSlots?: number;
  maxSlots?: number;
  onRemove: (playerId: string) => void;
  onUpdateMinute: (playerId: string, minute: number) => void;
}

export function SubstituteSlots({
  substitutes,
  allPlayers,
  minSlots = 6,
  maxSlots = 12,
  onRemove,
  onUpdateMinute,
}: SubstituteSlotsProps) {
  const slotCount = Math.max(minSlots, Math.min(substitutes.length, maxSlots));

  return (
    <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-green-800">
            Suplentes
          </h3>
          <p className="text-xs text-green-600 mt-0.5">
            {substitutes.length} de {maxSlots} máximo · Mín. {minSlots} para completar el plantel
          </p>
        </div>
        {substitutes.length > 0 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
            {substitutes.length}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: slotCount }).map((_, i) => {
          const sub = substitutes[i];

          if (!sub) {
            return (
              <div
                key={`empty-${i}`}
                className="flex flex-col items-center justify-center px-3 py-4 rounded-lg border-2 border-dashed border-green-200 bg-white/50 min-h-[100px]"
              >
                <span className="text-green-300 text-xs font-semibold">#{i + 1}</span>
                <span className="text-green-300 text-[10px] mt-1">Vacío</span>
              </div>
            );
          }

          const player = allPlayers.find((p) => p.id === sub.playerId);
          const positionLabel = player ? POSITION_SHORT[player.position] || player.position : '';

          return (
            <div
              key={sub.playerId}
              className="flex flex-col items-center gap-2 px-3 py-3 bg-white rounded-lg border border-green-200 min-h-[100px]"
            >
              <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold font-mono shrink-0">
                {sub.playerDorsal ?? '?'}
              </span>
              <p className="text-sm font-medium text-gray-800 truncate max-w-full text-center">
                {sub.playerName}
              </p>
              {positionLabel && (
                <p className="text-[10px] text-gray-400">{positionLabel}</p>
              )}
              <div className="flex items-center gap-1">
                <label className="text-[10px] text-green-600">Min:</label>
                <input
                  type="number"
                  min={0}
                  max={120}
                  value={sub.subInMinute}
                  onChange={(e) =>
                    onUpdateMinute(sub.playerId, parseInt(e.target.value, 10) || 0)
                  }
                  className="w-12 border border-green-300 rounded px-1 py-0.5 text-[10px] text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                />
              </div>
              <button
                onClick={() => onRemove(sub.playerId)}
                className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 font-medium px-2 py-0.5 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Quitar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
