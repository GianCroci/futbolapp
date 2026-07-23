import { FORMATION_PRESET_OPTIONS } from '../../../utils/formationPresets';

interface FormationToolbarProps {
  name: string;
  onNameChange: (name: string) => void;
  selectedFormation: string | null;
  onFormationChange: (formationType: string | null) => void;
  onSave: () => void;
  onClear: () => void;
  isSaving: boolean;
  isEditing: boolean;
  playerCount: number;
}

export function FormationToolbar({
  name,
  onNameChange,
  selectedFormation,
  onFormationChange,
  onSave,
  onClear,
  isSaving,
  isEditing,
  playerCount,
}: FormationToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-gray-200">
      <div className="flex items-center gap-4 flex-1">
        <input
          type="text"
          placeholder="Nombre de la formación (ej: Titulares vs River)"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none flex-1 max-w-sm"
        />

        <select
          value={selectedFormation || ''}
          onChange={(e) => onFormationChange(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
        >
          <option value="">Personalizado</option>
          {FORMATION_PRESET_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <span className="text-sm text-gray-500">
          {playerCount}/11 jugadores
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onClear}
          className="px-3 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Limpiar
        </button>
        <button
          onClick={onSave}
          disabled={isSaving || !name.trim() || playerCount === 0}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isSaving ? 'Guardando...' : isEditing ? 'Actualizar' : 'Guardar'}
        </button>
      </div>
    </div>
  );
}
