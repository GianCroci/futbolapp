import { create } from 'zustand';
import api from '../services/api';
import {
  TrainingSession,
  TrainingStage,
  CreateTrainingSessionPayload,
  UpdateTrainingSessionPayload,
  CreateTrainingStagePayload,
  UpdateTrainingStagePayload,
} from '../types';

interface TrainingState {
  sessions: TrainingSession[];
  currentSession: TrainingSession | null;
  isLoading: boolean;
  error: string | null;

  fetchSessions: () => Promise<void>;
  fetchSession: (id: string) => Promise<void>;
  createSession: (data: CreateTrainingSessionPayload) => Promise<TrainingSession | undefined>;
  updateSession: (id: string, data: UpdateTrainingSessionPayload) => Promise<boolean>;
  deleteSession: (id: string) => Promise<void>;

  addStage: (sessionId: string, data: CreateTrainingStagePayload) => Promise<void>;
  updateStage: (sessionId: string, stageId: string, data: UpdateTrainingStagePayload) => Promise<void>;
  deleteStage: (sessionId: string, stageId: string) => Promise<void>;
  reorderStages: (sessionId: string, order: string[]) => Promise<void>;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  sessions: [],
  currentSession: null,
  isLoading: false,
  error: null,

  fetchSessions: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<TrainingSession[]>('/training-sessions');
      set({ sessions: response.data, isLoading: false });
    } catch {
      set({ error: 'Error al cargar las sesiones de entrenamiento', isLoading: false });
    }
  },

  fetchSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<TrainingSession>(`/training-sessions/${id}`);
      set({ currentSession: response.data, isLoading: false });
    } catch {
      set({ error: 'Error al cargar la sesión de entrenamiento', isLoading: false });
    }
  },

  createSession: async (data: CreateTrainingSessionPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<TrainingSession>('/training-sessions', data);
      set((state) => ({ sessions: [...state.sessions, response.data], isLoading: false }));
      return response.data;
    } catch {
      set({ error: 'Error al crear la sesión de entrenamiento', isLoading: false });
    }
  },

  updateSession: async (id: string, data: UpdateTrainingSessionPayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<TrainingSession>(`/training-sessions/${id}`, data);
      set((state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? response.data : s)),
        currentSession: state.currentSession?.id === id ? response.data : state.currentSession,
        isLoading: false,
      }));
      return true;
    } catch {
      set({ error: 'Error al actualizar la sesión de entrenamiento', isLoading: false });
      return false;
    }
  },

  deleteSession: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/training-sessions/${id}`);
      set((state) => ({
        sessions: state.sessions.filter((s) => s.id !== id),
        currentSession: state.currentSession?.id === id ? null : state.currentSession,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Error al eliminar la sesión de entrenamiento', isLoading: false });
    }
  },

  addStage: async (sessionId: string, data: CreateTrainingStagePayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post<TrainingStage>(`/training-sessions/${sessionId}/stages`, data);
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              stages: [...(state.currentSession.stages || []), response.data],
            }
          : null,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Error al agregar la etapa de entrenamiento', isLoading: false });
    }
  },

  updateStage: async (sessionId: string, stageId: string, data: UpdateTrainingStagePayload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put<TrainingStage>(
        `/training-sessions/${sessionId}/stages/${stageId}`,
        data,
      );
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              stages: (state.currentSession.stages || []).map((s) =>
                s.id === stageId ? response.data : s,
              ),
            }
          : null,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Error al actualizar la etapa de entrenamiento', isLoading: false });
    }
  },

  deleteStage: async (sessionId: string, stageId: string) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/training-sessions/${sessionId}/stages/${stageId}`);
      set((state) => ({
        currentSession: state.currentSession
          ? {
              ...state.currentSession,
              stages: (state.currentSession.stages || []).filter((s) => s.id !== stageId),
            }
          : null,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Error al eliminar la etapa de entrenamiento', isLoading: false });
    }
  },

  reorderStages: async (sessionId: string, order: string[]) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.patch<TrainingStage[]>(
        `/training-sessions/${sessionId}/stages/reorder`,
        { order },
      );
      set((state) => ({
        currentSession: state.currentSession
          ? { ...state.currentSession, stages: response.data }
          : null,
        isLoading: false,
      }));
    } catch {
      set({ error: 'Error al reordenar las etapas de entrenamiento', isLoading: false });
    }
  },
}));
