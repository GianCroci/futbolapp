import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { AppLayout } from '../../layout/AppLayout';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FormationToolbar } from './FormationToolbar';
import { FootballPitch } from './FootballPitch';
import { Roster } from './Roster';
import { useFormationStore, SlotAssignment } from '../../../store/formationStore';
import { usePlayerStore } from '../../../store/playerStore';
import { Player } from '../../../types';
import { getPresetPositions, FORMATION_PRESETS } from '../../../utils/formationPresets';
import { DraggablePlayer } from './DraggablePlayer';

export function FormationBuilderPage() {
  const { teamId, formationId } = useParams<{ teamId: string; formationId?: string }>();
  const navigate = useNavigate();

  const { players, fetchPlayers } = usePlayerStore();
  const { currentFormation, createFormation, updateFormation, fetchFormation } = useFormationStore();

  // Builder state
  const [name, setName] = useState('');
  const [formationType, setFormationType] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotAssignment[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDragPlayer, setActiveDragPlayer] = useState<Player | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!formationId;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Load players and optional existing formation
  useEffect(() => {
    async function load() {
      if (!teamId) return;
      setIsLoading(true);
      await fetchPlayers(teamId);

      if (formationId) {
        await fetchFormation(teamId, formationId);
      }

      setIsLoading(false);
    }
    load();
  }, [teamId, formationId, fetchPlayers, fetchFormation]);

  // When currentFormation loads (edit mode), populate the builder
  useEffect(() => {
    if (currentFormation && isEditing) {
      setName(currentFormation.name);
      const ft = currentFormation.formationType;
      setFormationType(ft || null);

      // Build slots from saved formation players
      const pos = ft ? getPresetPositions(ft) : getPresetPositions(null);
      const savedSlots: SlotAssignment[] = pos.map((p) => {
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
      setSlots(savedSlots);
    } else if (!isEditing) {
      // Fresh builder: empty slots for 4-4-2
      const positions = getPresetPositions(null);
      setSlots(
        positions.map((p) => ({
          slotPosition: p.slotPosition,
          positionX: p.positionX,
          positionY: p.positionY,
          playerId: null,
        }))
      );
    }
  }, [currentFormation, isEditing]);

  const handleFormationTypeChange = useCallback((ft: string | null) => {
    setFormationType(ft);
    const positions = getPresetPositions(ft);
    setSlots((prev) =>
      positions.map((p) => {
        const existing = prev.find((s) => s.slotPosition === p.slotPosition);
        if (existing?.playerId) {
          // Preserve player assignment if slot position matches
          return {
            ...p,
            playerId: existing.playerId,
            playerName: existing.playerName,
            playerDorsal: existing.playerDorsal,
          };
        }
        return {
          slotPosition: p.slotPosition,
          positionX: p.positionX,
          positionY: p.positionY,
          playerId: null,
        };
      })
    );
    setSelectedSlot(null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragPlayer(null);
      const { active, over } = event;
      if (!over) return;

      const playerData = active.data.current?.player as Player | undefined;
      if (!playerData) return;

      const targetId = over.id as string;
      if (!targetId.startsWith('slot-')) return;

      const slotPosition = targetId.replace('slot-', '');

      setSlots((prev) => {
        const existingPlayerSlot = prev.find(
          (s) => s.playerId === playerData.id
        );
        if (existingPlayerSlot) {
          // Player already in a slot — swap or remove from old slot
          const targetSlot = prev.find((s) => s.slotPosition === slotPosition);
          if (targetSlot?.playerId) {
            // Swap: move existing player out, put new player in
            return prev.map((s) => {
              if (s.slotPosition === slotPosition) {
                return {
                  ...s,
                  playerId: playerData.id,
                  playerName: playerData.name,
                  playerDorsal: playerData.dorsal,
                };
              }
              if (s.playerId === playerData.id) {
                return {
                  ...s,
                  playerId: null,
                  playerName: undefined,
                  playerDorsal: undefined,
                };
              }
              return s;
            });
          }
          // Move player from one slot to another
          return prev.map((s) => {
            if (s.slotPosition === slotPosition) {
              return {
                ...s,
                playerId: playerData.id,
                playerName: playerData.name,
                playerDorsal: playerData.dorsal,
              };
            }
            if (s.playerId === playerData.id) {
              return { ...s, playerId: null, playerName: undefined, playerDorsal: undefined };
            }
            return s;
          });
        }

        // Assign player to empty slot
        return prev.map((s) =>
          s.slotPosition === slotPosition && !s.playerId
            ? { ...s, playerId: playerData.id, playerName: playerData.name, playerDorsal: playerData.dorsal }
            : s
        );
      });
    },
    []
  );

  const handleSlotClick = useCallback((slotPosition: string) => {
    setSelectedSlot((prev) => (prev === slotPosition ? null : slotPosition));
  }, []);

  const handleRosterPlayerClick = useCallback(
    (player: Player) => {
      // If a slot is selected, assign the player to it
      if (selectedSlot) {
        setSlots((prev) => {
          // Remove player from any other slot first
          const withoutPlayer = prev.map((s) =>
            s.playerId === player.id
              ? { ...s, playerId: null as string | null, playerName: undefined, playerDorsal: undefined }
              : s
          );
          // Assign to selected slot
          return withoutPlayer.map((s) =>
            s.slotPosition === selectedSlot
              ? { ...s, playerId: player.id, playerName: player.name, playerDorsal: player.dorsal }
              : s
          );
        });
        setSelectedSlot(null);
      }
    },
    [selectedSlot]
  );

  const handleRemoveFromSlot = useCallback((slotPosition: string) => {
    setSlots((prev) =>
      prev.map((s) =>
        s.slotPosition === slotPosition
          ? { ...s, playerId: null as string | null, playerName: undefined, playerDorsal: undefined }
          : s
      )
    );
    setSelectedSlot(null);
  }, []);

  const handleClear = useCallback(() => {
    setSlots((prev) =>
      prev.map((s) => ({
        ...s,
        playerId: null as string | null,
        playerName: undefined,
        playerDorsal: undefined,
      }))
    );
    setSelectedSlot(null);
  }, []);

  const handleSave = async () => {
    if (!teamId || !name.trim()) return;
    setIsSaving(true);
    setError(null);

    const playersData = slots
      .filter((s) => s.playerId)
      .map((s) => ({
        playerId: s.playerId!,
        positionX: s.positionX,
        positionY: s.positionY,
        slotPosition: s.slotPosition,
      }));

    try {
      if (isEditing && formationId) {
        await updateFormation(teamId, formationId, {
          name: name.trim(),
          formationType,
          players: playersData,
        });
      } else {
        await createFormation(teamId, {
          name: name.trim(),
          formationType,
          players: playersData,
        });
      }
      navigate(`/teams/${teamId}`);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Error al guardar')
          : 'Error al guardar';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const assignedPlayerIds = new Set(
    slots.filter((s) => s.playerId).map((s) => s.playerId!)
  );
  const playerCount = assignedPlayerIds.size;

  // Handle right-click / double-click to remove from slot
  const handleSlotContext = useCallback(
    (e: React.MouseEvent, slotPosition: string) => {
      e.preventDefault();
      const slot = slots.find((s) => s.slotPosition === slotPosition);
      if (slot?.playerId) {
        handleRemoveFromSlot(slotPosition);
      }
    },
    [slots, handleRemoveFromSlot]
  );

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-4">
        <button
          onClick={() => navigate(`/teams/${teamId}`)}
          className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al equipo
        </button>
      </div>

      {/* Toolbar */}
      <FormationToolbar
        name={name}
        onNameChange={setName}
        selectedFormation={formationType}
        onFormationChange={handleFormationTypeChange}
        onSave={handleSave}
        onClear={handleClear}
        isSaving={isSaving}
        isEditing={isEditing}
        playerCount={playerCount}
      />

      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Instructions */}
      <div className="mx-4 mt-3 text-xs text-gray-400 flex gap-4">
        <span>🖱️ Arrastrá jugadores a la cancha</span>
        <span>👆 Hacé click en un espacio y luego en un jugador</span>
        <span>🔄 Click derecho en un jugador en cancha para quitarlo</span>
        {selectedSlot && (
          <span className="text-green-600 font-medium">
            ➡️ Seleccioná un jugador de la lista para colocarlo en la posición destacada
          </span>
        )}
      </div>

      {/* Builder area */}
      <div className="flex flex-col md:flex-row gap-4 p-4 flex-1">
        {/* Pitch */}
        <DndContext
          sensors={sensors}
          onDragStart={(event) => {
            const playerData = event.active.data.current?.player as Player | undefined;
            if (playerData) setActiveDragPlayer(playerData);
          }}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1">
            <FootballPitch
              slots={slots}
              selectedSlot={selectedSlot}
              onSlotClick={handleSlotClick}
            >
              <DragOverlay>
                {activeDragPlayer ? (
                  <div className="w-14 h-14 rounded-full bg-green-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    {activeDragPlayer.name.split(' ').pop()}
                  </div>
                ) : null}
              </DragOverlay>
            </FootballPitch>
          </div>
        </DndContext>

        {/* Roster sidebar */}
        <div className="w-full md:w-72 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col max-h-[600px]">
          <div className="p-3 border-b border-gray-200 bg-gray-50 rounded-t-xl">
            <h3 className="text-sm font-semibold text-gray-700">Jugadores disponibles</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {playerCount} en cancha · {players.length - playerCount} disponibles
            </p>
          </div>

          {/* Right-click context: selected slot */}
          {selectedSlot && (() => {
            const slot = slots.find((s) => s.slotPosition === selectedSlot);
            return slot?.playerId ? (
              <div className="px-3 py-2 bg-yellow-50 border-b border-yellow-200">
                <p className="text-xs text-yellow-700">
                  Posición: <strong>{selectedSlot}</strong>
                </p>
                <button
                  onClick={() => handleRemoveFromSlot(selectedSlot)}
                  className="text-xs text-red-600 hover:text-red-800 underline mt-1"
                >
                  Quitar jugador de esta posición
                </button>
              </div>
            ) : (
              <div className="px-3 py-2 bg-green-50 border-b border-green-200">
                <p className="text-xs text-green-700">
                  Posición destacada: <strong>{selectedSlot}</strong>
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Hacé click en un jugador abajo para asignarlo
                </p>
              </div>
            );
          })()}

          <Roster
            players={players}
            assignedPlayerIds={assignedPlayerIds}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onPlayerClick={handleRosterPlayerClick}
          />
        </div>
      </div>
    </AppLayout>
  );
}
