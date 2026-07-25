interface PlayerFilterProps {
  active: string | null;
  onChange: (category: string | null) => void;
}

const CATEGORIES: { value: string; label: string; icon: string }[] = [
  { value: 'ARQUERO', label: 'Arquero', icon: '🧤' },
  { value: 'DEFENSOR', label: 'Defensores', icon: '🛡️' },
  { value: 'MEDIOCAMPO', label: 'Mediocampo', icon: '⚙️' },
  { value: 'DELANTERO', label: 'Delanteros', icon: '🥅' },
];

export function PlayerFilter({ active, onChange }: PlayerFilterProps) {
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
        Todos
      </button>
      {CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value === active ? null : cat.value)}
          className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
            active === cat.value
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {cat.icon} {cat.label}
        </button>
      ))}
    </div>
  );
}
