import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronUp, Pencil, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTrainingStore } from '../store/trainingStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { TrainingStage, FieldDiagram } from '../types';
import { FieldEditor } from '../components/training/FieldEditor';
import { TemplateModal } from '../components/training/TemplateModal';

export function TrainingSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    currentSession,
    isLoading,
    fetchSession,
    updateSession,
    addStage,
    updateStage,
    deleteStage,
    reorderStages,
  } = useTrainingStore();

  // Local state for editable fields
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [deletingStageId, setDeletingStageId] = useState<string | null>(null);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [newStageName, setNewStageName] = useState('');
  const [diagram, setDiagram] = useState<FieldDiagram>({ items: [] });
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [diagramDirty, setDiagramDirty] = useState(false);
  const [isSavingDiagram, setIsSavingDiagram] = useState(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (id) fetchSession(id);
  }, [id, fetchSession]);

  // Sync local state from the server ONCE on load.
  // Deliberately NOT re-run on every currentSession change: store updates
  // (stage ops, saves) must never clobber unsaved local edits.
  useEffect(() => {
    if (currentSession && !initializedRef.current) {
      setSessionName(currentSession.name);
      setSessionDate(currentSession.date?.split('T')[0] ?? '');
      setGeneralNotes(currentSession.generalNotes ?? '');
      setDiagram(currentSession.diagram ?? { items: [] });
      initializedRef.current = true;
    }
  }, [currentSession]);

  const saveSessionField = useCallback(
    async (data: Record<string, any>) => {
      if (!id) return;
      try {
        await updateSession(id, data);
      } catch {
        // Error handling is done by the store
      }
    },
    [id, updateSession],
  );

  const handleDiagramChange = useCallback((d: FieldDiagram) => {
    setDiagram(d);
    setDiagramDirty(true);
  }, []);

  const handleSaveDiagram = async () => {
    if (!id) return;
    setIsSavingDiagram(true);
    try {
      await updateSession(id, { diagram });
      setDiagramDirty(false);
    } catch {
      // Error handling is done by the store
    } finally {
      setIsSavingDiagram(false);
    }
  };

  const handleDeleteStage = async () => {
    if (!id || !deletingStageId) return;
    try {
      await deleteStage(id, deletingStageId);
      setDeletingStageId(null);
    } catch {
      // Error handling is done by the store
    }
  };

  const handleReorder = async (stageId: string, direction: 'up' | 'down') => {
    if (!currentSession?.stages) return;
    const stages = [...currentSession.stages].sort((a, b) => a.order - b.order);
    const idx = stages.findIndex((s) => s.id === stageId);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= stages.length) return;

    // Swap positions
    [stages[idx], stages[newIdx]] = [stages[newIdx], stages[idx]];
    const newOrder = stages.map((s) => s.id);
    await reorderStages(id!, newOrder);
  };

  const handleAddStage = async () => {
    if (!id || !newStageName.trim()) return;
    const nextOrder = (currentSession?.stages?.length ?? 0) + 1;
    try {
      await addStage(id, { name: newStageName.trim(), order: nextOrder });
      setNewStageName('');
      setIsAddingStage(false);
    } catch {
      // Error handling is done by the store
    }
  };

  const handleStageFieldSave = async (stageId: string, data: Record<string, any>) => {
    if (!id) return;
    try {
      await updateStage(id, stageId, data);
    } catch {
      // Error handling is done by the store
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!currentSession) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <p className="text-gray-500">Sesión no encontrada</p>
          <button
            onClick={() => navigate('/entrenamientos')}
            className="text-green-600 hover:underline mt-2"
          >
            Volver
          </button>
        </div>
      </AppLayout>
    );
  }

  const sortedStages = [...(currentSession.stages ?? [])].sort(
    (a, b) => a.order - b.order,
  );

  return (
    <AppLayout>
      <div className="max-w-3xl space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/entrenamientos')}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver a entrenamientos
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              onBlur={() => saveSessionField({ name: sessionName })}
              className="text-xl font-bold text-gray-800 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none flex-1"
            />
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              onBlur={() => saveSessionField({ date: sessionDate })}
              className="text-sm text-gray-500 bg-transparent border-b-2 border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas generales
            </label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              onBlur={() => saveSessionField({ generalNotes })}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 outline-none resize-y"
              rows={3}
              placeholder="Objetivos de la sesión, observaciones..."
            />
          </div>
        </div>

        {/* Field Editor */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Diagrama del ejercicio</h3>
            <div className="flex items-center gap-2">
              {diagramDirty && (
                <span className="text-xs text-amber-600 font-medium">
                  Cambios sin guardar
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowTemplateModal(true)}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Plantillas
              </button>
              <button
                type="button"
                onClick={handleSaveDiagram}
                disabled={!diagramDirty || isSavingDiagram}
                className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDiagram ? 'Guardando...' : 'Guardar diagrama'}
              </button>
            </div>
          </div>

          <FieldEditor
            diagram={diagram}
            onChange={handleDiagramChange}
          />
        </div>

        <TemplateModal
          isOpen={showTemplateModal}
          currentDiagram={diagram}
          onClose={() => setShowTemplateModal(false)}
          onLoadTemplate={handleDiagramChange}
        />

        {/* Stages */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800">Etapas</h2>

          {sortedStages.map((stage, index) => (
            <StageCard
              key={stage.id}
              stage={stage}
              index={index}
              total={sortedStages.length}
              onDelete={() => setDeletingStageId(stage.id)}
              onReorder={(dir) => handleReorder(stage.id, dir)}
              onSave={(data) => handleStageFieldSave(stage.id, data)}
            />
          ))}

          {/* Add stage */}
          {isAddingStage ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                placeholder="Nombre de la etapa"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddStage();
                  if (e.key === 'Escape') {
                    setIsAddingStage(false);
                    setNewStageName('');
                  }
                }}
              />
              <button
                onClick={handleAddStage}
                disabled={!newStageName.trim()}
                className="px-3 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setIsAddingStage(false);
                  setNewStageName('');
                }}
                className="px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingStage(true)}
              className="w-full py-3 text-sm text-green-600 border-2 border-dashed border-green-300 rounded-xl hover:bg-green-50 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Agregar etapa
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!deletingStageId}
        onClose={() => setDeletingStageId(null)}
        onConfirm={handleDeleteStage}
        title="Eliminar etapa"
        message="¿Estás seguro de eliminar esta etapa?"
        confirmLabel="Eliminar"
      />
    </AppLayout>
  );
}

