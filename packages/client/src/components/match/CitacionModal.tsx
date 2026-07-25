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
  formationName: string;
  opponent: string | null;
  matchDate: string | null;
  formationType: string | null;
  players: Player[];
}

const DEFAULT_TEMPLATE = `⚽ *Citación - {formacion}*

Hola {nombre}! Sos parte del grupo para el partido:

🆚 Rival: {rival}
📅 Fecha: {fecha}
👕 Dorsal: #{dorsal}
📍 Posición: {posicion}

¡A darlo todo! 💪`;

const AVAILABLE_VARS = [
  { key: '{nombre}', desc: 'Nombre del jugador' },
  { key: '{dorsal}', desc: 'Dorsal' },
  { key: '{posicion}', desc: 'Posición en la formación' },
  { key: '{rival}', desc: 'Rival' },
  { key: '{fecha}', desc: 'Fecha del partido' },
  { key: '{formacion}', desc: 'Tipo de formación (4-3-3, etc.)' },
];

const FORMATION_LABELS: Record<string, string> = {
  F_4_4_2: '4-4-2', F_4_3_3: '4-3-3', F_3_5_2: '3-5-2',
  F_4_2_3_1: '4-2-3-1', F_5_3_2: '5-3-2', F_4_1_4_1: '4-1-4-1', F_3_4_3: '3-4-3',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'A confirmar';
  return new Date(dateStr).toLocaleDateString('es-AR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function fillTemplate(template: string, player: Player, context: { rival: string; fecha: string; formacion: string }): string {
  return template
    .replace(/\{nombre\}/g, player.name)
    .replace(/\{dorsal\}/g, player.dorsal?.toString() ?? '?')
    .replace(/\{posicion\}/g, player.slotPosition)
    .replace(/\{rival\}/g, context.rival)
    .replace(/\{fecha\}/g, context.fecha)
    .replace(/\{formacion\}/g, context.formacion);
}

export function CitacionModal({
  isOpen,
  onClose,
  formationName: _formationName,
  opponent,
  matchDate,
  formationType,
  players,
}: CitacionModalProps) {
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const context = useMemo(() => ({
    rival: opponent ?? 'A confirmar',
    fecha: formatDate(matchDate),
    formacion: (formationType && FORMATION_LABELS[formationType]) ?? formationType ?? 'Personalizado',
  }), [opponent, matchDate, formationType]);

  const previews = useMemo(
    () => players.map((p) => fillTemplate(template, p, context)),
    [players, template, context],
  );

  const insertVar = useCallback((varKey: string) => {
    setTemplate((prev) => prev + varKey);
  }, []);

  const copyOne = useCallback(async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback: select text
    }
  }, []);

  const copyAll = useCallback(async () => {
    const separator = '\n\n---\n\n';
    const full = previews.join(separator);
    try {
      await navigator.clipboard.writeText(full);
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  }, [previews]);

  const shareWhatsApp = useCallback((text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generar Citación">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto">
        {/* Template editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje personalizado
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

        {/* Previews */}
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">
              Vista previa ({players.length} jugadores)
            </h4>
            <button
              onClick={copyAll}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              {copiedIndex === -1 ? '✓ Copiado' : 'Copiar todos'}
            </button>
          </div>

          <div className="space-y-3">
            {players.map((player, i) => (
              <div
                key={`${player.slotPosition}-${player.name}`}
                className="border border-gray-200 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800">
                    #{player.dorsal ?? '?'} {player.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyOne(previews[i], i)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                    >
                      {copiedIndex === i ? '✓ Copiado' : 'Copiar'}
                    </button>
                    <button
                      onClick={() => shareWhatsApp(previews[i])}
                      className="px-2 py-1 text-xs bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                    >
                      WhatsApp
                    </button>
                  </div>
                </div>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans bg-gray-50 rounded p-2">
                  {previews[i]}
                </pre>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
