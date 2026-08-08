import { FormEvent, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Send, Sparkles, Trash2 } from 'lucide-react';
import { useInsightsStore, EMPTY_CONVERSATION } from '../../store/insightsStore';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { EmptyState } from '../common/EmptyState';
import type { InsightsMessage } from '../../types';

interface InsightsTabProps {
  teamId: string;
}

// R9: mirrors the server-side question limit (routes/insights.ts MAX_QUESTION_LENGTH).
const MAX_QUESTION_LENGTH = 1000;

// R8: privacy disclosure — questions and aggregated team data leave the device.
const DISCLOSURE_COPY = 'Las preguntas y los datos del equipo se envían a un proveedor de IA externo.';

const SUGGESTED_QUESTIONS = [
  '¿Qué dupla de centrales tuvo mejores resultados?',
  '¿Qué línea ofensiva marcó más goles?',
  '¿Cuál fue el resultado del equipo por formación?',
];

export function InsightsTab({ teamId }: InsightsTabProps) {
  const conversation = useInsightsStore((s) => s.conversations[teamId] ?? EMPTY_CONVERSATION);
  const loadHistory = useInsightsStore((s) => s.loadHistory);
  const sendQuestion = useInsightsStore((s) => s.sendQuestion);
  const retryQuestion = useInsightsStore((s) => s.retryQuestion);
  const clearHistory = useInsightsStore((s) => s.clearHistory);

  const { messages, isLoading, configError } = conversation;

  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // R6: restore persisted per-team history when the tab opens.
  useEffect(() => {
    loadHistory(teamId);
  }, [teamId, loadHistory]);

  // Keep the newest message visible while answering.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, isLoading]);

  const canSend = !isLoading && !configError && input.trim().length > 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || configError) return;
    setInput('');
    void sendQuestion(teamId, trimmed);
  };

  const handleClear = () => {
    clearHistory(teamId);
    setInput('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Sparkles className="w-4 h-4 text-green-600" />
          Análisis con IA
        </h3>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Borrar historial
          </button>
        )}
      </div>

      {/* R5: configuration notice — no key configured, asking is disabled */}
      {configError && (
        <div className="flex items-start gap-2.5 mx-5 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            El asistente de IA no está configurado. Configurá la API key de Gemini en el servidor para
            habilitar esta función.
          </p>
        </div>
      )}

      {/* Conversation */}
      <div ref={listRef} className="max-h-96 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-10 h-10 text-green-600" />}
            title="Preguntale a la IA sobre tu equipo"
            message="Analizá el rendimiento de tus jugadores, formaciones y resultados con la ayuda de la IA."
          />
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                showRetry={message.role === 'error' && !configError}
                onRetry={() => void retryQuestion(teamId)}
              />
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5">
                  <LoadingSpinner size="sm" />
                  <span className="text-sm text-gray-500">Analizando…</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Suggested questions (only for an empty conversation) */}
      {messages.length === 0 && (
        <div className="px-5 pb-4 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              onClick={() => setInput(question)}
              disabled={isLoading || configError}
              className="text-xs text-green-700 bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-full px-3 py-1.5 transition-colors"
            >
              {question}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX_QUESTION_LENGTH}
            placeholder="Escribí una pregunta sobre el equipo…"
            disabled={isLoading || configError}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none disabled:bg-gray-50 disabled:text-gray-400"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="flex items-center gap-1.5 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium shrink-0"
          >
            <Send className="w-4 h-4" />
            Enviar
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          {input.length > 0 && (
            <span className="text-xs text-gray-400">
              {input.length}/{MAX_QUESTION_LENGTH}
            </span>
          )}
          {/* R8: privacy disclosure */}
          <span className="text-xs text-gray-400 ml-auto">{DISCLOSURE_COPY}</span>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({
  message,
  showRetry,
  onRetry,
}: {
  message: InsightsMessage;
  showRetry: boolean;
  onRetry: () => void;
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-green-600 text-white rounded-2xl rounded-br-md px-4 py-2.5 max-w-[80%] whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  if (message.role === 'error') {
    return (
      <div className="flex justify-center">
        <div className="flex items-start gap-2.5 w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="whitespace-pre-wrap">{message.content}</p>
            {showRetry && (
              <button
                onClick={onRetry}
                className="mt-2 text-xs font-medium text-red-700 underline hover:text-red-800"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // assistant
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-2.5 max-w-[85%] text-gray-800 whitespace-pre-wrap">
        {message.content}
      </div>
    </div>
  );
}
