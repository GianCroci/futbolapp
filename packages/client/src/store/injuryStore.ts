import { create } from 'zustand';
import api from '../services/api';
import { Injury, UpdateInjuryPayload } from '../types';

interface InjuryState {
  injuries: Injury[];
  isLoading: boolean;
  error: string | null;
  fetchInjuries: (teamId: string) => Promise<void>;
  createInjury: (teamId: string, data: Partial<Injury>) => Promise<Injury>;
  updateInjury: (teamId: string, id: string, data: UpdateInjuryPayload) => Promise<void>;
  deleteInjury: (teamId: string, id: string) => Promise<void>;
  markRecovered: (teamId: string, id: string) => Promise<void>;
}

export const useInjuryStore = create<InjuryState>((set) => ({
  injuries: [],
  isLoading: false,
  error: null,

  fetchInjuries: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<Injury[]>(`/teams/${teamId}/injuries`);
      set({ injuries: response.data, isLoading: false });
    } catch {
      set({ error: 'Error al cargar las lesiones', isLoading: false });
    }
  },

  createInjury: async (teamId, data) => {
    const response = await api.post<Injury>(`/teams/${teamId}/injuries`, data);
    set((state) => ({ injuries: [...state.injuries, response.data] }));
    return response.data;
  },

  updateInjury: async (teamId, id, data: UpdateInjuryPayload) => {
    const response = await api.put<Injury>(`/teams/${teamId}/injuries/${id}`, data);
    set((state) => ({
      injuries: state.injuries.map((i) => (i.id === id ? response.data : i)),
    }));
  },

  deleteInjury: async (teamId, id) => {
    await api.delete(`/teams/${teamId}/injuries/${id}`);
    set((state) => ({ injuries: state.injuries.filter((i) => i.id !== id) }));
  },

  markRecovered: async (teamId, id) => {
    const response = await api.patch<Injury>(`/teams/${teamId}/injuries/${id}/recover`);
    set((state) => ({
      injuries: state.injuries.map((i) => (i.id === id ? response.data : i)),
    }));
  },
}));
