import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronLeft, ChevronUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { useTrainingStore } from '../store/trainingStore';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import type { TrainingStage, FieldDiagram, NamedDiagram } from '../types';
import { FieldEditor } from '../components/training/FieldEditor';
import { TemplateModal } from '../components/training/TemplateModal';
import {
  normalizeDiagrams,
  uniqueName,
  markDirty,
  anyDirty,
  resetDirty,
  pruneDirty,
} from '../utils/diagramUtils';

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
  const [diagrams, setDiagrams] = useState<NamedDiagram[]>([]);
  const [activeDiagramId, setActiveDiagramId] = useState<string | null>(null);
  const [dirtyMap, setDirtyMap] = useState<Record<string, boolean>>({});
  const [structureDirty, setStructureDirty] = useState(false);
  const [deletingDiagramId, setDeletingDiagramId] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [isSavingDiagram, setIsSavingDiagram] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
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
      // A session that never persisted a diagram list (new/legacy rows) gets
      // one blank starter diagram; an explicitly persisted empty list
      // ({ diagrams: [] }) stays empty, so deleting the last diagram persists.
      const raw = currentSession.diagram;
      const normalized = normalizeDiagrams(raw);
      const hasExplicitDiagramList =
        typeof raw === 'object' &&
        raw !== null &&
        !Array.isArray(raw) &&
        Array.isArray((raw as Record<string, unknown>).diagrams);
      const initial =
        hasExplicitDiagramList || normalized.length > 0
          ? normalized
          : [{ id: crypto.randomUUID(), name: 'Diagrama 1', items: [] }];
      setDiagrams(initial);
      setActiveDiagramId(initial.length > 0 ? initial[0].id : null);
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

  const activeDiagram = diagrams.find((d) => d.id === activeDiagramId) ?? null;

  /** FieldEditor merges its whole items array into the active diagram. */
  const handleDiagramChange = useCallback(
    (d: FieldDiagram) => {
      if (!activeDiagramId) return;
      setDiagrams((prev) =>
        prev.map((dg) => (dg.id === activeDiagramId ? { ...dg, items: d.items } : dg)),
      );
      setDirtyMap((m) => markDirty(m, activeDiagramId));
    },
    [activeDiagramId],
  );

  const handleSaveDiagram = async () => {
    if (!id) return;
    setIsSavingDiagram(true);
    setSaveError(null);
    const ok = await updateSession(id, { diagram: { diagrams } });
    if (ok) {
      setDirtyMap(resetDirty());
      setStructureDirty(false);
    } else {
      setSaveError('No se pudo guardar el diagrama. Verificá tu conexión e intentá de nuevo.');
    }
    setIsSavingDiagram(false);
  };

  const handleAddDiagram = useCallback(() => {
    const names = new Set(diagrams.map((d) => d.name));
    const diagram: NamedDiagram = {
      id: crypto.randomUUID(),
      name: uniqueName('Diagrama 1', names),
      items: [],
    };
    setDiagrams([...diagrams, diagram]);
    setActiveDiagramId(diagram.id);
    setDirtyMap((m) => markDirty(m, diagram.id));
  }, [diagrams]);

  /** Preset import appends a new diagram — existing diagrams are never overwritten. */
  const handleAddTemplate = useCallback(
    (d: FieldDiagram) => {
      const names = new Set(diagrams.map((dg) => dg.name));
      const diagram: NamedDiagram = {
        id: crypto.randomUUID(),
        name: uniqueName('Diagrama 1', names),
        items: d.items,
      };
      setDiagrams([...diagrams, diagram]);
      setActiveDiagramId(diagram.id);
      setDirtyMap((m) => markDirty(m, diagram.id));
    },
    [diagrams],
  );

  /** Rename commits on blur; colliding names are auto-suffixed so uniqueness holds. */
  const handleRenameDiagram = useCallback(
    (diagramId: string, candidate: string) => {
      const trimmed = candidate.trim();
      if (!trimmed) return;
      const others = new Set(diagrams.filter((d) => d.id !== diagramId).map((d) => d.name));
      const finalName = uniqueName(trimmed, others);
      const current = diagrams.find((d) => d.id === diagramId);
      if (!current || finalName === current.name) return;
      setDiagrams(diagrams.map((d) => (d.id === diagramId ? { ...d, name: finalName } : d)));
      setDirtyMap((m) => markDirty(m, diagramId));
    },
    [diagrams],
  );

  const handleMoveDiagram = useCallback(
    (diagramId: string, direction: 'up' | 'down') => {
      const idx = diagrams.findIndex((d) => d.id === diagramId);
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (idx === -1 || newIdx < 0 || newIdx >= diagrams.length) return;
      const next = [...diagrams];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      setDiagrams(next);
      setDirtyMap((m) => markDirty(m, diagramId));
    },
    [diagrams],
  );

  /**
   * Deleting a diagram persists immediately (unlike other diagram changes,
   * which are saved with the explicit "Guardar diagrama" button). The local
   * state updates optimistically; if the PUT fails the deletion stays visible
   * in the UI, a save-error banner is shown, and structureDirty keeps the
   * manual save button enabled for a retry.
   */
  const confirmDeleteDiagram = useCallback(async () => {
    if (!deletingDiagramId) return;
    const next = diagrams.filter((d) => d.id !== deletingDiagramId);
    setDiagrams(next);
    setDirtyMap(pruneDirty(dirtyMap, next.map((d) => d.id)));
    if (activeDiagramId === deletingDiagramId) {
      setActiveDiagramId(next.length > 0 ? next[0].id : null);
    }
    setDeletingDiagramId(null);
    if (!id) return;
    setIsSavingDiagram(true);
    setSaveError(null);
    const ok = await updateSession(id, { diagram: { diagrams: next } });
    if (ok) {
      setStructureDirty(false);
    } else {
      setStructureDirty(true);
      setSaveError('No se pudo guardar el diagrama. Verificá tu conexión e intentá de nuevo.');
    }
    setIsSavingDiagram(false);
  }, [deletingDiagramId, diagrams, activeDiagramId, dirtyMap, id, updateSession]);

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
            <h3 className="text-lg font-semibold text-gray-900">Diagramas del ejercicio</h3>
            <div className="flex items-center gap-2">
              {(anyDirty(dirtyMap) || structureDirty) && (
                <span className="text-xs text-amber-600 font-medium">
                  Cambios sin guardar
                </span>
              )}
              <button
                type="button"
                onClick={handleAddDiagram}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar diagrama
              </button>
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
                disabled={(!anyDirty(dirtyMap) && !structureDirty) || isSavingDiagram}
                className="px-3 py-1.5 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSavingDiagram ? 'Guardando...' : 'Guardar diagrama'}
              </button>
            </div>
          </div>

          {saveError && (
            <div
              role="alert"
              className="mb-4 flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              <span>{saveError}</span>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                aria-label="Descartar error de guardado"
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Diagram selector */}
          {diagrams.length > 0 ? (
            <div className="flex flex-wrap gap-2 mb-4">
              {diagrams.map((diagram, index) => (
                <DiagramChip
                  key={diagram.id}
                  diagram={diagram}
                  index={index}
                  total={diagrams.length}
                  active={diagram.id === activeDiagramId}
                  dirty={!!dirtyMap[diagram.id]}
                  onSelect={() => setActiveDiagramId(diagram.id)}
                  onRename={(name) => handleRenameDiagram(diagram.id, name)}
                  onDelete={() => setDeletingDiagramId(diagram.id)}
                  onMove={(dir) => handleMoveDiagram(diagram.id, dir)}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 mb-4">Sin diagramas. Agregá uno para empezar.</p>
          )}

          {activeDiagram ? (
            <FieldEditor
              key={activeDiagram.id}
              diagram={activeDiagram}
              onChange={handleDiagramChange}
            />
          ) : (
            <p className="text-sm text-gray-500 py-6 text-center">
              Sin diagrama activo. Agregá un diagrama para editar.
            </p>
          )}
        </div>

        <TemplateModal
          isOpen={showTemplateModal}
          currentDiagram={activeDiagram ?? { items: [] }}
          onClose={() => setShowTemplateModal(false)}
          onAddTemplate={handleAddTemplate}
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

      <ConfirmDialog
        isOpen={!!deletingDiagramId}
        onClose={() => setDeletingDiagramId(null)}
        onConfirm={confirmDeleteDiagram}
        title="Eliminar diagrama"
        message="¿Estás seguro de eliminar este diagrama?"
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

/* ── DiagramChip Component ── */

interface DiagramChipProps {
  diagram: NamedDiagram;
  index: number;
  total: number;
  active: boolean;
  dirty: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function DiagramChip({
  diagram,
  index,
  total,
  active,
  dirty,
  onSelect,
  onRename,
  onDelete,
  onMove,
}: DiagramChipProps) {
  const [name, setName] = useState(diagram.name);

  useEffect(() => {
    setName(diagram.name);
  }, [diagram.name]);

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-sm cursor-pointer transition-colors ${
        active
          ? 'border-green-500 bg-green-50 text-green-800'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      {/* Reorder */}
      <div className="flex flex-col -my-0.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('up');
          }}
          disabled={index === 0}
          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mover arriba"
        >
          <ChevronUp className="w-3 h-3" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMove('down');
          }}
          disabled={index === total - 1}
          className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          title="Mover abajo"
        >
          <ChevronDown className="w-3 h-3" />
        </button>
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => onRename(name)}
        onFocus={(e) => e.target.select()}
        className={`w-28 bg-transparent text-sm font-medium focus:outline-none ${
          active ? 'text-green-800' : 'text-gray-700'
        }`}
      />

      {dirty && <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Cambios sin guardar" />}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-0.5 text-gray-400 hover:text-red-600 rounded"
        title="Eliminar diagrama"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
