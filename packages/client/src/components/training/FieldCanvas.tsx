import { useCallback } from 'react';
import { FieldItem, FieldItemType } from '../../types';
import { FieldItemIcon } from './FieldItemIcon';
import { clientToViewBox } from './svgCoords';

interface FieldCanvasProps {
  items: FieldItem[];
  selectedId: string | null;
  activeTool: FieldItemType | null;
  onPlaceItem: (type: FieldItemType, x: number, y: number) => void;
  onSelectItem: (id: string | null) => void;
  onStartDrag: (id: string, clientX: number, clientY: number) => void;
  onCanvasMouseDown: (clientX: number, clientY: number) => void;
  onArrowDragStart?: (x: number, y: number) => void;
  onHandleStart?: (handle: 'rotate' | 'scale' | 'arrowTip', itemId: string) => void;
  placementDrag?: { startX: number; startY: number; currentX: number; currentY: number } | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

const FIELD_GREEN = '#2e8b57';

export function FieldCanvas({
  items,
  selectedId,
  activeTool,
  onPlaceItem,
  onSelectItem,
  onStartDrag,
  onCanvasMouseDown,
  onArrowDragStart,
  onHandleStart,
  placementDrag,
  svgRef,
}: FieldCanvasProps) {

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const { x, y } = clientToViewBox(svg, e.clientX, e.clientY);

    // 1. Selection handle on the selected item?
    const selectedItem = items.find(i => i.id === selectedId) || null;
    const handle = getHandleAt(selectedItem, x, y);
    if (handle && selectedItem) {
      onHandleStart?.(handle, selectedItem.id);
      return;
    }

    // 2. Existing item body?
    const clickedItem = findItemAt(items, x, y);

    if (clickedItem) {
      onSelectItem(clickedItem.id);
      onStartDrag(clickedItem.id, e.clientX, e.clientY);
      return;
    }

    // If tool is active, place item (or start arrow drag)
    if (activeTool) {
      if (activeTool === 'arrow' && onArrowDragStart) {
        onArrowDragStart(x, y);
      } else {
        onPlaceItem(activeTool, x, y);
      }
      return;
    }

    // Click on empty space → deselect
    onSelectItem(null);
    onCanvasMouseDown(e.clientX, e.clientY);
  }, [items, selectedId, activeTool, onPlaceItem, onSelectItem, onStartDrag, onCanvasMouseDown, onArrowDragStart, onHandleStart, svgRef]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="w-full aspect-[2/3] max-h-[600px] cursor-crosshair"
        onMouseDown={handleMouseDown}
      >
        {/* Field background */}
        <rect x="0" y="0" width="100" height="100" fill={FIELD_GREEN} rx="0.5" />

        {/* Field markings */}
        <g stroke="white" fill="none" opacity={0.8}>
          {/* Outer boundary */}
          <rect x="2" y="2" width="96" height="96" strokeWidth="0.3" rx="0.3" />

          {/* Halfway line */}
          <line x1="50" y1="2" x2="50" y2="98" strokeWidth="0.25" />

          {/* Center circle */}
          <circle cx="50" cy="50" r="9" strokeWidth="0.2" />
          <circle cx="50" cy="50" r="0.4" fill="white" />

          {/* Penalty areas */}
          <rect x="2" y="18" width="16" height="64" strokeWidth="0.25" />
          <rect x="82" y="18" width="16" height="64" strokeWidth="0.25" />

          {/* Goal areas */}
          <rect x="2" y="32" width="6" height="36" strokeWidth="0.25" />
          <rect x="92" y="32" width="6" height="36" strokeWidth="0.25" />

          {/* Penalty spots */}
          <circle cx="14" cy="50" r="0.35" fill="white" />
          <circle cx="86" cy="50" r="0.35" fill="white" />

          {/* Penalty arcs */}
          <path d="M 14,40 A 5,5 0 0,1 14,60" strokeWidth="0.2" />
          <path d="M 86,40 A 5,5 0 0,0 86,60" strokeWidth="0.2" />

          {/* Corners */}
          <path d="M 2,2 A 2,2 0 0,0 4,0" strokeWidth="0.2" />
          <path d="M 98,2 A 2,2 0 0,1 96,0" strokeWidth="0.2" />
          <path d="M 2,98 A 2,2 0 0,1 4,100" strokeWidth="0.2" />
          <path d="M 98,98 A 2,2 0 0,0 96,100" strokeWidth="0.2" />
        </g>

        {/* Items — filter unknown types */}
        {(function() {
          const validTypes: FieldItemType[] = ['cone', 'ball', 'arrow', 'player'];
          const validItems = items.filter(item => validTypes.includes(item.type));
          return validItems.map((item) => (
            <FieldItemIcon
              key={item.id}
              item={item}
              isSelected={item.id === selectedId}
            />
          ));
        })()}

