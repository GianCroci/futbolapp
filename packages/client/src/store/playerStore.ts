import { create } from 'zustand';
import api from '../services/api';
import { Player } from '../types';

interface PlayerState {
  players: Player[];
  isLoading: boolean;
  error: string | null;
  fetchPlayers: (teamId: string, position?: string) => Promise<void>;
  createPlayer: (teamId: string, data: { name: string; position: string; dorsal?: number | null }) => Promise<void>;
  updatePlayer: (teamId: string, playerId: string, data: { name?: string; position?: string; dorsal?: number | null }) => Promise<void>;
  deletePlayer: (teamId: string, playerId: string) => Promise<void>;
  clearError: () => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  players: [],
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchPlayers: async (teamId: string, position?: string) => {
    set({ isLoading: true, error: null });
    try {
      const params = position ? { position } : {};
      const response = await api.get(`/teams/${teamId}/players`, { params });
      set({ players: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar jugadores';
      set({ error: message, isLoading: false });
    }
  },

  createPlayer: async (teamId, data) => {
    const response = await api.post(`/teams/${teamId}/players`, data);
    set((state) => ({ players: [...state.players, response.data] }));
  },

  updatePlayer: async (teamId, playerId, data) => {
    const response = await api.put(`/teams/${teamId}/players/${playerId}`, data);
    set((state) => ({
      players: state.players.map((p) => (p.id === playerId ? response.data : p)),
    }));
  },

  deletePlayer: async (teamId, playerId) => {
    await api.delete(`/teams/${teamId}/players/${playerId}`);
    set((state) => ({
      players: state.players.filter((p) => p.id !== playerId),
    }));
  },
}));
