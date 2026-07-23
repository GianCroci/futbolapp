import { Player } from '../../../types';

interface RosterProps {
  players: Player[];
  assignedPlayerIds: Set<string>;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPlayerClick: (player: Player) => void;
}

export function Roster({ players, assignedPlayerIds, searchQuery, onSearchChange, onPlayerClick }: RosterProps) {
  const filtered = players.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.dorsal?.toString() || '').includes(searchQuery)
  );

  const unassigned = filtered.filter((p) => !assignedPlayerIds.has(p.id));
  const assigned = filtered.filter((p) => assignedPlayerIds.has(p.id));

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-gray-200">
        <input
          type="text"
          placeholder="Buscar jugador..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {unassigned.length === 0 && assigned.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No hay jugadores disponibles
          </p>
        )}

        {assigned.length > 0 && (
          <>
            <p className="text-xs text-green-600 font-semibold uppercase tracking-wider mb-2">
              En cancha ({assigned.length})
            </p>
            {assigned.map((player) => (
              <button
                key={player.id}
                onClick={() => onPlayerClick(player)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-green-200 bg-green-50 hover:bg-green-100 transition-colors text-left"
              >
                <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold font-mono">
                  {player.dorsal ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{player.name}</p>
                  <p className="text-xs text-gray-400">{shortPosition(player.position)}</p>
                </div>
                <span className="text-xs text-red-500 font-medium">Quitar</span>
              </button>
            ))}
            <div className="border-t border-gray-200 pt-2 mt-2" />
          </>
        )}

        {unassigned.map((player) => (
          <button
            key={player.id}
            onClick={() => onPlayerClick(player)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all text-left"
          >
            <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center text-sm font-bold font-mono">
              {player.dorsal ?? '?'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{player.name}</p>
              <p className="text-xs text-gray-400">{shortPosition(player.position)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
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

function shortPosition(pos: string): string {
  return POSITION_SHORT[pos] || pos;
}
