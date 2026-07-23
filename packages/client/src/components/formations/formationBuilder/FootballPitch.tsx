import { SlotAssignment } from '../../../store/formationStore';

interface FootballPitchProps {
  slots: SlotAssignment[];
  selectedSlot: string | null;
  onSlotClick: (slotPosition: string) => void;
  children: React.ReactNode;
}

export function FootballPitch({ slots, selectedSlot, onSlotClick, children }: FootballPitchProps) {
  return (
    <div className="relative w-full aspect-[3/4] md:aspect-[2/3] max-h-[600px] rounded-xl overflow-hidden shadow-inner">
      {/* Field background */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-green-500 to-green-700">
        {/* Field markings */}
        <div className="absolute inset-[8%] border-2 border-white/30 rounded-lg" />
        <div className="absolute top-[50%] left-[8%] right-[8%] border-t-2 border-white/30" />
        <div className="absolute top-[8%] bottom-[8%] left-[50%] border-l-2 border-white/30" />
        {/* Center circle */}
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
        {/* Goal areas */}
        <div className="absolute top-0 left-[25%] right-[25%] h-[8%] border-2 border-white/30 border-t-0 rounded-b-sm" />
        <div className="absolute bottom-0 left-[25%] right-[25%] h-[8%] border-2 border-white/30 border-b-0 rounded-t-sm" />
        {/* Six-yard boxes */}
        <div className="absolute top-0 left-[38%] right-[38%] h-[4%] border-2 border-white/30 border-t-0" />
        <div className="absolute bottom-0 left-[38%] right-[38%] h-[4%] border-2 border-white/30 border-b-0" />
      </div>

      {/* Player slots */}
      {slots.map((slot) => {
        const slotId = `slot-${slot.slotPosition}`;
        return (
          <div
            key={slotId}
            onClick={() => onSlotClick(slot.slotPosition)}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all z-10`}
            style={{
              left: `${slot.positionX}%`,
              top: `${slot.positionY}%`,
            }}
          >
            {slot.playerId ? (
              <div
                className={`w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 shadow-md transition-all ${
                  selectedSlot === slot.slotPosition
                    ? 'border-yellow-400 bg-green-500 text-white scale-110 ring-2 ring-yellow-300'
                    : 'border-white bg-green-700/90 text-white hover:scale-105'
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
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-dashed border-white/40 bg-white/5 hover:bg-white/10 hover:border-white/60 transition-all">
                <span className="text-white/40 text-xs font-semibold">
                  {slot.slotPosition}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* DnD overlay area */}
      {children}
    </div>
  );
}
