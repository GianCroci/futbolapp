import { Pencil, Trash2, Users } from 'lucide-react';
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
        <div className="flex justify-center mb-3">
          <Users className="w-10 h-10 text-gray-300" />
        </div>
        <p className="text-gray-500">No hay jugadores en este equipo</p>
        <p className="text-sm text-gray-400 mt-1">Agregá jugadores usando el botón de arriba</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
            <th className="text-left py-3 px-4 font-medium">Dorsal</th>
            <th className="text-left py-3 px-4 font-medium">Nombre</th>
            <th className="text-left py-3 px-4 font-medium">Posición</th>
            <th className="text-right py-3 px-4 font-medium">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {players.map((player) => (
            <tr key={player.id} className="hover:bg-gray-50 transition-colors">
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
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(player)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
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