/* ── StageCard Component ── */

interface StageCardProps {
  stage: TrainingStage;
  index: number;
  total: number;
  onDelete: () => void;
  onReorder: (dir: 'up' | 'down') => void;
  onSave: (data: Record<string, any>) => void;
}

function StageCard({ stage, index, total, onDelete, onReorder, onSave }: StageCardProps) {
  const [name, setName] = useState(stage.name);
  const [notes, setNotes] = useState(stage.notes ?? '');
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  useEffect(() => {
    setName(stage.name);
    setNotes(stage.notes ?? '');
  }, [stage.name, stage.notes]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        {/* Reorder buttons */}
        <div className="flex flex-col items-center gap-0.5 pt-1">
          <button
            onClick={() => onReorder('up')}
            disabled={index === 0}
            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-gray-400 font-mono">{index + 1}</span>
          <button
            onClick={() => onReorder('down')}
            disabled={index === total - 1}
            className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => onSave({ name })}
            className="w-full font-medium text-gray-800 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none text-sm"
          />

          {isNotesOpen && (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => onSave({ notes })}
              className="w-full mt-2 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-2 focus:ring-green-500 outline-none resize-y"
              rows={2}
              placeholder="Comentarios para esta etapa..."
              autoFocus
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {!isNotesOpen && stage.notes && (
            <span className="text-xs text-gray-400 italic">notas</span>
          )}
          <button
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title={isNotesOpen ? 'Cerrar notas' : 'Notas'}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Eliminar etapa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
