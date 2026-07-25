import { create } from 'zustand';
import api from '../services/api';
import { Substitution } from '../types';

interface SubstitutionState {
  substitutions: Substitution[];
  isLoading: boolean;
  error: string | null;
  fetchSubstitutions: (teamId: string, formationId: string) => Promise<void>;
  createSubstitution: (
    teamId: string,
    formationId: string,
    data: { playerOutId: string; playerInId: string; minute: number }
  ) => Promise<Substitution>;
  deleteSubstitution: (teamId: string, formationId: string, substitutionId: string) => Promise<void>;
  clearSubstitutions: () => void;
}

export const useSubstitutionStore = create<SubstitutionState>((set) => ({
  substitutions: [],
  isLoading: false,
  error: null,

  clearSubstitutions: () => set({ substitutions: [], error: null }),

  fetchSubstitutions: async (teamId: string, formationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/${teamId}/formations/${formationId}/substitutions`);
      set({ substitutions: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar sustituciones';
      set({ error: message, isLoading: false });
    }
  },

  createSubstitution: async (teamId, formationId, data) => {
    const response = await api.post(
      `/teams/${teamId}/formations/${formationId}/substitutions`,
      data
    );
    set((state) => ({ substitutions: [...state.substitutions, response.data] }));
    return response.data;
  },

  deleteSubstitution: async (teamId, formationId, substitutionId) => {
    await api.delete(`/teams/${teamId}/formations/${formationId}/substitutions/${substitutionId}`);
    set((state) => ({
      substitutions: state.substitutions.filter((s) => s.id !== substitutionId),
    }));
  },
}));
