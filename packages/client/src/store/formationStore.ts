import { create } from 'zustand';
import api from '../services/api';
import { Formation, FormationPlayer } from '../types';

export interface SlotAssignment {
  slotPosition: string;
  positionX: number;
  positionY: number;
  playerId: string | null;
  playerName?: string;
  playerDorsal?: number | null;
}

interface FormationState {
  formations: Formation[];
  currentFormation: (Formation & { players: (FormationPlayer & { player: { name: string; dorsal: number | null } })[] }) | null;
  isLoading: boolean;
  error: string | null;
  fetchFormations: (teamId: string) => Promise<void>;
  fetchFormation: (teamId: string, formationId: string) => Promise<void>;
  createFormation: (teamId: string, data: {
    name: string;
    formationType?: string | null;
    players: { playerId: string; positionX: number; positionY: number; slotPosition: string }[];
  }) => Promise<void>;
  updateFormation: (teamId: string, formationId: string, data: {
    name: string;
    formationType?: string | null;
    players: { playerId: string; positionX: number; positionY: number; slotPosition: string }[];
  }) => Promise<void>;
  deleteFormation: (teamId: string, formationId: string) => Promise<void>;
  clearError: () => void;
}

export const useFormationStore = create<FormationState>((set, get) => ({
  formations: [],
  currentFormation: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchFormations: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/${teamId}/formations`);
      set({ formations: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar formaciones';
      set({ error: message, isLoading: false });
    }
  },

  fetchFormation: async (teamId: string, formationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/${teamId}/formations/${formationId}`);
      set({ currentFormation: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar la formación';
      set({ error: message, isLoading: false });
    }
  },

  createFormation: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/formations`, data);
    set((state) => ({ formations: [response.data, ...state.formations] }));
  },

  updateFormation: async (teamId, formationId, data) => {
    const response = await api.put(`/teams/${teamId}/formations/${formationId}`, data);
    set((state) => ({
      formations: state.formations.map((f) => (f.id === formationId ? response.data : f)),
    }));
  },

  deleteFormation: async (teamId, formationId) => {
    await api.delete(`/teams/${teamId}/formations/${formationId}`);
    set((state) => ({
      formations: state.formations.filter((f) => f.id !== formationId),
      currentFormation: state.currentFormation?.id === formationId ? null : state.currentFormation,
    }));
  },
}));
