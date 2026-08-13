import { FieldItem, NamedDiagram } from '../types';

const DEFAULT_DIAGRAM_NAME = 'Diagrama 1';
const TRAILING_NUMBER = /^(.*?)\s+(\d+)$/;

/**
 * Normalize the raw `TrainingSession.diagram` JSON column into a diagram list.
 *
 * - `null` / `undefined` / malformed top-level input → `[]`
 * - Legacy `{ items: FieldItem[] }` rows → one diagram named "Diagrama 1"
 *   (no data loss; id from `idFactory`, injectable for tests)
 * - New-shape `{ diagrams: NamedDiagram[] }` → passthrough with malformed
 *   entries filtered out
 */
export function normalizeDiagrams(
  raw: unknown,
  idFactory: () => string = () => crypto.randomUUID(),
): NamedDiagram[] {
  if (raw === null || raw === undefined || typeof raw !== 'object' || Array.isArray(raw)) {
    return [];
  }
  const obj = raw as Record<string, unknown>;

  // New shape wins when both are present — legacy items are then irrelevant.
  if (Array.isArray(obj.diagrams)) {
    return obj.diagrams.filter(isNamedDiagramEntry);
  }

  if (Array.isArray(obj.items)) {
    return [{ id: idFactory(), name: DEFAULT_DIAGRAM_NAME, items: obj.items as FieldItem[] }];
  }

  return [];
}

function isNamedDiagramEntry(value: unknown): value is NamedDiagram {
  if (typeof value !== 'object' || value === null) return false;
  const { id, name, items } = value as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    typeof name === 'string' &&
    name.length > 0 &&
    Array.isArray(items)
  );
}

/**
 * Resolve `candidate` against `existing` names, auto-suffixing on collision:
 * - free candidate → as-is
 * - colliding "X" → "X 2", then "X 3", …
 * - colliding "X N" (N ≥ 2) continues from N ("Rondos 5" taken → "Rondos 6")
 * - colliding "X 1" restarts the sequence at 2, so the default name
 *   "Diagrama 1" yields "Diagrama 2", "Diagrama 3", … (next unused N)
 */
export function uniqueName(candidate: string, existing: ReadonlySet<string>): string {
  if (!existing.has(candidate)) return candidate;

  const match = TRAILING_NUMBER.exec(candidate);
  const base = match ? match[1] : candidate;
  const start = match ? Math.max(2, parseInt(match[2], 10)) : 2;

  let n = start;
  while (existing.has(`${base} ${n}`)) n += 1;
  return `${base} ${n}`;
}

/** Mark a single diagram as dirty, preserving the rest of the map. */
export function markDirty(
  map: Record<string, boolean>,
  id: string,
): Record<string, boolean> {
  return { ...map, [id]: true };
}

/** True when any diagram has unsaved edits. */
export function anyDirty(map: Record<string, boolean>): boolean {
  return Object.values(map).some(Boolean);
}

/** Empty map — used after a successful whole-list save. */
export function resetDirty(): Record<string, boolean> {
  return {};
}

/** Drop dirty entries for diagrams that no longer exist. */
export function pruneDirty(
  map: Record<string, boolean>,
  ids: string[],
): Record<string, boolean> {
  const keep = new Set(ids);
  return Object.fromEntries(Object.entries(map).filter(([id]) => keep.has(id)));
}
