import { create } from 'zustand';
import api from '../services/api';
import { MatchEvent } from '../types';

interface MatchEventState {
  events: MatchEvent[];
  isLoading: boolean;
  error: string | null;
  fetchEvents: (teamId: string, formationId: string) => Promise<void>;
  createEvent: (teamId: string, formationId: string, data: { playerId: string; eventType: string; minute?: number | null }) => Promise<MatchEvent>;
  updateEvent: (teamId: string, formationId: string, eventId: string, data: { eventType?: string; minute?: number | null }) => Promise<void>;
  deleteEvent: (teamId: string, formationId: string, eventId: string) => Promise<void>;
  clearEvents: () => void;
}

export const useMatchEventStore = create<MatchEventState>((set) => ({
  events: [],
  isLoading: false,
  error: null,

  clearEvents: () => set({ events: [], error: null }),

  fetchEvents: async (teamId: string, formationId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/teams/${teamId}/formations/${formationId}/events`);
      set({ events: response.data, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al cargar eventos';
      set({ error: message, isLoading: false });
    }
  },

  createEvent: async (teamId, formationId, data) => {
    const response = await api.post(`/teams/${teamId}/formations/${formationId}/events`, data);
    set((state) => ({ events: [...state.events, response.data] }));
    return response.data;
  },

  updateEvent: async (teamId, formationId, eventId, data) => {
    const response = await api.put(`/teams/${teamId}/formations/${formationId}/events/${eventId}`, data);
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? response.data : e)),
    }));
  },

  deleteEvent: async (teamId, formationId, eventId) => {
    await api.delete(`/teams/${teamId}/formations/${formationId}/events/${eventId}`);
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
  },
}));
