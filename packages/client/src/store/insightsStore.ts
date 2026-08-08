import { create } from 'zustand';
import axios from 'axios';
import api from '../services/api';
import type { InsightsMessage, InsightsQueryRequest, InsightsResponse } from '../types';

// Per-team conversation history persisted in localStorage (design D4: no schema
// migration; device-local only — R6). Key format: futbolapp:insights:{teamId}.
const HISTORY_PREFIX = 'futbolapp:insights:';
const historyKey = (teamId: string) => `${HISTORY_PREFIX}${teamId}`;

export interface InsightsConversation {
  messages: InsightsMessage[];
  isLoading: boolean;
  error: string | null;
  configError: boolean;
}

export const EMPTY_CONVERSATION: InsightsConversation = {
  messages: [],
  isLoading: false,
  error: null,
  configError: false,
};

interface InsightsState {
  conversations: Record<string, InsightsConversation>;
  loadHistory: (teamId: string) => void;
  sendQuestion: (teamId: string, question: string) => Promise<void>;
  retryQuestion: (teamId: string) => Promise<void>;
  clearHistory: (teamId: string) => void;
}

function makeMessage(role: InsightsMessage['role'], content: string): InsightsMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    timestamp: new Date().toISOString(),
  };
}

function readHistory(teamId: string): InsightsMessage[] {
  try {
    const raw = localStorage.getItem(historyKey(teamId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InsightsMessage[]) : [];
  } catch {
    // Corrupt or unreadable entry — treat as empty; the next save overwrites it.
    return [];
  }
}

function writeHistory(teamId: string, messages: InsightsMessage[]): void {
  try {
    localStorage.setItem(historyKey(teamId), JSON.stringify(messages));
  } catch {
    // Storage full or unavailable — history is best-effort (R6), never fatal.
  }
}

// Map the endpoint error contract to a Spanish, user-facing message:
// 503 → config error (disables input, shows API-key notice — R5)
// 429 → retryable provider rate limit
// 404/400/401/500/502/network → generic error with retry
function mapInsightsError(error: unknown): { message: string; configError: boolean } {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const serverMessage = (error.response?.data as { error?: string } | undefined)?.error;

    if (status === 503) {
      return {
        message:
          serverMessage ??
          'El asistente de IA no está configurado. Configurá la API key de Gemini en el servidor para usar esta función.',
        configError: true,
      };
    }
    if (status === 429) {
      return {
        message: serverMessage ?? 'El proveedor de IA está temporalmente saturado. Intentá de nuevo en unos minutos.',
        configError: false,
      };
    }
    if (serverMessage) {
      return { message: serverMessage, configError: false };
    }
  }
  return {
    message: 'No se pudo obtener la respuesta. Intentá de nuevo.',
    configError: false,
  };
}

export const useInsightsStore = create<InsightsState>((set, get) => {
  // Shared tail of sendQuestion/retryQuestion: the user message is already in
  // the conversation; POST it and append the assistant answer or an error message.
  const postQuestion = async (teamId: string, question: string): Promise<void> => {
    try {
      const body: InsightsQueryRequest = { question };
      const response = await api.post<InsightsResponse>(`/teams/${teamId}/insights/query`, body);
      const answerMessage = makeMessage('assistant', response.data.answer);
      set((state) => {
        const messages = [...(state.conversations[teamId]?.messages ?? []), answerMessage];
        writeHistory(teamId, messages);
        return {
          conversations: {
            ...state.conversations,
            [teamId]: { messages, isLoading: false, error: null, configError: false },
          },
        };
      });
    } catch (error) {
      const { message, configError } = mapInsightsError(error);
      const errorMessage = makeMessage('error', message);
      set((state) => {
        const messages = [...(state.conversations[teamId]?.messages ?? []), errorMessage];
        writeHistory(teamId, messages);
        return {
          conversations: {
            ...state.conversations,
            [teamId]: { messages, isLoading: false, error: message, configError },
          },
        };
      });
    }
  };

  return {
    conversations: {},

    // Restore persisted history for a team when the tab opens (R6). Skips teams
    // already hydrated this session so tab remounts never duplicate messages.
    loadHistory: (teamId: string) => {
      const existing = get().conversations[teamId];
      if (existing && existing.messages.length > 0) return;
      const messages = readHistory(teamId);
      set((state) => ({
        conversations: {
          ...state.conversations,
          [teamId]: {
            ...(state.conversations[teamId] ?? EMPTY_CONVERSATION),
            messages,
          },
        },
      }));
    },

    sendQuestion: async (teamId: string, question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;
      const userMessage = makeMessage('user', trimmed);
      set((state) => {
        const messages = [...(state.conversations[teamId]?.messages ?? []), userMessage];
        writeHistory(teamId, messages);
        return {
          conversations: {
            ...state.conversations,
            [teamId]: { messages, isLoading: true, error: null, configError: false },
          },
        };
      });
      await postQuestion(teamId, trimmed);
    },

    // Retry the last user question (R7): drop trailing error messages, keep the
    // original user message, and re-post. The question itself is never lost.
    retryQuestion: async (teamId: string) => {
      const messages = get().conversations[teamId]?.messages ?? [];
      let lastUserIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          lastUserIndex = i;
          break;
        }
      }
      if (lastUserIndex === -1) return;
      const question = messages[lastUserIndex].content;
      const base = messages.slice(0, lastUserIndex + 1);
      set((state) => ({
        conversations: {
          ...state.conversations,
          [teamId]: { messages: base, isLoading: true, error: null, configError: false },
        },
      }));
      writeHistory(teamId, base);
      await postQuestion(teamId, question);
    },

    clearHistory: (teamId: string) => {
      localStorage.removeItem(historyKey(teamId));
      set((state) => ({
        conversations: {
          ...state.conversations,
          [teamId]: { messages: [], isLoading: false, error: null, configError: false },
        },
      }));
    },
  };
});
