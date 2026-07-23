interface PlayerFilterProps {
  positions: { value: string; label: string }[];
  active: string | null;
  onChange: (position: string | null) => void;
}

export function PlayerFilter({ positions, active, onChange }: PlayerFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
          active === null
            ? 'bg-green-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        Todas
      </button>
      {positions.map((pos) => (
        <button
          key={pos.value}
          onClick={() => onChange(pos.value === active ? null : pos.value)}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            active === pos.value
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {pos.label}
        </button>
      ))}
    </div>
  );
}
