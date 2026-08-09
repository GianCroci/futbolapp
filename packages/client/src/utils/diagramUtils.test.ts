import { describe, it, expect } from 'vitest';
import {
  normalizeDiagrams,
  uniqueName,
  markDirty,
  anyDirty,
  resetDirty,
  pruneDirty,
} from './diagramUtils';
import type { FieldItem } from '../types';

const item = (id: string): FieldItem => ({
  id,
  type: 'cone',
  x: 10,
  y: 20,
  rotation: 0,
});

describe('normalizeDiagrams', () => {
  it('returns an empty array for null and undefined input', () => {
    expect(normalizeDiagrams(null)).toEqual([]);
    expect(normalizeDiagrams(undefined)).toEqual([]);
  });

  it('returns an empty array for non-object input', () => {
    expect(normalizeDiagrams('nope')).toEqual([]);
    expect(normalizeDiagrams(42)).toEqual([]);
    expect(normalizeDiagrams([])).toEqual([]);
  });

  it('wraps a legacy { items } row as a single "Diagrama 1" using the injected id factory', () => {
    const items = [item('a'), item('b')];
    const result = normalizeDiagrams({ items }, () => 'legacy-id');
    expect(result).toEqual([{ id: 'legacy-id', name: 'Diagrama 1', items }]);
  });

  it('passes new-shape { diagrams } through unchanged, preserving order', () => {
    const input = {
      diagrams: [
        { id: 'd1', name: 'Entrada en calor', items: [item('a')] },
        { id: 'd2', name: 'Rondos', items: [item('b')] },
      ],
    };
    expect(normalizeDiagrams(input)).toEqual(input.diagrams);
  });

  it('filters malformed entries from a new-shape payload', () => {
    const input = {
      diagrams: [
        { id: 'd1', name: 'Rondos', items: [] },
        { id: 'd2', items: [] }, // missing name
        { name: 'Sin id', items: [] }, // missing id
        { id: 'd3', name: 'Mal items', items: 'nope' }, // items not an array
        'garbage',
        null,
      ],
    };
    const result = normalizeDiagrams(input);
    expect(result).toEqual([{ id: 'd1', name: 'Rondos', items: [] }]);
  });

  it('returns an empty array when diagrams is not an array', () => {
    expect(normalizeDiagrams({ diagrams: 'nope' })).toEqual([]);
    expect(normalizeDiagrams({ diagrams: null })).toEqual([]);
  });

  it('prioritizes the new shape over a legacy items field when both are present', () => {
    const input = { diagrams: [{ id: 'd1', name: 'Nuevo', items: [] }], items: [item('a')] };
    expect(normalizeDiagrams(input)).toEqual([{ id: 'd1', name: 'Nuevo', items: [] }]);
  });

  it('uses crypto.randomUUID by default when no id factory is injected', () => {
    const result = normalizeDiagrams({ items: [] });
    expect(result).toHaveLength(1);
    expect(result[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('uniqueName', () => {
  it('returns a free candidate unchanged', () => {
    expect(uniqueName('Rondos', new Set(['Entrada']))).toBe('Rondos');
  });

  it('suffixes a colliding candidate with 2, then 3', () => {
    const existing = new Set(['Rondos']);
    expect(uniqueName('Rondos', existing)).toBe('Rondos 2');
    expect(uniqueName('Rondos', new Set(['Rondos', 'Rondos 2']))).toBe('Rondos 3');
  });

  it('continues from the trailing number of a suffixed colliding candidate', () => {
    expect(uniqueName('Rondos 5', new Set(['Rondos 5']))).toBe('Rondos 6');
    expect(uniqueName('Rondos 5', new Set(['Rondos 5', 'Rondos 6']))).toBe('Rondos 7');
  });

  it('produces the "Diagrama N" default sequence', () => {
    expect(uniqueName('Diagrama 1', new Set())).toBe('Diagrama 1');
    expect(uniqueName('Diagrama 1', new Set(['Diagrama 1']))).toBe('Diagrama 2');
    expect(uniqueName('Diagrama 1', new Set(['Diagrama 1', 'Diagrama 2']))).toBe('Diagrama 3');
  });

  it('keeps an unsuffixed colliding candidate simple even when "X 1" exists', () => {
    expect(uniqueName('Rondos 1', new Set(['Rondos 1']))).toBe('Rondos 2');
  });
});

describe('dirty tracker', () => {
  it('marks a diagram dirty while preserving other entries', () => {
    const map = markDirty({}, 'a');
    expect(map).toEqual({ a: true });
    const withMore = markDirty(map, 'b');
    expect(withMore).toEqual({ a: true, b: true });
  });

  it('reports anyDirty correctly', () => {
    expect(anyDirty({})).toBe(false);
    expect(anyDirty({ a: false })).toBe(false);
    expect(anyDirty({ a: false, b: true })).toBe(true);
  });

  it('keeps dirty isolation across switches (marking B never clears A)', () => {
    const switched = markDirty(markDirty({}, 'a'), 'b');
    expect(switched).toEqual({ a: true, b: true });
    expect(anyDirty(switched)).toBe(true);
  });

  it('resets to an empty map', () => {
    expect(resetDirty()).toEqual({});
  });

  it('prunes entries for diagrams that no longer exist', () => {
    const map = { a: true, b: true, c: false };
    expect(pruneDirty(map, ['a', 'c'])).toEqual({ a: true, c: false });
    expect(pruneDirty(map, [])).toEqual({});
  });
});
