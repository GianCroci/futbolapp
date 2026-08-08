export interface User {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}

export interface Team {
  id: string;
  name: string;
  userId: string;
  playerCount?: number;
  formationCount?: number;
  createdAt: string;
  _count?: {
    players: number;
    formations: number;
  };
}

export interface Player {
  id: string;
  name: string;
  position: string;
  dorsal: number | null;
  teamId: string;
}

export interface Formation {
  id: string;
  name: string;
  date: string;
  formationType: string | null;
  teamId: string;
  players?: FormationPlayer[];
  matchDate?: string | null;
  scoreHome?: number | null;
  scoreAway?: number | null;
  opponent?: string | null;
  comments?: string | null;
}

export interface FormationPlayer {
  id: string;
  playerId: string;
  positionX: number;
  positionY: number;
  slotPosition: string;
  player?: Player;
  isSubstitute?: boolean;
  subInMinute?: number | null;
  subOutMinute?: number | null;
  rating?: number | null;
}

// Match Event Types
export type MatchEventType = 'GOAL' | 'ASSIST' | 'YELLOW_CARD' | 'RED_CARD' | 'SUB_IN' | 'SUB_OUT';

export interface MatchEvent {
  id: string;
  formationId: string;
  playerId: string;
  eventType: MatchEventType;
  minute: number | null;
  createdAt: string;
}

// Player Stats
export interface PlayerStat {
  playerId: string;
  playerName: string;
  position: string;
  dorsal: number | null;
  totalMinutes: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
  avgRating: number | null;
}

// Substitution
export interface Substitution {
  id: string;
  formationId: string;
  playerOutId: string;
  playerInId: string;
  minute: number;
  createdAt: string;
  playerOut?: Player;
  playerIn?: Player;
}

// Fixture
export interface FixtureEntry {
  id: string;
  teamId: string;
  matchDay: number | null;
  date: string | null;
  opponent: string;
  location: string | null;
  scoreHome: number | null;
  scoreAway: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FixtureData {
  entries: FixtureEntry[];
  fixtureImage: string | null;
}

export interface Injury {
  id: string;
  playerId: string;
  playerName?: string;
  teamId: string;
  injuryType: string;
  incidentDate: string;
  recoveryDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInjuryPayload {
  playerId: string;
  injuryType: string;
  incidentDate: string;
  recoveryDate?: string;
  notes?: string;
}

export interface UpdateInjuryPayload {
  playerId?: string;
  injuryType?: string;
  incidentDate?: string;
  recoveryDate?: string | null;
  notes?: string | null;
}

// Training
export interface TrainingSession {
  id: string;
  userId: string;
  name: string;
  date: string;
  generalNotes: string | null;
  diagram?: FieldDiagram | null;
  stages?: TrainingStage[];
  _count?: { stages: number };
  createdAt: string;
  updatedAt: string;
}

export interface TrainingStage {
  id: string;
  sessionId: string;
  name: string;
  order: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingSessionPayload {
  name: string;
  date: string;
  generalNotes?: string | null;
}

export interface UpdateTrainingSessionPayload {
  name?: string;
  date?: string;
  generalNotes?: string | null;
  diagram?: FieldDiagram | null;
}

// Exercise Templates
export type FieldItemType = 'cone' | 'ball' | 'arrow' | 'player';

export interface FieldItem {
  id: string;
  type: FieldItemType;
  x: number;       // 0-100 percentage
  y: number;       // 0-100 percentage
  rotation: number; // 0-360 degrees
  scale?: number;   // 0.5-3, for cone/ball/player
  length?: number;  // for arrow: line length in viewBox units (default 10)
  label?: string;
}

export interface FieldDiagram {
  items: FieldItem[];
}

export interface ExerciseTemplate {
  id: string;
  userId: string;
  name: string;
  diagram: FieldDiagram;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTrainingStagePayload {
  name: string;
  order: number;
  notes?: string | null;
}

export interface UpdateTrainingStagePayload {
  name?: string;
  notes?: string | null;
}
