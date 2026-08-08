import { create } from 'zustand';
import api from '../services/api';
import { FixtureEntry, FixtureData } from '../types';

interface FixtureState {
  entries: FixtureEntry[];
  fixtureImage: string | null;
  isLoading: boolean;
  error: string | null;
  fetchFixtures: (teamId: string) => Promise<void>;
  createEntry: (teamId: string, data: Partial<FixtureEntry>) => Promise<FixtureEntry>;
  updateEntry: (teamId: string, id: string, data: Partial<FixtureEntry>) => Promise<void>;
  deleteEntry: (teamId: string, id: string) => Promise<void>;
  updateImage: (teamId: string, imageBase64: string | null) => Promise<void>;
}

export const useFixtureStore = create<FixtureState>((set) => ({
  entries: [],
  fixtureImage: null,
  isLoading: false,
  error: null,

  fetchFixtures: async (teamId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<FixtureData>(`/teams/${teamId}/fixtures`);
      set({ entries: response.data.entries, fixtureImage: response.data.fixtureImage, isLoading: false });
    } catch {
      set({ error: 'Error al cargar el fixture', isLoading: false });
    }
  },

  createEntry: async (teamId, data) => {
    const response = await api.post<FixtureEntry>(`/teams/${teamId}/fixtures`, data);
    set((state) => ({ entries: [...state.entries, response.data] }));
    return response.data;
  },

  updateEntry: async (teamId, id, data) => {
    const response = await api.put<FixtureEntry>(`/teams/${teamId}/fixtures/${id}`, data);
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? response.data : e)),
    }));
  },

  deleteEntry: async (teamId, id) => {
    await api.delete(`/teams/${teamId}/fixtures/${id}`);
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  updateImage: async (teamId, fixtureImage) => {
    const response = await api.patch<{ fixtureImage: string | null }>(`/teams/${teamId}/fixtures/image`, { fixtureImage });
    set({ fixtureImage: response.data.fixtureImage });
  },
}));
