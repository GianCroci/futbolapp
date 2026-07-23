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
}
