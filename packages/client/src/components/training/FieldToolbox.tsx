import type { LucideIcon } from 'lucide-react';
import { CircleDot, MoveUpRight, Triangle, User } from 'lucide-react';
import { FieldItemType, FieldItem } from '../../types';

interface FieldToolboxProps {
  activeTool: FieldItemType | null;
  onSelectTool: (tool: FieldItemType | null) => void;
  onUpdateLabel?: (label: string) => void;
  selectedItem?: FieldItem | null;
  disabled?: boolean;
}

const TOOLS: { type: FieldItemType; label: string; icon: LucideIcon }[] = [
  { type: 'player', label: 'Jugador', icon: User },
  { type: 'cone', label: 'Cono', icon: Triangle },
  { type: 'ball', label: 'Balón', icon: CircleDot },
  { type: 'arrow', label: 'Flecha', icon: MoveUpRight },
];

export function FieldToolbox({ activeTool, onSelectTool, onUpdateLabel, selectedItem, disabled }: FieldToolboxProps) {
  return (
    <div className="flex gap-2 p-3 bg-white border border-gray-200 rounded-xl">
      {TOOLS.map((tool) => (
        <button
          key={tool.type}
          type="button"
          disabled={disabled}
          onClick={() => {
            if (activeTool === tool.type) {
              onSelectTool(null); // toggle off
            } else {
              onSelectTool(tool.type);
            }
          }}
          className={`
            flex flex-col items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${activeTool === tool.type
              ? 'bg-green-100 text-green-700 ring-2 ring-green-500'
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          title={tool.label}
        >
          <tool.icon className="w-5 h-5" />
          <span>{tool.label}</span>
        </button>
      ))}

      {activeTool && (
        <button
          type="button"
          onClick={() => onSelectTool(null)}
          className="ml-auto px-3 py-2 text-sm text-gray-500 hover:text-gray-700"
        >
          Cancelar
        </button>
      )}

      {selectedItem && (
        <div className="flex items-center gap-4 ml-auto border-l border-gray-200 pl-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500">N°</label>
            <input
              type="text"
              value={selectedItem.label || ''}
              onChange={(e) => onUpdateLabel?.(e.target.value)}
              className="w-10 px-1.5 py-1 text-sm text-center border border-gray-300 rounded"
              maxLength={2}
              placeholder="-"
            />
          </div>
        </div>
      )}
    </div>
  );
}
