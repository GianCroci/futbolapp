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
}

export interface FormationPlayer {
  id: string;
  playerId: string;
  positionX: number;
  positionY: number;
  slotPosition: string;
  player?: Player;
}
