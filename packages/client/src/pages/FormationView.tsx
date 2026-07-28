import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useFormationStore, SlotAssignment } from '../store/formationStore';
import { useMatchEventStore } from '../store/matchEventStore';
import { useSubstitutionStore } from '../store/substitutionStore';
import { getPresetPositions } from '../utils/formationPresets';
import { exportFormationPdf } from '../utils/pdfExport';
import { EventForm } from '../components/match/EventForm';
import { EventList } from '../components/match/EventList';
import { SubstitutionModal } from '../components/match/SubstitutionModal';
import { CitacionModal } from '../components/match/CitacionModal';

export function FormationViewPage() {
  const { teamId, formationId } = useParams<{ teamId: string; formationId: string }>();
  const navigate = useNavigate();
  const { currentFormation, isLoading, fetchFormation, updatePlayerRating, updateComments } = useFormationStore();
  const { events, fetchEvents } = useMatchEventStore();
  const { substitutions, fetchSubstitutions, deleteSubstitution } = useSubstitutionStore();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isSubstitutionModalOpen, setIsSubstitutionModalOpen] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editOpponent, setEditOpponent] = useState('');
  const [editScoreHome, setEditScoreHome] = useState('');
  const [editScoreAway, setEditScoreAway] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');
  const [commentsText, setCommentsText] = useState('');
  const [isEditingComments, setIsEditingComments] = useState(false);
  const [isSavingComments, setIsSavingComments] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isCitacionOpen, setIsCitacionOpen] = useState(false);
  const pitchRef = useRef<HTMLDivElement>(null);

  const [slots, setSlots] = useState<SlotAssignment[]>([]);

  useEffect(() => {
    if (teamId && formationId) fetchFormation(teamId, formationId);
  }, [teamId, formationId, fetchFormation]);

  useEffect(() => {
    if (teamId && formationId) fetchEvents(teamId, formationId);
  }, [teamId, formationId, fetchEvents]);

  useEffect(() => {
    if (teamId && formationId) fetchSubstitutions(teamId, formationId);
  }, [teamId, formationId, fetchSubstitutions]);

  useEffect(() => {
    if (currentFormation) {
      const ft = currentFormation.formationType;
      const positions = ft ? getPresetPositions(ft) : getPresetPositions(null);
      const viewSlots: SlotAssignment[] = positions.map((p) => {
        const fp = currentFormation.players.find(
          (fp) => fp.slotPosition === p.slotPosition
        );
        return {
          slotPosition: p.slotPosition,
          positionX: fp?.positionX ?? p.positionX,
          positionY: fp?.positionY ?? p.positionY,
          playerId: fp?.playerId || null,
          playerName: (fp?.player as { name: string; dorsal: number | null } | undefined)?.name,
          playerDorsal: (fp?.player as { name: string; dorsal: number | null } | undefined)?.dorsal,
        };
      });
      setSlots(viewSlots);
    }
  }, [currentFormation]);

  const playerNames = useMemo(() => {
    if (!currentFormation) return {};
    const map: Record<string, string> = {};
    for (const fp of currentFormation.players) {
      if (fp.player) {
        map[fp.playerId] = fp.player.name;
      }
    }
    return map;
  }, [currentFormation]);

  const enteredPlayerIds = useMemo(
    () => new Set(substitutions.map((s) => s.playerInId)),
    [substitutions],
  );

  const starters = useMemo(
    () => currentFormation?.players.filter((fp) => !fp.isSubstitute) ?? [],
    [currentFormation]
  );

  const substitutes = useMemo(
    () => currentFormation?.players.filter((fp) => fp.isSubstitute) ?? [],
    [currentFormation]
  );

  const hasSubstitutes = substitutes.length > 0;

  const handleDeleteSubstitution = async (subId: string) => {
    if (!teamId || !formationId) return;
    await deleteSubstitution(teamId, formationId, subId);
  };

  const getFormationLabel = (ft: string | null): string => {
    if (!ft) return 'Personalizado';
    const labels: Record<string, string> = {
      F_4_4_2: '4-4-2',
      F_4_3_3: '4-3-3',
      F_3_5_2: '3-5-2',
      F_4_2_3_1: '4-2-3-1',
      F_5_3_2: '5-3-2',
      F_4_1_4_1: '4-1-4-1',
      F_3_4_3: '3-4-3',
    };
    return labels[ft] || ft;
  };

  const startEditingMetadata = () => {
    setEditOpponent(currentFormation?.opponent ?? '');
    setEditScoreHome(currentFormation?.scoreHome?.toString() ?? '');
    setEditScoreAway(currentFormation?.scoreAway?.toString() ?? '');
    setEditMatchDate(currentFormation?.matchDate ? new Date(currentFormation.matchDate).toISOString().split('T')[0] : '');
    setIsEditingMetadata(true);
  };

  const saveMetadata = async () => {
    if (!teamId || !formationId) return;
    try {
      const response = await fetch(`/api/teams/${teamId}/formations/${formationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: editOpponent || null,
          scoreHome: editScoreHome ? parseInt(editScoreHome, 10) : null,
          scoreAway: editScoreAway ? parseInt(editScoreAway, 10) : null,
          matchDate: editMatchDate || null,
        }),
      });
      if (response.ok) {
        fetchFormation(teamId, formationId);
        setIsEditingMetadata(false);
      }
    } catch (err) {
      console.error('Error updating metadata:', err);
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (!currentFormation || isExporting) return;
    setIsExporting(true);
    try {
      await exportFormationPdf(
        currentFormation,
        events,
        substitutions,
        playerNames,
        pitchRef.current,
      );
    } catch (err) {
      console.error('Error exporting PDF:', err);
    } finally {
      setIsExporting(false);
    }
  }, [currentFormation, events, substitutions, playerNames, isExporting]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  if (!currentFormation) {
    return (
      <AppLayout>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Formación no encontrada</h2>
          <button
            onClick={() => navigate(`/teams/${teamId}`)}
            className="text-green-600 hover:underline"
          >
            Volver al equipo
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <button
          onClick={() => navigate(`/teams/${teamId}/formations`)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a formaciones
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{currentFormation.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
              <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {getFormationLabel(currentFormation.formationType)}
              </span>
              <span>
                {new Date(currentFormation.date).toLocaleDateString('es-AR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {/* Match metadata - editable */}
            {isEditingMetadata ? (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <input
                  type="text"
                  value={editOpponent}
                  onChange={(e) => setEditOpponent(e.target.value)}
                  placeholder="Rival"
                  className="w-32 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  value={editScoreHome}
                  onChange={(e) => setEditScoreHome(e.target.value)}
                  placeholder="Goles local"
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <span>-</span>
                <input
                  type="number"
                  min={0}
                  value={editScoreAway}
                  onChange={(e) => setEditScoreAway(e.target.value)}
                  placeholder="Goles rival"
                  className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <input
                  type="date"
                  value={editMatchDate}
                  onChange={(e) => setEditMatchDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm"
                />
                <button
                  onClick={saveMetadata}
                  className="px-2 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setIsEditingMetadata(false)}
                  className="px-2 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-2">
                {currentFormation.scoreHome != null && currentFormation.scoreAway != null && (
                  <span className="text-lg font-bold text-gray-800">
                    {currentFormation.scoreHome} - {currentFormation.scoreAway}
                  </span>
                )}
                {currentFormation.opponent && (
                  <span className="text-sm text-gray-600">vs {currentFormation.opponent}</span>
                )}
                {currentFormation.matchDate && (
                  <span className="text-xs text-gray-400">
                    {new Date(currentFormation.matchDate).toLocaleDateString('es-AR')}
                  </span>
                )}
                <button
                  onClick={startEditingMetadata}
                  className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                >
                  Editar datos del partido
                </button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCitacionOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Generar Citación
            </button>
            <button
              onClick={handleExportPdf}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isExporting ? 'Exportando...' : 'Exportar PDF'}
            </button>
            <button
              onClick={() => navigate(`/teams/${teamId}/formations/edit/${formationId}`)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Editar
            </button>
          </div>
        </div>
      </div>

      {/* Pitch view */}
      <div className="flex justify-center">
        <div ref={pitchRef} className="relative w-full max-w-2xl aspect-[3/4] rounded-xl overflow-hidden shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-b from-green-600 via-green-500 to-green-700">
            <div className="absolute inset-[8%] border-2 border-white/30 rounded-lg" />
            <div className="absolute top-[50%] left-[8%] right-[8%] border-t-2 border-white/30" />
            <div className="absolute top-[8%] bottom-[8%] left-[50%] border-l-2 border-white/30" />
            <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
            <div className="absolute top-0 left-[25%] right-[25%] h-[8%] border-2 border-white/30 border-t-0 rounded-b-sm" />
            <div className="absolute bottom-0 left-[25%] right-[25%] h-[8%] border-2 border-white/30 border-b-0 rounded-t-sm" />
            <div className="absolute top-0 left-[38%] right-[38%] h-[4%] border-2 border-white/30 border-t-0" />
            <div className="absolute bottom-0 left-[38%] right-[38%] h-[4%] border-2 border-white/30 border-b-0" />
          </div>

          {slots.map((slot) => (
            <div
              key={slot.slotPosition}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.positionX}%`, top: `${slot.positionY}%` }}
            >
              <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 border-white bg-green-700/90 text-white shadow-md">
                {slot.playerDorsal && (
                  <span className="text-[10px] leading-none font-mono opacity-80">
                    {slot.playerDorsal}
                  </span>
                )}
                <span className="text-xs font-bold leading-tight truncate max-w-[52px]">
                  {slot.playerName?.split(' ').pop() || ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Players list */}
      <div className="mt-8 max-w-2xl mx-auto">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Jugadores</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {currentFormation.players
            .filter((fp) => {
              if (!fp.player) return false;
              if (!fp.isSubstitute) return true;
              return enteredPlayerIds.has(fp.playerId);
            })
            .map((fp) => {
              const playerName = (fp.player as { name: string })?.name ?? fp.playerId;
              const dorsal = (fp.player as { dorsal: number | null })?.dorsal;
              const rating = fp.rating;
              const enteredSub = substitutions.find((s) => s.playerInId === fp.playerId);
              const didPlay = !fp.isSubstitute || !!enteredSub;
              return (
                <div
                  key={fp.id}
                  className={`px-3 py-2 bg-white rounded-lg border ${didPlay ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-7 h-7 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold font-mono">
                      {dorsal ?? '?'}
                    </span>
                    <span className="text-sm font-medium text-gray-800 truncate">
                      {playerName}
                    </span>
                    {fp.isSubstitute && enteredSub && (
                      <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                        Ing. min {enteredSub.minute}
                      </span>
                    )}
                  </div>
                  {didPlay ? (
                    <div className="flex items-center gap-1 pl-9">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onClick={() => {
                            if (!teamId || !formationId) return;
                            updatePlayerRating(teamId, formationId, fp.playerId, n === rating ? null : n);
                          }}
                          className={`w-5 h-5 rounded text-[10px] font-medium transition-colors ${
                            n === rating
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 pl-9">No ingresó al partido</p>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Match Events */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Eventos del partido</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSubstitutionModalOpen(true)}
              disabled={!hasSubstitutes}
              title={hasSubstitutes ? 'Registrar sustitución' : 'No hay suplentes designados'}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Registrar sustitución
            </button>
            <button
              onClick={() => setIsEventFormOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar evento
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {/* Substitutions list */}
          {substitutions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Sustituciones
              </h4>
              <div className="space-y-2">
                {substitutions.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-amber-700 bg-amber-50"
                  >
                    <span className="text-lg">🔄</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        Min {sub.minute}: {playerNames[sub.playerOutId] ?? 'Jugador'} sale →{' '}
                        {playerNames[sub.playerInId] ?? 'Jugador'} entra
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSubstitution(sub.id)}
                      className="p-1 opacity-50 hover:opacity-100 transition-opacity"
                      title="Eliminar sustitución"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <EventList
            events={events}
            teamId={teamId!}
            formationId={formationId!}
            playerNames={playerNames}
          />
        </div>
      </div>

      {/* DT Comments / Analysis */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Análisis del DT</h3>
          {!isEditingComments && (
            <button
              onClick={() => {
                setCommentsText(currentFormation.comments || '');
                setIsEditingComments(true);
              }}
              className="px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
            >
              {currentFormation.comments ? 'Editar' : 'Agregar análisis'}
            </button>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          {isEditingComments ? (
            <div>
              <textarea
                value={commentsText}
                onChange={(e) => setCommentsText(e.target.value)}
                placeholder="Escribí tu análisis del partido: qué funcionó, qué no, jugadas clave, ajustes para el próximo partido..."
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-y focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={async () => {
                    if (!teamId || !formationId) return;
                    setIsSavingComments(true);
                    try {
                      await updateComments(teamId, formationId, commentsText.trim() || null);
                      setIsEditingComments(false);
                    } finally {
                      setIsSavingComments(false);
                    }
                  }}
                  disabled={isSavingComments}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {isSavingComments ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={() => setIsEditingComments(false)}
                  className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : currentFormation.comments ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentFormation.comments}</p>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin análisis registrado</p>
          )}
        </div>
      </div>

      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        teamId={teamId!}
        formationId={formationId!}
        players={currentFormation.players}
      />

      <SubstitutionModal
        isOpen={isSubstitutionModalOpen}
        onClose={() => setIsSubstitutionModalOpen(false)}
        teamId={teamId!}
        formationId={formationId!}
        starters={starters}
        substitutes={substitutes}
      />

      <CitacionModal
        isOpen={isCitacionOpen}
        onClose={() => setIsCitacionOpen(false)}
        opponent={currentFormation.opponent ?? null}
        matchDate={currentFormation.matchDate ?? null}
        players={currentFormation.players.map((fp) => ({
          name: (fp.player as { name: string } | undefined)?.name ?? fp.playerId,
          dorsal: (fp.player as { dorsal: number | null } | undefined)?.dorsal ?? null,
          slotPosition: fp.isSubstitute ? `${fp.slotPosition} (suplente)` : fp.slotPosition,
        }))}
      />
    </AppLayout>
  );
}
