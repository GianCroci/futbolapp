import { Shield, Swords, Settings2, Goal, LucideIcon } from 'lucide-react';

interface PlayerFilterProps {
  active: string | null;
  onChange: (category: string | null) => void;
}

const CATEGORIES: { value: string; label: string; icon: LucideIcon }[] = [
  { value: 'ARQUERO', label: 'Arquero', icon: Shield },
  { value: 'DEFENSOR', label: 'Defensores', icon: Swords },
  { value: 'MEDIOCAMPO', label: 'Mediocampo', icon: Settings2 },
  { value: 'DELANTERO', label: 'Delanteros', icon: Goal },
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
      {CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        return (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value === active ? null : cat.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-colors ${
              active === cat.value
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Icon className="w-4 h-4" /> {cat.label}
          </button>
        );
      })}
    </div>
  );
}
