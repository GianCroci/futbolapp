import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SubstituteSlots, SubstituteEntry } from './SubstituteSlots';
import { Player } from '../../../types';

const mockPlayers: Player[] = [
  { id: 'p1', name: 'Carlos García', position: 'ARQUERO', dorsal: 1, teamId: 't1' },
  { id: 'p2', name: 'Luis Fernández', position: 'DEFENSOR_CENTRAL', dorsal: 4, teamId: 't1' },
  { id: 'p3', name: 'María López', position: 'MEDIOCENTRO_OFENSIVO', dorsal: 10, teamId: 't1' },
];

function makeSub(overrides: Partial<SubstituteEntry> = {}): SubstituteEntry {
  return {
    playerId: 'p1',
    playerName: 'Carlos García',
    playerDorsal: 1,
    subInMinute: 0,
    ...overrides,
  };
}

describe('SubstituteSlots', () => {
  describe('SC-FORM-01: Empty state shows 6 placeholders', () => {
    it('renders 6 empty placeholder slots when substitutes is empty', () => {
      render(
        <SubstituteSlots
          substitutes={[]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={vi.fn()}
        />
      );

      expect(screen.getAllByText('Vacío')).toHaveLength(6);
    });
  });

  describe('SC-FORM-09: Minute defaults to 0', () => {
    it('shows minute 0 for new substitutes', () => {
      render(
        <SubstituteSlots
          substitutes={[makeSub({ subInMinute: 0 })]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={vi.fn()}
        />
      );

      const minuteInput = screen.getByRole('spinbutton');
      expect(minuteInput).toHaveValue(0);
    });
  });

  describe('Filled card rendering', () => {
    it('renders dorsal, name, position, minute input, and remove button', () => {
      render(
        <SubstituteSlots
          substitutes={[makeSub({ playerName: 'Carlos García', playerDorsal: 1, subInMinute: 45 })]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={vi.fn()}
        />
      );

      // The dorsal appears in both the badge count and the circle — use getAllByText
      expect(screen.getAllByText('1').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Carlos García')).toBeInTheDocument();
      expect(screen.getByText('ARQ')).toBeInTheDocument();
      expect(screen.getByRole('spinbutton')).toHaveValue(45);
      expect(screen.getByText('Quitar')).toBeInTheDocument();
    });
  });

  describe('SC-FORM-07: Removing a substitute', () => {
    it('fires onRemove when X button clicked', async () => {
      const onRemove = vi.fn();
      const user = userEvent.setup();

      render(
        <SubstituteSlots
          substitutes={[makeSub({ playerId: 'p1' })]}
          allPlayers={mockPlayers}
          onRemove={onRemove}
          onUpdateMinute={vi.fn()}
        />
      );

      await user.click(screen.getByText('Quitar'));
      expect(onRemove).toHaveBeenCalledWith('p1');
    });
  });

  describe('Minute field interaction', () => {
    it('fires onUpdateMinute when minute input changes', () => {
      const onUpdateMinute = vi.fn();

      render(
        <SubstituteSlots
          substitutes={[makeSub({ playerId: 'p1', subInMinute: 0 })]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={onUpdateMinute}
        />
      );

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '60' } });
      expect(onUpdateMinute).toHaveBeenCalledWith('p1', 60);
    });
  });

  describe('Dynamic slot count', () => {
    it('renders max(minSlots, substitutes.length) slots', () => {
      const { rerender } = render(
        <SubstituteSlots
          substitutes={[makeSub({ playerId: 'p1' })]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={vi.fn()}
        />
      );

      // 1 sub, minSlots=6 → 6 total slots (1 filled + 5 empty)
      expect(screen.getAllByText('Vacío')).toHaveLength(5);

      rerender(
        <SubstituteSlots
          substitutes={[
            makeSub({ playerId: 'p1' }),
            makeSub({ playerId: 'p2', playerName: 'Luis Fernández', playerDorsal: 4 }),
          ]}
          allPlayers={mockPlayers}
          onRemove={vi.fn()}
          onUpdateMinute={vi.fn()}
        />
      );

      // 2 subs → 6 total slots (2 filled + 4 empty)
      expect(screen.getAllByText('Vacío')).toHaveLength(4);
    });
  });

  describe('Empty placeholder is inert', () => {
    it('empty placeholder has no onClick handler (non-clickable)', () => {
      const onRemove = vi.fn();

      render(
        <SubstituteSlots
          substitutes={[]}
          allPlayers={mockPlayers}
          onRemove={onRemove}
          onUpdateMinute={vi.fn()}
        />
      );

      // Empty placeholders should not have a Quitar button
      expect(screen.queryByText('Quitar')).not.toBeInTheDocument();
      // onRemove should not have been called
      expect(onRemove).not.toHaveBeenCalled();
    });
  });
});
