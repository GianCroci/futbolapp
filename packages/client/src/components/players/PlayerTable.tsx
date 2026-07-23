import { Player } from '../../types';

interface PlayerTableProps {
  players: Player[];
  onEdit: (player: Player) => void;
  onDelete: (player: Player) => void;
}

const POSITION_LABELS: Record<string, string> = {
  ARQUERO: 'Arquero',
  DEFENSOR_CENTRAL: 'Defensor Central',
  LATERAL_DERECHO: 'Lateral Derecho',
  LATERAL_IZQUIERDO: 'Lateral Izquierdo',
  MEDIOCENTRO_DEFENSIVO: 'Mediocentro Defensivo',
  MEDIOCENTRO_OFENSIVO: 'Mediocentro Ofensivo',
  EXTREMO_DERECHO: 'Extremo Derecho',
  EXTREMO_IZQUIERDO: 'Extremo Izquierdo',
  ENGANCHE: 'Enganche',
  DELANTERO_CENTRO: 'Delantero Centro',
  DELANTERO_PUNTA: 'Delantero Punta',
};

export function PlayerTable({ players, onEdit, onDelete }: PlayerTableProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-3">👤</div>
        <p className="text-gray-500">No hay jugadores en este equipo</p>
        <p className="text-sm text-gray-400 mt-1">Agregá jugadores usando el botón de arriba</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-sm text-gray-500 uppercase tracking-wider">
            <th className="text-left py-3 px-4 font-medium">Dorsal</th>
            <th className="text-left py-3 px-4 font-medium">Nombre</th>
            <th className="text-left py-3 px-4 font-medium">Posición</th>
            <th className="text-right py-3 px-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <span className="font-mono font-bold text-lg text-green-700">
                  {player.dorsal ?? '—'}
                </span>
              </td>
              <td className="py-3 px-4 font-medium text-gray-800">{player.name}</td>
              <td className="py-3 px-4">
                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {POSITION_LABELS[player.position] || player.position}
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => onEdit(player)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(player)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
