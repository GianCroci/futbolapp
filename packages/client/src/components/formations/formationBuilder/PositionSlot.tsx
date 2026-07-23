import { useDroppable } from '@dnd-kit/core';
import { SlotAssignment } from '../../../store/formationStore';

interface PositionSlotProps {
  slot: SlotAssignment;
  isSelected?: boolean;
  onClick: () => void;
}

export function PositionSlot({ slot, isSelected, onClick }: PositionSlotProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot-${slot.slotPosition}`,
    data: { slotPosition: slot.slotPosition },
  });

  const hasPlayer = !!slot.playerId;

  return (
    <div
      ref={setNodeRef}
      onClick={onClick}
      className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all ${
        isOver ? 'scale-110 z-10' : ''
      }`}
      style={{
        left: `${slot.positionX}%`,
        top: `${slot.positionY}%`,
      }}
    >
      {hasPlayer ? (
        <div
          className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-md transition-all ${
            isSelected
              ? 'border-green-400 bg-green-500 text-white scale-110'
              : isOver
              ? 'border-green-300 bg-green-400 text-white'
              : 'border-white bg-green-700 text-white'
          }`}
        >
          {slot.playerDorsal && (
            <span className="text-[10px] leading-none font-mono opacity-80">
              {slot.playerDorsal}
            </span>
          )}
          <span className="text-xs font-bold leading-tight truncate max-w-[52px]">
            {slot.playerName?.split(' ').pop() || ''}
          </span>
        </div>
      ) : (
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed transition-all ${
            isOver
              ? 'border-green-400 bg-green-500/20 scale-110'
              : isSelected
              ? 'border-green-400 bg-green-500/10'
              : 'border-white/50 bg-white/10'
          }`}
        >
          <span className="text-white/60 text-xs font-semibold">
            {slot.slotPosition}
          </span>
        </div>
      )}
    </div>
  );
}
