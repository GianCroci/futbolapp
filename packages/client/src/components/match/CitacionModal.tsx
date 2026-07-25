import { useState, useMemo, useCallback } from 'react';
import { Modal } from '../common/Modal';

interface Player {
  name: string;
  dorsal: number | null;
  slotPosition: string;
}

interface CitacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  opponent: string | null;
  matchDate: string | null;
  players: Player[];
}

const DEFAULT_TEMPLATE = `⚽ *Jugadores convocados*

🆚 Rival: {rival}
📅 Fecha: {fecha}

📋 *Plantel:*
{plantel}

¡A prepararse que viene el partido! 💪`;

const AVAILABLE_VARS = [
  { key: '{rival}', desc: 'Rival' },
  { key: '{fecha}', desc: 'Fecha del partido' },
  { key: '{plantel}', desc: 'Lista de jugadores con dorsal y posición' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'A confirmar';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function buildPlantel(players: Player[]): string {
  return players
    .map((p) => `#${p.dorsal ?? '?'} ${p.name} (${p.slotPosition})`)
    .join('\n');
}

function fillTemplate(template: string, plantel: string, context: { rival: string; fecha: string }): string {
  return template
    .replace(/\{plantel\}/g, plantel)
    .replace(/\{rival\}/g, context.rival)
    .replace(/\{fecha\}/g, context.fecha);
}

export function CitacionModal({
  isOpen,
  onClose,
  opponent,
  matchDate,
  players,
}: CitacionModalProps) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [copied, setCopied] = useState(false);

  const context = useMemo(() => ({
    rival: opponent ?? 'A confirmar',
    fecha: formatDate(matchDate),
  }), [opponent, matchDate]);

  const plantel = useMemo(() => buildPlantel(players), [players]);

  const message = useMemo(
    () => fillTemplate(template, plantel, context),
    [template, plantel, context],
  );

  const insertVar = useCallback((varKey: string) => {
    setTemplate((prev) => prev + varKey);
  }, []);

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [message]);

  const shareWhatsApp = useCallback(() => {
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }, [message]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Citación">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Template editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje para el grupo
          </label>
          <textarea
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            rows={8}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono resize-y focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span className="text-xs text-gray-500 self-center mr-1">Insertar:</span>
            {AVAILABLE_VARS.map((v) => (
              <button
                key={v.key}
                onClick={() => insertVar(v.key)}
                title={v.desc}
                className="px-2 py-0.5 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 font-mono"
              >
                {v.key}
              </button>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Vista previa ({players.length} jugadores)
            </h4>
            <div className="flex items-center gap-1.5">
              <button
                onClick={copyMessage}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {copied ? '✓ Copiado' : 'Copiar mensaje'}
              </button>
              <button
                onClick={shareWhatsApp}
                className="px-3 py-1 text-xs bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
              >
                WhatsApp
              </button>
            </div>
          </div>

          <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans bg-gray-50 border border-gray-200 rounded-lg p-4">
            {message}
          </pre>
        </div>
      </div>
    </Modal>
  );
}
