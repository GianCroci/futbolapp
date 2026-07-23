import { useDraggable } from '@dnd-kit/core';
import { Player } from '../../../types';

interface DraggablePlayerProps {
  player: Player;
  isAssigned: boolean;
  onClick: () => void;
}

export function DraggablePlayer({ player, isAssigned, onClick }: DraggablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${player.id}`,
    data: { player },
    disabled: isAssigned,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
        isAssigned
          ? 'border-green-200 bg-green-50 opacity-60 cursor-not-allowed'
          : isDragging
          ? 'border-green-400 bg-white shadow-lg opacity-90'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      }`}
      style={style}
    >
      <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold font-mono">
        {player.dorsal ?? '?'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{player.name}</p>
        <p className="text-xs text-gray-400">{positionLabel(player.position)}</p>
      </div>
      {isAssigned && (
        <span className="text-xs text-green-600 font-medium">✓ En cancha</span>
      )}
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

function positionLabel(pos: string): string {
  return POSITION_SHORT[pos] || pos;
}
