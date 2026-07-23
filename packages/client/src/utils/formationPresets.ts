export interface PitchPosition {
  slotPosition: string;
  label: string;
  positionX: number;
  positionY: number;
}

export const FORMATION_PRESETS: Record<string, { label: string; positions: PitchPosition[] }> = {
  F_4_4_2: {
    label: '4-4-2',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'LB', label: 'LI', positionX: 12, positionY: 25 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 38, positionY: 25 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 62, positionY: 25 },
      { slotPosition: 'RB', label: 'LD', positionX: 88, positionY: 25 },
      { slotPosition: 'LM', label: 'MI', positionX: 12, positionY: 50 },
      { slotPosition: 'CM1', label: 'MC', positionX: 38, positionY: 52 },
      { slotPosition: 'CM2', label: 'MC', positionX: 62, positionY: 52 },
      { slotPosition: 'RM', label: 'MD', positionX: 88, positionY: 50 },
      { slotPosition: 'ST1', label: 'DC', positionX: 38, positionY: 80 },
      { slotPosition: 'ST2', label: 'DC', positionX: 62, positionY: 80 },
    ],
  },
  F_4_3_3: {
    label: '4-3-3',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'LB', label: 'LI', positionX: 12, positionY: 25 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 38, positionY: 25 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 62, positionY: 25 },
      { slotPosition: 'RB', label: 'LD', positionX: 88, positionY: 25 },
      { slotPosition: 'CDM', label: 'MCD', positionX: 50, positionY: 48 },
      { slotPosition: 'CM1', label: 'MC', positionX: 35, positionY: 55 },
      { slotPosition: 'CM2', label: 'MC', positionX: 65, positionY: 55 },
      { slotPosition: 'LW', label: 'EI', positionX: 15, positionY: 78 },
      { slotPosition: 'ST', label: 'DC', positionX: 50, positionY: 84 },
      { slotPosition: 'RW', label: 'ED', positionX: 85, positionY: 78 },
    ],
  },
  F_3_5_2: {
    label: '3-5-2',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 25, positionY: 22 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 50, positionY: 22 },
      { slotPosition: 'CB3', label: 'DFC', positionX: 75, positionY: 22 },
      { slotPosition: 'LM', label: 'MI', positionX: 8, positionY: 46 },
      { slotPosition: 'CM1', label: 'MC', positionX: 33, positionY: 50 },
      { slotPosition: 'CM2', label: 'MC', positionX: 50, positionY: 52 },
      { slotPosition: 'CM3', label: 'MC', positionX: 67, positionY: 50 },
      { slotPosition: 'RM', label: 'MD', positionX: 92, positionY: 46 },
      { slotPosition: 'ST1', label: 'DC', positionX: 38, positionY: 80 },
      { slotPosition: 'ST2', label: 'DC', positionX: 62, positionY: 80 },
    ],
  },
  F_4_2_3_1: {
    label: '4-2-3-1',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'LB', label: 'LI', positionX: 12, positionY: 25 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 38, positionY: 25 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 62, positionY: 25 },
      { slotPosition: 'RB', label: 'LD', positionX: 88, positionY: 25 },
      { slotPosition: 'CDM1', label: 'MCD', positionX: 38, positionY: 46 },
      { slotPosition: 'CDM2', label: 'MCD', positionX: 62, positionY: 46 },
      { slotPosition: 'LW', label: 'EI', positionX: 15, positionY: 70 },
      { slotPosition: 'CAM', label: 'MP', positionX: 50, positionY: 68 },
      { slotPosition: 'RW', label: 'ED', positionX: 85, positionY: 70 },
      { slotPosition: 'ST', label: 'DC', positionX: 50, positionY: 84 },
    ],
  },
  F_5_3_2: {
    label: '5-3-2',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'LWB', label: 'LI', positionX: 8, positionY: 28 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 28, positionY: 22 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 50, positionY: 20 },
      { slotPosition: 'CB3', label: 'DFC', positionX: 72, positionY: 22 },
      { slotPosition: 'RWB', label: 'LD', positionX: 92, positionY: 28 },
      { slotPosition: 'CM1', label: 'MC', positionX: 38, positionY: 48 },
      { slotPosition: 'CM2', label: 'MC', positionX: 50, positionY: 52 },
      { slotPosition: 'CM3', label: 'MC', positionX: 62, positionY: 48 },
      { slotPosition: 'ST1', label: 'DC', positionX: 38, positionY: 80 },
      { slotPosition: 'ST2', label: 'DC', positionX: 62, positionY: 80 },
    ],
  },
  F_4_1_4_1: {
    label: '4-1-4-1',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'LB', label: 'LI', positionX: 12, positionY: 25 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 38, positionY: 25 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 62, positionY: 25 },
      { slotPosition: 'RB', label: 'LD', positionX: 88, positionY: 25 },
      { slotPosition: 'CDM', label: 'MCD', positionX: 50, positionY: 44 },
      { slotPosition: 'LM', label: 'MI', positionX: 12, positionY: 60 },
      { slotPosition: 'CM1', label: 'MC', positionX: 38, positionY: 58 },
      { slotPosition: 'CM2', label: 'MC', positionX: 62, positionY: 58 },
      { slotPosition: 'RM', label: 'MD', positionX: 88, positionY: 60 },
      { slotPosition: 'ST', label: 'DC', positionX: 50, positionY: 84 },
    ],
  },
  F_3_4_3: {
    label: '3-4-3',
    positions: [
      { slotPosition: 'GK', label: 'ARQ', positionX: 50, positionY: 5 },
      { slotPosition: 'CB1', label: 'DFC', positionX: 25, positionY: 22 },
      { slotPosition: 'CB2', label: 'DFC', positionX: 50, positionY: 20 },
      { slotPosition: 'CB3', label: 'DFC', positionX: 75, positionY: 22 },
      { slotPosition: 'LM', label: 'MI', positionX: 8, positionY: 48 },
      { slotPosition: 'CM1', label: 'MC', positionX: 38, positionY: 50 },
      { slotPosition: 'CM2', label: 'MC', positionX: 62, positionY: 50 },
      { slotPosition: 'RM', label: 'MD', positionX: 92, positionY: 48 },
      { slotPosition: 'LW', label: 'EI', positionX: 18, positionY: 78 },
      { slotPosition: 'ST', label: 'DC', positionX: 50, positionY: 84 },
      { slotPosition: 'RW', label: 'ED', positionX: 82, positionY: 78 },
    ],
  },
};

export const FORMATION_PRESET_OPTIONS = Object.entries(FORMATION_PRESETS).map(([value, preset]) => ({
  value,
  label: preset.label,
}));

export function getPresetPositions(formationType: string | null): PitchPosition[] {
  if (formationType && FORMATION_PRESETS[formationType]) {
    return FORMATION_PRESETS[formationType].positions;
  }
  // Default: 4-4-2
  return FORMATION_PRESETS.F_4_4_2.positions;
}
