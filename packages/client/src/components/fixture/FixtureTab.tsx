import { useEffect, useState, useRef, useMemo } from 'react';
import { Check, Pencil, Plus, Repeat, Trash2, X } from 'lucide-react';
import { useFixtureStore } from '../../store/fixtureStore';
import { FixtureEntry } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ConfirmDialog } from '../common/ConfirmDialog';

interface FixtureTabProps {
  teamId: string;
}

const LOCATION_LABELS: Record<string, string> = {
  LOCAL: 'Local',
  VISITANTE: 'Visitante',
  NEUTRAL: 'Neutral',
};

export function FixtureTab({ teamId }: FixtureTabProps) {
  const { entries, fixtureImage, isLoading, fetchFixtures, createEntry, updateEntry, deleteEntry, updateImage } =
    useFixtureStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [viewMode, setViewMode] = useState<'image' | 'table'>(
    fixtureImage ? 'image' : 'table',
  );
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingEntry, setDeletingEntry] = useState<FixtureEntry | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isMirroring, setIsMirroring] = useState(false);

  // Form state — simplified
  const [formOpponent, setFormOpponent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formScoreHome, setFormScoreHome] = useState('');
  const [formScoreAway, setFormScoreAway] = useState('');

  useEffect(() => {
    fetchFixtures(teamId);
  }, [teamId, fetchFixtures]);

  useEffect(() => {
    if (fixtureImage && viewMode === 'table') {
      setViewMode('image');
    }
  }, [fixtureImage]);

  const maxMatchDay = useMemo(
    () => Math.max(0, ...entries.map((e) => e.matchDay ?? 0)),
    [entries],
  );

  const resetForm = () => {
    setFormOpponent('');
    setFormDate('');
    setFormLocation('');
    setFormScoreHome('');
    setFormScoreAway('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (entry: FixtureEntry) => {
    setFormOpponent(entry.opponent);
    setFormDate(entry.date ?? '');
    setFormLocation(entry.location ?? '');
    setFormScoreHome(entry.scoreHome?.toString() ?? '');
    setFormScoreAway(entry.scoreAway?.toString() ?? '');
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOpponent.trim()) return;

    const existing = editingId ? entries.find((en) => en.id === editingId) : null;

    const data = {
      matchDay: existing ? existing.matchDay : maxMatchDay + 1,
      date: formDate || null,
      opponent: formOpponent.trim(),
      location: formLocation || null,
      scoreHome: formScoreHome ? parseInt(formScoreHome, 10) : null,
      scoreAway: formScoreAway ? parseInt(formScoreAway, 10) : null,
    };

    try {
      if (editingId) {
        await updateEntry(teamId, editingId, data);
      } else {
        await createEntry(teamId, data);
      }
      resetForm();
    } catch (err) {
      console.error('Error saving fixture entry:', err);
    }
  };

  const handleMirror = async () => {
    if (entries.length === 0) return;
    setIsMirroring(true);
    try {
      const mirrored = entries.map((e) => ({
        matchDay: (e.matchDay ?? maxMatchDay) + maxMatchDay,
        date: null as string | null,
        opponent: e.opponent,
        location: e.location === 'LOCAL' ? 'VISITANTE' : e.location === 'VISITANTE' ? 'LOCAL' : e.location,
        scoreHome: null as number | null,
        scoreAway: null as number | null,
      }));
      for (const m of mirrored) {
        await createEntry(teamId, m);
      }
      await fetchFixtures(teamId);
    } catch (err) {
      console.error('Error mirroring fixture:', err);
    } finally {
      setIsMirroring(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;
    try {
      await deleteEntry(teamId, deletingEntry.id);
      setDeletingEntry(null);
    } catch (err) {
      console.error('Error deleting fixture entry:', err);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        await updateImage(teamId, base64);
        setViewMode('image');
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error uploading image:', err);
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    await updateImage(teamId, null);
    setViewMode('table');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const sortedEntries = [...entries].sort((a, b) => {
    const dayA = a.matchDay ?? Infinity;
    const dayB = b.matchDay ?? Infinity;
    return dayA - dayB;
  });

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center gap-3">
        {fixtureImage && (
          <button
            onClick={() => setViewMode(viewMode === 'image' ? 'table' : 'image')}
            className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
          >
            {viewMode === 'image' ? 'Ver como tabla' : 'Ver imagen'}
          </button>
        )}
      </div>

      {/* Image view */}
      {viewMode === 'image' && fixtureImage && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-gray-200 p-2 overflow-hidden">
            <img
              src={fixtureImage}
              alt="Fixture del campeonato"
              className="w-full h-auto rounded-lg"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
              {isUploading ? 'Subiendo...' : 'Cambiar imagen'}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
            <button
              onClick={handleRemoveImage}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
            >
              Eliminar imagen
            </button>
          </div>
        </div>
      )}

      {/* Table view */}
      {(viewMode === 'table' || !fixtureImage) && (
        <div className="space-y-4">
          {/* Image upload prompt (when no image) */}
          {!fixtureImage && (
            <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-6 text-center">
              <p className="text-sm text-gray-500 mb-3">
                Subí una imagen del fixture del campeonato
              </p>
              <label className="inline-block px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer transition-colors">
                {isUploading ? 'Subiendo...' : 'Subir imagen'}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}

          {/* Header + actions */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold text-gray-700">
              Partidos del campeonato
            </h3>
            <div className="flex items-center gap-2">
              {sortedEntries.length > 0 && (
                <button
                  onClick={handleMirror}
                  disabled={isMirroring}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <Repeat className="w-4 h-4" />
                  {isMirroring ? 'Espejando...' : 'Espejar fixture'}
                </button>
              )}
              {!isAdding && (
                <button
                  onClick={() => {
                    resetForm();
                    setIsAdding(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Agregar fecha
                </button>
              )}
            </div>
          </div>

          {/* Entries table + inline form */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200">
              <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                  <th className="px-3 py-2 font-medium w-16">Fecha</th>
                  <th className="px-3 py-2 font-medium">Rival</th>
                  <th className="px-3 py-2 font-medium w-24">Localía</th>
                  <th className="px-3 py-2 font-medium w-32">Fecha</th>
                  <th className="px-3 py-2 font-medium text-center w-20">Resultado</th>
                  <th className="px-3 py-2 font-medium w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {/* Inline add/edit row */}
                {isAdding && (
                  <tr className="bg-green-50/50">
                    <td className="px-2 sm:px-3 py-2 text-gray-500 font-mono text-sm font-medium whitespace-nowrap">
                      {editingId ? '' : `Fecha ${maxMatchDay + 1}`}
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <input
                        type="text"
                        value={formOpponent}
                        onChange={(e) => setFormOpponent(e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                        placeholder="Rival *"
                        autoFocus
                      />
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <select
                        value={formLocation}
                        onChange={(e) => setFormLocation(e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded-lg px-1.5 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors bg-white"
                      >
                        <option value="">-</option>
                        <option value="LOCAL">Local</option>
                        <option value="VISITANTE">Visitante</option>
                        <option value="NEUTRAL">Neutral</option>
                      </select>
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <input
                        type="date"
                        value={formDate}
                        onChange={(e) => setFormDate(e.target.value)}
                        className="w-full min-w-0 border border-gray-300 rounded-lg px-1.5 py-1.5 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                      />
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex items-center gap-1 justify-center">
                        <input
                          type="number"
                          min={0}
                          value={formScoreHome}
                          onChange={(e) => setFormScoreHome(e.target.value)}
                          className="w-full min-w-0 border border-gray-300 rounded-lg px-1 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                          placeholder="-"
                        />
                        <span className="text-gray-400 text-xs shrink-0">-</span>
                        <input
                          type="number"
                          min={0}
                          value={formScoreAway}
                          onChange={(e) => setFormScoreAway(e.target.value)}
                          className="w-full min-w-0 border border-gray-300 rounded-lg px-1 py-1.5 text-sm text-center focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition-colors"
                          placeholder="-"
                        />
                      </div>
                    </td>
                    <td className="px-2 sm:px-3 py-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={handleSubmit}
                          disabled={!formOpponent.trim()}
                          className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title={editingId ? 'Guardar cambios' : 'Agregar partido'}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={resetForm}
                          className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Entry rows */}
                {sortedEntries.length > 0 ? (
                  sortedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500 font-mono text-sm">
                        Fecha {entry.matchDay ?? '-'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">
                        {entry.opponent}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-sm">
                        {entry.location ? LOCATION_LABELS[entry.location] ?? entry.location : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600 text-sm">
                        {entry.date
                          ? new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono text-sm font-medium">
                        {entry.scoreHome != null && entry.scoreAway != null ? (
                          <span className={
                            entry.scoreHome > entry.scoreAway
                              ? 'text-green-600'
                              : entry.scoreHome < entry.scoreAway
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }>
                            {entry.scoreHome} - {entry.scoreAway}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingEntry(entry)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-gray-400 text-sm">
                      No hay partidos cargados
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingEntry}
        onClose={() => setDeletingEntry(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar partido"
        message={`¿Estás seguro de eliminar el partido contra ${deletingEntry?.opponent ?? ''}?`}
        confirmLabel="Eliminar"
      />
    </div>
  );
}
