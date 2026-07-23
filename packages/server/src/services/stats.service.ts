import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PlayerStat {
  playerId: string;
  playerName: string;
  dorsal: number | null;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  minutesPlayed: number;
  subIns: number;
  subOuts: number;
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
    },
  });

  // Build stats per player
  const statsMap = new Map<
    string,
    {
      playerName: string;
      dorsal: number | null;
      goals: number;
      assists: number;
      yellowCards: number;
      redCards: number;
      matchesPlayed: number;
      minutesPlayed: number;
      subIns: number;
      subOuts: number;
    }
  >();

  for (const formation of formations) {
    // Process formation players for minutes and match participation
    for (const fp of formation.players) {
      const existing = statsMap.get(fp.playerId) || {
        playerName: fp.player.name,
        dorsal: fp.player.dorsal,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0,
        minutesPlayed: 0,
        subIns: 0,
        subOuts: 0,
      };

      existing.matchesPlayed++;

      // Calculate minutes
      if (!fp.isSubstitute) {
        // Starters: assume 90 minutes
        existing.minutesPlayed += 90;
      } else {
        // Subs: use subOutMinute - subInMinute (if available)
        if (fp.subInMinute !== null && fp.subOutMinute !== null) {
          existing.minutesPlayed += fp.subOutMinute - fp.subInMinute;
        } else if (fp.subInMinute !== null) {
          // Subbed in but didn't sub out: assume played until end (90 min)
          existing.minutesPlayed += 90 - fp.subInMinute;
        }
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
        case 'SUB_IN':
          existing.subIns++;
          break;
        case 'SUB_OUT':
          existing.subOuts++;
          break;
      }
    }
  }

  return Array.from(statsMap.entries()).map(([playerId, stats]) => ({
    playerId,
    ...stats,
  }));
}
