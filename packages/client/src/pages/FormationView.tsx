import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useFormationStore, SlotAssignment } from '../store/formationStore';
import { useMatchEventStore } from '../store/matchEventStore';
import { getPresetPositions } from '../utils/formationPresets';
import { EventForm } from '../components/match/EventForm';
import { EventList } from '../components/match/EventList';

export function FormationViewPage() {
  const { teamId, formationId } = useParams<{ teamId: string; formationId: string }>();
  const navigate = useNavigate();
  const { currentFormation, isLoading, fetchFormation } = useFormationStore();
  const { events, fetchEvents } = useMatchEventStore();
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [editOpponent, setEditOpponent] = useState('');
  const [editScoreHome, setEditScoreHome] = useState('');
  const [editScoreAway, setEditScoreAway] = useState('');
  const [editMatchDate, setEditMatchDate] = useState('');

  const [slots, setSlots] = useState<SlotAssignment[]>([]);

  useEffect(() => {
    if (teamId && formationId) fetchFormation(teamId, formationId);
  }, [teamId, formationId, fetchFormation]);

  useEffect(() => {
    if (teamId && formationId) fetchEvents(teamId, formationId);
  }, [teamId, formationId, fetchEvents]);

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

      {/* Pitch view */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl aspect-[3/4] rounded-xl overflow-hidden shadow-inner">
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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Jugadores titulares</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {slots
            .filter((s) => s.playerId)
            .map((slot) => (
              <div
                key={slot.slotPosition}
                className="flex items-center gap-3 px-3 py-2 bg-white rounded-lg border border-gray-200"
              >
                <span className="w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-bold font-mono">
                  {slot.playerDorsal ?? '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {slot.playerName || slot.slotPosition}
                  </p>
                  <p className="text-xs text-gray-400">{slot.slotPosition}</p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Match Events */}
      <div className="mt-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Eventos del partido</h3>
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
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <EventList
            events={events}
            teamId={teamId!}
            formationId={formationId!}
            playerNames={playerNames}
          />
        </div>
      </div>

      <EventForm
        isOpen={isEventFormOpen}
        onClose={() => setIsEventFormOpen(false)}
        teamId={teamId!}
        formationId={formationId!}
        players={currentFormation.players}
      />
    </AppLayout>
  );
}
