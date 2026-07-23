import { create } from 'zustand';
import api from '../services/api';
import { Team } from '../types';

interface TeamState {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  error: string | null;
  fetchTeams: () => Promise<void>;
  fetchTeam: (teamId: string) => Promise<void>;
  createTeam: (name: string) => Promise<Team>;
  updateTeam: (teamId: string, name: string) => Promise<void>;
  deleteTeam: (teamId: string) => Promise<void>;
  clearError: () => void;
}

export const useTeamStore = create<TeamState>((set, get) => ({
  teams: [],
  currentTeam: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchTeams: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/teams');
      set({ teams: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar equipos';
      set({ error: message, isLoading: false });
    }
  },

  fetchTeam: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/${teamId}`);
      set({ currentTeam: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar el equipo';
      set({ error: message, isLoading: false });
    }
  },

  createTeam: async (name: string) => {
    const response = await api.post('/teams', { name });
    set((state) => ({ teams: [response.data, ...state.teams] }));
    return response.data;
  },

  updateTeam: async (teamId: string, name: string) => {
    const response = await api.put(`/teams/${teamId}`, { name });
    set((state) => ({
      teams: state.teams.map((t) => (t.id === teamId ? response.data : t)),
      currentTeam: state.currentTeam?.id === teamId ? response.data : state.currentTeam,
    }));
  },

  deleteTeam: async (teamId: string) => {
    await api.delete(`/teams/${teamId}`);
    set((state) => ({
      teams: state.teams.filter((t) => t.id !== teamId),
      currentTeam: state.currentTeam?.id === teamId ? null : state.currentTeam,
    }));
  },
}));
