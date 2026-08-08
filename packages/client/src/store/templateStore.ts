import { create } from 'zustand';
import api from '../services/api';
import { ExerciseTemplate, FieldDiagram } from '../types';

interface TemplateState {
  templates: ExerciseTemplate[];
  isLoading: boolean;
  error: string | null;
  fetchTemplates: () => Promise<void>;
  createTemplate: (data: { name: string; diagram: FieldDiagram }) => Promise<ExerciseTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
}

export const useTemplateStore = create<TemplateState>((set) => ({
  templates: [],
  isLoading: false,
  error: null,

  fetchTemplates: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get<ExerciseTemplate[]>('/exercise-templates');
      set({ templates: response.data, isLoading: false });
    } catch {
      set({ error: 'Error al cargar plantillas', isLoading: false });
    }
  },

  createTemplate: async (data) => {
    const response = await api.post<ExerciseTemplate>('/exercise-templates', data);
    set((state) => ({ templates: [...state.templates, response.data] }));
    return response.data;
  },

  deleteTemplate: async (id) => {
    await api.delete(`/exercise-templates/${id}`);
    set((state) => ({ templates: state.templates.filter((t) => t.id !== id) }));
  },
}));