        {/* Selection handles — direct manipulation */}
        {(() => {
          const selectedItem = items.find(i => i.id === selectedId) || null;
          if (!selectedItem) return null;

          if (selectedItem.type === 'arrow') {
            const tip = getArrowTipPos(selectedItem);
            return (
              <g>
                <line x1={selectedItem.x} y1={selectedItem.y} x2={tip.x} y2={tip.y} stroke={FIELD_GREEN} strokeWidth="0.25" strokeDasharray="0.8,0.6" opacity={0.8} />
                <circle cx={tip.x} cy={tip.y} r="1.8" fill="#FFFFFF" stroke="#14532d" />
              </g>
            );
          }

          const rot = getRotationHandlePos(selectedItem);
          const scaleX = selectedItem.x + 5;
          const scaleY = selectedItem.y + 5;
          return (
            <g>
              <line x1={selectedItem.x} y1={selectedItem.y} x2={rot.x} y2={rot.y} stroke="#FFFFFF" strokeWidth="0.25" strokeDasharray="0.8,0.6" opacity={0.7} />
              <circle cx={rot.x} cy={rot.y} r="1.8" fill="#FFFFFF" stroke="#14532d" />
              <rect x={scaleX - 1.7} y={scaleY - 1.7} width="3.4" height="3.4" rx="0.5" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="0.3" />
            </g>
          );
        })()}

        {/* Arrow placement drag preview */}
        {placementDrag && (
          <g>
            <line
              x1={placementDrag.startX}
              y1={placementDrag.startY}
              x2={placementDrag.currentX}
              y2={placementDrag.currentY}
              stroke="#2196F3"
              strokeWidth="0.5"
              strokeDasharray="1,0.5"
              opacity={0.7}
            />
            <circle cx={placementDrag.startX} cy={placementDrag.startY} r="0.5" fill="#2196F3" opacity={0.5} />
            <circle cx={placementDrag.currentX} cy={placementDrag.currentY} r="1" fill="#2196F3" opacity={0.5} />
          </g>
        )}
      </svg>
    </div>
  );
}

/** Find topmost item at given viewBox coordinates */
function findItemAt(items: FieldItem[], x: number, y: number): FieldItem | null {
  // Iterate in reverse (last drawn = topmost)
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];

    // Arrows are long thin shapes — hit test the LINE SEGMENT, not just the center
    if (item.type === 'arrow') {
      const len = (item.length ?? 10) / 2;
      const rad = (item.rotation * Math.PI) / 180;
      const sx = item.x - Math.sin(rad) * len;
      const sy = item.y + Math.cos(rad) * len;
      const tx = item.x + Math.sin(rad) * len;
      const ty = item.y - Math.cos(rad) * len;
      if (distToSegment(x, y, sx, sy, tx, ty) <= 2.2) return item;
      continue;
    }

    const baseRadius = item.type === 'player' ? 3.5 : item.type === 'ball' ? 2 : 3;
    // Minimum hit radius so small items (ball) are easy to grab
    const hitRadius = Math.max(baseRadius * (item.scale ?? 1), 2.5);
    const dx = x - item.x;
    const dy = y - item.y;
    if (Math.sqrt(dx * dx + dy * dy) <= hitRadius) return item;
  }
  return null;
}

/** Distance from point P to segment A-B */
function distToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - ax, py - ay);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

/** Position of the rotation handle (green circle) for non-arrow items */
function getRotationHandlePos(item: FieldItem): { x: number; y: number } {
  const rad = (item.rotation * Math.PI) / 180;
  const radius = 5;
  return {
    x: item.x + Math.sin(rad) * radius,
    y: item.y - Math.cos(rad) * radius,
  };
}

/** Position of the arrow tip handle (endpoint of the line) */
function getArrowTipPos(item: FieldItem): { x: number; y: number } {
  const rad = (item.rotation * Math.PI) / 180;
  const len = item.length ?? 10;
  return {
    x: item.x + Math.sin(rad) * (len / 2),
    y: item.y - Math.cos(rad) * (len / 2),
  };
}

/** Which handle of the SELECTED item is under (x, y)? */
function getHandleAt(
  selectedItem: FieldItem | null,
  x: number,
  y: number
): 'rotate' | 'scale' | 'arrowTip' | null {
  if (!selectedItem) return null;

  if (selectedItem.type === 'arrow') {
    const tip = getArrowTipPos(selectedItem);
    if (Math.hypot(x - tip.x, y - tip.y) <= 2.4) return 'arrowTip';
    return null; // arrows have no separate rotate/scale handles
  }

  const rot = getRotationHandlePos(selectedItem);
  if (Math.hypot(x - rot.x, y - rot.y) <= 2.4) return 'rotate';

  // Green square handle at (x+5, y+5)
  const scaleX = selectedItem.x + 5;
  const scaleY = selectedItem.y + 5;
  if (Math.hypot(x - scaleX, y - scaleY) <= 2.4) return 'scale';

  return null;
}
