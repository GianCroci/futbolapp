import { PrismaClient } from '@prisma/client';
import { FormationType } from '@prisma/client';

const prisma = new PrismaClient();

interface FormationPlayerInput {
  playerId: string;
  positionX: number;
  positionY: number;
  slotPosition: string;
  isSubstitute?: boolean;
  subInMinute?: number | null;
  subOutMinute?: number | null;
}

interface FormationInput {
  name: string;
  formationType?: FormationType | null;
  matchDate?: Date | null;
  scoreHome?: number | null;
  scoreAway?: number | null;
  opponent?: string | null;
  players: FormationPlayerInput[];
}

export async function listFormations(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.formation.findMany({
    where: { teamId },
    include: {
      _count: { select: { players: true } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getFormation(teamId: string, formationId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.formation.findFirst({
    where: { id: formationId, teamId },
    include: {
      players: {
        include: { player: true },
      },
    },
  });
}

export async function createFormation(teamId: string, userId: string, data: FormationInput) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.formation.create({
    data: {
      name: data.name,
      formationType: data.formationType ?? null,
      matchDate: data.matchDate ?? null,
      scoreHome: data.scoreHome ?? null,
      scoreAway: data.scoreAway ?? null,
      opponent: data.opponent ?? null,
      teamId,
      players: {
        create: data.players.map((p) => ({
          playerId: p.playerId,
          positionX: p.positionX,
          positionY: p.positionY,
          slotPosition: p.slotPosition,
          isSubstitute: p.isSubstitute ?? false,
          subInMinute: p.subInMinute ?? null,
          subOutMinute: p.subOutMinute ?? null,
        })),
      },
    },
    include: {
      players: {
        include: { player: true },
      },
    },
  });
}

export async function updateFormation(
  teamId: string,
  formationId: string,
  userId: string,
  data: FormationInput
) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const formation = await prisma.formation.findFirst({ where: { id: formationId, teamId } });
  if (!formation) return null;

  // Delete existing formation players, then re-create
  await prisma.formationPlayer.deleteMany({ where: { formationId } });

  return prisma.formation.update({
    where: { id: formationId },
    data: {
      name: data.name,
      formationType: data.formationType ?? null,
      matchDate: data.matchDate ?? null,
      scoreHome: data.scoreHome ?? null,
      scoreAway: data.scoreAway ?? null,
      opponent: data.opponent ?? null,
      players: {
        create: data.players.map((p) => ({
          playerId: p.playerId,
          positionX: p.positionX,
          positionY: p.positionY,
          slotPosition: p.slotPosition,
          isSubstitute: p.isSubstitute ?? false,
          subInMinute: p.subInMinute ?? null,
          subOutMinute: p.subOutMinute ?? null,
        })),
      },
    },
    include: {
      players: {
        include: { player: true },
      },
    },
  });
}

export async function deleteFormation(teamId: string, formationId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return false;

  const formation = await prisma.formation.findFirst({ where: { id: formationId, teamId } });
  if (!formation) return false;

  await prisma.formation.delete({ where: { id: formationId } });
  return true;
}

export { FormationType };
