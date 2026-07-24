import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlayerStat {
  playerId: string;
  playerName: string;
  position: string;
  dorsal: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  appearances: number;
  totalMinutes: number;
}

export async function getTeamStats(
  teamId: string,
  from?: string | null,
  to?: string | null
): Promise<PlayerStat[]> {
  // Build date filter for formations
  const dateFilter: Record<string, unknown> = {};
  if (from || to) {
    const matchDateFilter: Record<string, Date> = {};
    if (from) matchDateFilter.gte = new Date(from);
    if (to) matchDateFilter.lte = new Date(to);
    dateFilter.matchDate = matchDateFilter;
  }

  // Get all formations for this team (optionally filtered by matchDate)
  const formations = await prisma.formation.findMany({
    where: { teamId, ...dateFilter },
    include: {
      players: {
        include: {
          player: true,
        },
      },
      events: {
        include: {
          player: true,
        },
      },
      substitutions: true,
    },
  });

  // Build stats per player
  const statsMap = new Map<
    string,
    {
      playerName: string;
      position: string;
      dorsal: number | null;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      appearances: number;
      totalMinutes: number;
    }
  >();

  for (const formation of formations) {
    // Build substitution lookups for this formation
    const subbedOut = new Map<string, number>(); // playerOutId → minute
    const subbedIn = new Map<string, number>(); // playerInId → minute
    for (const sub of formation.substitutions) {
      subbedOut.set(sub.playerOutId, sub.minute);
      subbedIn.set(sub.playerInId, sub.minute);
    }

    // Process formation players for minutes and match participation
    for (const fp of formation.players) {
      const existing = statsMap.get(fp.playerId) || {
        playerName: fp.player.name,
        position: fp.player.position,
        dorsal: fp.player.dorsal,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        appearances: 0,
        totalMinutes: 0,
      };

      let minutes = 0;
      if (!fp.isSubstitute) {
        // Starter: check if subbed out
        const subOutMinute = subbedOut.get(fp.playerId);
        minutes = subOutMinute ?? 90;
      } else {
        // Substitute: check if subbed in
        const subInMinute = subbedIn.get(fp.playerId);
        if (subInMinute !== undefined) {
          minutes = 90 - subInMinute;
        }
      }

      if (minutes > 0) {
        existing.appearances++;
        existing.totalMinutes += minutes;
      }

      statsMap.set(fp.playerId, existing);
    }

    // Process events for goals, assists, cards
    for (const event of formation.events) {
      const existing = statsMap.get(event.playerId);
      if (!existing) continue;

      switch (event.eventType) {
        case 'GOAL':
          existing.goals++;
          break;
        case 'ASSIST':
          existing.assists++;
          break;
        case 'YELLOW_CARD':
          existing.yellowCards++;
          break;
        case 'RED_CARD':
          existing.redCards++;
          break;
        // SUB_IN/SUB_OUT kept in enum for backwards compat, not counted
      }
    }
  }

  return Array.from(statsMap.entries()).map(([playerId, stats]) => ({
    playerId,
    ...stats,
  }));
}
