import { create } from 'zustand';
import api from '../services/api';
import { PlayerStat } from '../types';

interface StatsState {
  stats: PlayerStat[];
  isLoading: boolean;
  error: string | null;
  fetchStats: (teamId: string, from?: string, to?: string) => Promise<void>;
  clearStats: () => void;
}

export const useStatsStore = create<StatsState>((set) => ({
  stats: [],
  isLoading: false,
  error: null,

  clearStats: () => set({ stats: [], error: null }),

  fetchStats: async (teamId: string, from?: string, to?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const response = await api.get(`/teams/${teamId}/stats`, { params });
      set({ stats: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar estadísticas';
      set({ error: message, isLoading: false });
    }
  },
}));
