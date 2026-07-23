import { Player } from '../../../types';

export interface SubstituteEntry {
  playerId: string;
  playerName: string;
  playerDorsal: number | null;
  subInMinute: number;
}

interface SubstitutesPanelProps {
  substitutes: SubstituteEntry[];
  assignedPlayerIds: Set<string>;
  allPlayers: Player[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onAddSubstitute: (player: Player) => void;
  onRemoveSubstitute: (playerId: string) => void;
  onUpdateMinute: (playerId: string, minute: number) => void;
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

export function SubstitutesPanel({
  substitutes,
  assignedPlayerIds,
  allPlayers,
  searchQuery,
  onSearchChange,
  onAddSubstitute,
  onRemoveSubstitute,
  onUpdateMinute,
}: SubstitutesPanelProps) {
  const subPlayerIds = new Set(substitutes.map((s) => s.playerId));
  const available = allPlayers.filter(
    (p) =>
      !assignedPlayerIds.has(p.id) &&
      !subPlayerIds.has(p.id) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.dorsal?.toString() || '').includes(searchQuery))
  );

  return (
    <div className="mx-4 mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-blue-800">Suplentes</h3>
          <p className="text-xs text-blue-500">
            {substitutes.length} de 12 máximo · Mín. 6 para completar el plantel
          </p>
        </div>
        {substitutes.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
            {substitutes.length}
          </span>
        )}
      </div>

      {/* Current substitutes */}
      {substitutes.length > 0 && (
        <div className="space-y-2 mb-3">
          {substitutes.map((sub) => {
            const player = allPlayers.find((p) => p.id === sub.playerId);
            return (
              <div
                key={sub.playerId}
                className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-blue-200"
              >
                <span className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold font-mono">
                  {sub.playerDorsal ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{sub.playerName}</p>
                  <p className="text-xs text-gray-400">
                    {player ? POSITION_SHORT[player.position] || player.position : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-blue-600">Min:</label>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={sub.subInMinute}
                    onChange={(e) =>
                      onUpdateMinute(sub.playerId, parseInt(e.target.value, 10) || 0)
                    }
                    className="w-14 border border-blue-300 rounded px-2 py-1 text-xs text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                <button
                  onClick={() => onRemoveSubstitute(sub.playerId)}
                  className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors"
                >
                  Quitar
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add substitute search */}
      <div className="border-t border-blue-200 pt-3">
        <input
          type="text"
          placeholder="Buscar jugador para agregar como suplente..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-blue-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
        {searchQuery && available.length > 0 && (
          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
            {available.slice(0, 10).map((player) => (
              <button
                key={player.id}
                onClick={() => {
                  onAddSubstitute(player);
                  onSearchChange('');
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm transition-all text-left"
              >
                <span className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold font-mono">
                  {player.dorsal ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{player.name}</p>
                  <p className="text-xs text-gray-400">
                    {POSITION_SHORT[player.position] || player.position}
                  </p>
                </div>
                <span className="text-xs text-blue-600 font-medium">+ Agregar</span>
              </button>
            ))}
          </div>
        )}
        {searchQuery && available.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-2">
            No hay jugadores disponibles con ese nombre
          </p>
        )}
      </div>
    </div>
  );
}
