import { useEffect, useState, useRef } from 'react';
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

  // Form state
  const [formMatchDay, setFormMatchDay] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formOpponent, setFormOpponent] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formScoreHome, setFormScoreHome] = useState('');
  const [formScoreAway, setFormScoreAway] = useState('');

  useEffect(() => {
    fetchFixtures(teamId);
  }, [teamId, fetchFixtures]);

  // Keep viewMode in sync when fixtureImage loads
  useEffect(() => {
    if (fixtureImage && viewMode === 'table') {
      setViewMode('image');
    }
  }, [fixtureImage]);

  const resetForm = () => {
    setFormMatchDay('');
    setFormDate('');
    setFormOpponent('');
    setFormLocation('');
    setFormScoreHome('');
    setFormScoreAway('');
    setIsAdding(false);
    setEditingId(null);
  };

  const startEdit = (entry: FixtureEntry) => {
    setFormMatchDay(entry.matchDay?.toString() ?? '');
    setFormDate(entry.date ?? '');
    setFormOpponent(entry.opponent);
    setFormLocation(entry.location ?? '');
    setFormScoreHome(entry.scoreHome?.toString() ?? '');
    setFormScoreAway(entry.scoreAway?.toString() ?? '');
    setEditingId(entry.id);
    setIsAdding(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formOpponent.trim()) return;

    const data = {
      matchDay: formMatchDay ? parseInt(formMatchDay, 10) : null,
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
    if (dayA !== dayB) return dayA - dayB;
    if (a.date && b.date) return a.date.localeCompare(b.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* View mode toggle */}
      <div className="flex items-center gap-3">
        {fixtureImage && (
          <button
            onClick={() => setViewMode(viewMode === 'image' ? 'table' : 'image')}
            className="text-sm text-blue-600 hover:underline"
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
            <label className="px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
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

          {/* Manual entries */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Partidos del campeonato</h3>
            {!isAdding && (
              <button
                onClick={() => {
                  resetForm();
                  setIsAdding(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Agregar partido
              </button>
            )}
          </div>

          {/* Add/Edit form */}
          {isAdding && (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Jornada</label>
                  <input
                    type="number"
                    min={1}
                    value={formMatchDay}
                    onChange={(e) => setFormMatchDay(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    placeholder="Ej: 1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Localía</label>
                  <select
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="LOCAL">Local</option>
                    <option value="VISITANTE">Visitante</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Rival *</label>
                <input
                  type="text"
                  value={formOpponent}
                  onChange={(e) => setFormOpponent(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                  placeholder="Nombre del equipo"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Goles a favor</label>
                  <input
                    type="number"
                    min={0}
                    value={formScoreHome}
                    onChange={(e) => setFormScoreHome(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Goles en contra</label>
                  <input
                    type="number"
                    min={0}
                    value={formScoreAway}
                    onChange={(e) => setFormScoreAway(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={!formOpponent.trim()}
                  className="px-4 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {editingId ? 'Guardar cambios' : 'Agregar partido'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}

          {/* Entries table */}
          {sortedEntries.length > 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                    <th className="px-3 py-2 font-medium">#</th>
                    <th className="px-3 py-2 font-medium">Fecha</th>
                    <th className="px-3 py-2 font-medium">Rival</th>
                    <th className="px-3 py-2 font-medium">Localía</th>
                    <th className="px-3 py-2 font-medium text-center">Resultado</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2.5 text-gray-500 font-mono">
                        {entry.matchDay ?? '-'}
                      </td>
                      <td className="px-3 py-2.5 text-gray-700">
                        {entry.date
                          ? new Date(entry.date + 'T12:00:00').toLocaleDateString('es-AR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : '-'}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">
                        {entry.opponent}
                      </td>
                      <td className="px-3 py-2.5 text-gray-600">
                        {entry.location ? LOCATION_LABELS[entry.location] ?? entry.location : '-'}
                      </td>
                      <td className="px-3 py-2.5 text-center font-mono font-medium">
                        {entry.scoreHome != null && entry.scoreAway != null ? (
                          <span className={entry.scoreHome > entry.scoreAway ? 'text-green-600' : entry.scoreHome < entry.scoreAway ? 'text-red-600' : 'text-gray-600'}>
                            {entry.scoreHome} - {entry.scoreAway}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => startEdit(entry)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setDeletingEntry(entry)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !fixtureImage ? (
            <div className="text-center py-8 text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No hay partidos cargados</p>
            </div>
          ) : null}
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
