import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTrainingStore } from '../store/trainingStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export function TrainingSessionsPage() {
  const { sessions, isLoading, fetchSessions, createSession, deleteSession } = useTrainingStore();
  const navigate = useNavigate();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formNotes, setFormNotes] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const resetForm = () => {
    setFormName('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormNotes('');
    setCreateError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    setIsCreating(true);
    setCreateError(null);
    try {
      const session = await createSession({ name: formName.trim(), date: formDate, generalNotes: formNotes || undefined });
      if (session) {
        setIsCreateOpen(false);
        resetForm();
        navigate(`/entrenamientos/${session.id}`);
      }
    } catch (err: any) {
      setCreateError(err?.response?.data?.error || 'Error al crear la sesión');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await deleteSession(deletingId);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Entrenamientos</h1>
          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nuevo entrenamiento
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<Dumbbell className="w-10 h-10" />}
            title="No hay entrenamientos planificados"
            message="Creá tu primer entrenamiento para empezar a planificar tus sesiones."
          />
        ) : (
          <div className="grid gap-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/entrenamientos/${session.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{session.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{formatDate(session.date)}</p>
                    {session._count && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-xs text-gray-400">
                          {session._count.stages} {session._count.stages === 1 ? 'etapa' : 'etapas'}
                        </span>
                        {session.stages && session.stages.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            {session.stages.map((s) => (
                              <span key={s.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {s.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingId(session.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo entrenamiento">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              placeholder="Ej: Pretemporada semana 1"
              autoFocus
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
            <input
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notas generales</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              rows={3}
              placeholder="Objetivos de la sesión, observaciones..."
            />
          </div>
          {createError && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{createError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !formName.trim()}
              className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {isCreating ? 'Creando...' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Eliminar entrenamiento"
        message="¿Estás seguro de eliminar este entrenamiento? También se eliminarán todas sus etapas."
        confirmLabel="Eliminar"
        isLoading={isDeleting}
      />
    </AppLayout>
  );
}
