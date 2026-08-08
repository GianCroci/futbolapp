import { Pencil, Shirt, Trash2, Users } from 'lucide-react';
import { Team } from '../../types';

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (team: Team) => void;
  onClick: (team: Team) => void;
}

export function TeamCard({ team, onEdit, onDelete, onClick }: TeamCardProps) {
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-green-300 transition-all cursor-pointer group"
      onClick={() => onClick(team)}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 group-hover:text-green-700 transition-colors">
          {team.name}
        </h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(team);
            }}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Editar"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(team);
            }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-4 text-sm text-gray-500">
        <div className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          <span>{team._count?.players ?? 0} jugadores</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Shirt className="w-4 h-4" />
          <span>{team._count?.formations ?? 0} formaciones</span>
        </div>
      </div>
    </div>
  );
}
