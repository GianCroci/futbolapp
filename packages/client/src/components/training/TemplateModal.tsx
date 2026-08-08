import { useState, useEffect, FormEvent } from 'react';
import { Trash2, X } from 'lucide-react';
import { FieldDiagram, ExerciseTemplate } from '../../types';
import { useTemplateStore } from '../../store/templateStore';

interface TemplateModalProps {
  isOpen: boolean;
  currentDiagram: FieldDiagram;
  onClose: () => void;
  onLoadTemplate: (diagram: FieldDiagram) => void;
}

export function TemplateModal({ isOpen, currentDiagram, onClose, onLoadTemplate }: TemplateModalProps) {
  const { templates, isLoading, fetchTemplates, createTemplate, deleteTemplate } = useTemplateStore();
  const [tab, setTab] = useState<'save' | 'load'>('load');
  const [templateName, setTemplateName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmLoad, setConfirmLoad] = useState<ExerciseTemplate | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, fetchTemplates]);

  if (!isOpen) return null;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;
    setSaveError(null);
    try {
      await createTemplate({
        name: templateName.trim(),
        diagram: currentDiagram,
      });
      setTemplateName('');
      setTab('load');
    } catch {
      setSaveError('Error al guardar la plantilla');
    }
  };

  const handleLoad = (template: ExerciseTemplate) => {
    onLoadTemplate(template.diagram);
    onClose();
  };

  const handleLoadClick = (template: ExerciseTemplate) => {
    if (currentDiagram.items.length > 0) {
      setConfirmLoad(template);
    } else {
      handleLoad(template);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteTemplate(id);
    } catch {
      // Silently fail — the store handles error state
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Plantillas de ejercicio</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setTab('load')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors
              ${tab === 'load'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Cargar
          </button>
          <button
            type="button"
            onClick={() => setTab('save')}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-center transition-colors
              ${tab === 'save'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            Guardar
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 relative">
          {tab === 'save' ? (
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de la plantilla
                </label>
                <input
                  id="template-name"
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="Ej: Pase en corto, Rondo 4x2..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  autoFocus
                />
              </div>
              {saveError && (
                <p className="text-sm text-red-600">{saveError}</p>
              )}
              <button
                type="submit"
                disabled={!templateName.trim() || isLoading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Guardando...' : 'Guardar plantilla'}
              </button>
            </form>
          ) : (
            <div className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {isLoading ? 'Cargando...' : 'No hay plantillas guardadas'}
                </p>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleLoadClick(template)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 border border-gray-200 transition-colors"
                  >
                    <span className="text-sm font-medium text-gray-900">{template.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(template.id, e)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                  </button>
                ))
              )}
            </div>
          )}

          {/* Confirmation overlay */}
          {confirmLoad && (
            <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 rounded-b-2xl">
              <div className="text-center p-6">
                <p className="text-sm text-gray-700 mb-4">
                  ¿Cargar plantilla? Se reemplazarán los {currentDiagram.items.length} elemento{currentDiagram.items.length !== 1 ? 's' : ''} actuales.
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      handleLoad(confirmLoad);
                      setConfirmLoad(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                  >
                    Cargar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmLoad(null)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
