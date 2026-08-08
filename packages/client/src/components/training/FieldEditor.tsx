import { useState, useRef, useCallback, useEffect } from 'react';
import { FieldItem, FieldItemType, FieldDiagram } from '../../types';
import { FieldCanvas } from './FieldCanvas';
import { FieldToolbox } from './FieldToolbox';
import { clientToViewBox } from './svgCoords';

interface FieldEditorProps {
  diagram: FieldDiagram;
  onChange: (diagram: FieldDiagram) => void;
  disabled?: boolean;
}

type EditorMode =
  | { type: 'idle' }
  | { type: 'dragItem'; id: string; offsetX: number; offsetY: number }
  | { type: 'rotateItem'; id: string }
  | { type: 'scaleItem'; id: string; startScale: number; startDist: number }
  | { type: 'resizeArrow'; id: string }
  | { type: 'placeArrow'; startX: number; startY: number; currentX: number; currentY: number };

export function FieldEditor({ diagram, onChange, disabled }: FieldEditorProps) {
  const [activeTool, setActiveTool] = useState<FieldItemType | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<EditorMode>({ type: 'idle' });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const historyRef = useRef<FieldDiagram[]>([]);

  const pushHistory = useCallback((d: FieldDiagram) => {
    historyRef.current.push(JSON.parse(JSON.stringify(d)));
    // Keep max 20 undo steps
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
    }
  }, []);

  /** Update a single item in the diagram */
  const updateItem = useCallback((id: string, patch: Partial<FieldItem>) => {
    const newItems = diagram.items.map(item =>
      item.id === id ? { ...item, ...patch } : item
    );
    onChange({ ...diagram, items: newItems });
  }, [diagram, onChange]);

  const clampCoord = (v: number) => Math.max(0, Math.min(100, v));

  const handlePlaceItem = useCallback((type: FieldItemType, x: number, y: number) => {
    if (disabled) return;
    const newItem: FieldItem = {
      id: crypto.randomUUID(),
      type,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      rotation: 0,
      ...(type === 'player' ? { label: String(diagram.items.filter(i => i.type === 'player').length + 1) } : {}),
    };
    const newDiagram = { ...diagram, items: [...diagram.items, newItem] };
    pushHistory(diagram);
    onChange(newDiagram);
    setSelectedId(newItem.id);
    setActiveTool(null);
  }, [diagram, onChange, pushHistory, disabled]);

  const handleSelectItem = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const handleStartDrag = useCallback((id: string, clientX: number, clientY: number) => {
    if (disabled) return;
    const svg = svgRef.current;
    if (!svg) return;
    const item = diagram.items.find(i => i.id === id);
    if (!item) return;
    const { x: svgX, y: svgY } = clientToViewBox(svg, clientX, clientY);
    pushHistory(diagram);
    setMode({ type: 'dragItem', id, offsetX: svgX - item.x, offsetY: svgY - item.y });
  }, [diagram.items, disabled, pushHistory, diagram]);

  /** Interaction start on a selection handle (rotate / scale / arrow tip) */
  const handleHandleStart = useCallback((handle: 'rotate' | 'scale' | 'arrowTip', id: string) => {
    if (disabled) return;
    pushHistory(diagram);
    if (handle === 'rotate') {
      setMode({ type: 'rotateItem', id });
    } else if (handle === 'scale') {
      const item = diagram.items.find(i => i.id === id);
      if (!item) return;
      // Green handle rests at (x+5, y+5) from the item center.
      // Scale RELATIVE to the grab point so the item does not jump on grab.
      const startDist = Math.hypot(5, 5);
      const startScale = item.scale ?? 1;
      setMode({ type: 'scaleItem', id, startScale, startDist });
    } else {
      setMode({ type: 'resizeArrow', id });
    }
  }, [disabled, pushHistory, diagram]);

  const handleCanvasMouseDown = useCallback((clientX: number, clientY: number) => {
    // No active tool, no item click — just clear selection
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const { x, y } = clientToViewBox(svgRef.current, e.clientX, e.clientY);

    switch (mode.type) {
      case 'dragItem': {
        const item = diagram.items.find(i => i.id === mode.id);
        if (!item) return;
        const newX = Math.round(clampCoord(x - mode.offsetX) * 10) / 10;
        const newY = Math.round(clampCoord(y - mode.offsetY) * 10) / 10;
        updateItem(mode.id, { x: newX, y: newY });
        return;
      }
      case 'rotateItem': {
        const item = diagram.items.find(i => i.id === mode.id);
        if (!item) return;
        const angle = Math.atan2(y - item.y, x - item.x) * (180 / Math.PI) + 90;
        updateItem(mode.id, { rotation: Math.round(angle) });
        return;
      }
      case 'scaleItem': {
        const item = diagram.items.find(i => i.id === mode.id);
        if (!item) return;
        const dist = Math.hypot(x - item.x, y - item.y);
        // Relative to the grab distance — no jump on grab, smooth in/out.
        const scale = Math.max(0.4, Math.min(3, mode.startScale * (dist / mode.startDist)));
        updateItem(mode.id, { scale: Math.round(scale * 10) / 10 });
        return;
      }
      case 'resizeArrow': {
        const item = diagram.items.find(i => i.id === mode.id);
        if (!item) return;
        const dist = Math.hypot(x - item.x, y - item.y);
        const angle = Math.atan2(y - item.y, x - item.x) * (180 / Math.PI) + 90;
        const length = Math.max(3, Math.min(60, dist * 2));
        updateItem(mode.id, {
          rotation: Math.round(angle),
          length: Math.round(length * 10) / 10,
        });
        return;
      }
      case 'placeArrow': {
        setMode({ ...mode, currentX: Math.max(0, Math.min(100, x)), currentY: Math.max(0, Math.min(100, y)) });
        return;
      }
      default:
        return;
    }
  }, [mode, diagram, updateItem]);

  const handleMouseUp = useCallback(() => {
    switch (mode.type) {
      case 'placeArrow': {
        const dx = mode.currentX - mode.startX;
        const dy = mode.currentY - mode.startY;
        const dist = Math.hypot(dx, dy);

        const rotation = dist > 1 ? Math.round(Math.atan2(dy, dx) * (180 / Math.PI) + 90) : 0;
        const length = dist > 1 ? Math.round(Math.max(3, Math.min(60, dist * 2)) * 10) / 10 : 10;

        const newItem: FieldItem = {
          id: crypto.randomUUID(),
          type: 'arrow',
          x: Math.round(mode.startX * 10) / 10,
          y: Math.round(mode.startY * 10) / 10,
          rotation,
          length,
        };
        pushHistory(diagram);
        onChange({ ...diagram, items: [...diagram.items, newItem] });
        setSelectedId(newItem.id);
        setActiveTool(null);
        setMode({ type: 'idle' });
        return;
      }
      case 'dragItem':
      case 'rotateItem':
      case 'scaleItem':
      case 'resizeArrow':
        setMode({ type: 'idle' });
        return;
      default:
        return;
    }
  }, [mode, diagram, onChange, pushHistory]);

  const handleDeleteSelected = useCallback(() => {
    if (disabled || !selectedId) return;
    pushHistory(diagram);
    const newDiagram = { ...diagram, items: diagram.items.filter(i => i.id !== selectedId) };
    onChange(newDiagram);
    setSelectedId(null);
  }, [disabled, selectedId, diagram, onChange, pushHistory]);

  const handleUndo = useCallback(() => {
    const prev = historyRef.current.pop();
    if (prev) {
      onChange(prev);
      setSelectedId(null);
    }
  }, [onChange]);

  const handleClearAll = useCallback(() => {
    if (disabled || diagram.items.length === 0) return;
    pushHistory(diagram);
    onChange({ items: [] });
    setSelectedId(null);
  }, [disabled, diagram, onChange, pushHistory]);

  const handleUpdateLabel = useCallback((label: string) => {
    if (disabled || !selectedId) return;
    const newItems = diagram.items.map(item =>
      item.id === selectedId ? { ...item, label } : item
    );
    onChange({ ...diagram, items: newItems });
  }, [disabled, selectedId, diagram, onChange]);

  const handleArrowDragStart = useCallback((x: number, y: number) => {
    if (disabled) return;
    setMode({ type: 'placeArrow', startX: x, startY: y, currentX: x, currentY: y });
  }, [disabled]);

  // Keyboard listener for Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        handleDeleteSelected();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected]);

  return (
    <div className="space-y-3" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Toolbar */}
      <FieldToolbox
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onUpdateLabel={handleUpdateLabel}
        selectedItem={diagram.items.find(i => i.id === selectedId) || null}
        disabled={disabled}
      />

      {/* Canvas */}
      <FieldCanvas
        items={diagram.items}
        selectedId={selectedId}
        activeTool={activeTool}
        onPlaceItem={handlePlaceItem}
        onSelectItem={handleSelectItem}
        onStartDrag={handleStartDrag}
        onCanvasMouseDown={handleCanvasMouseDown}
        onArrowDragStart={handleArrowDragStart}
        onHandleStart={handleHandleStart}
        placementDrag={mode.type === 'placeArrow' ? mode : null}
        svgRef={svgRef}
      />

      {/* Actions bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={historyRef.current.length === 0 || disabled}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Deshacer
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={diagram.items.length === 0 || disabled}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Limpiar
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {diagram.items.length} elemento{diagram.items.length !== 1 ? 's' : ''}
          </span>
          {selectedId && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              className="px-3 py-1.5 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
            >
              Eliminar seleccionado
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
