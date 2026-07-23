import { PrismaClient } from '@prisma/client';
import { Position } from '@prisma/client';

const prisma = new PrismaClient();

interface PlayerInput {
  name: string;
  position: Position;
  dorsal?: number | null;
}

export async function listPlayers(teamId: string, userId: string, position?: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const where: { teamId: string; position?: Position } = { teamId };
  if (position && Object.values(Position).includes(position as Position)) {
    where.position = position as Position;
  }

  return prisma.player.findMany({
    where,
    orderBy: [{ dorsal: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }],
  });
}

export async function getPlayer(teamId: string, playerId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.player.findFirst({
    where: { id: playerId, teamId },
  });
}

export async function createPlayer(teamId: string, userId: string, data: PlayerInput) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.player.create({
    data: {
      name: data.name,
      position: data.position,
      dorsal: data.dorsal ?? null,
      teamId,
    },
  });
}

export async function updatePlayer(
  teamId: string,
  playerId: string,
  userId: string,
  data: Partial<PlayerInput>
) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const player = await prisma.player.findFirst({ where: { id: playerId, teamId } });
  if (!player) return null;

  return prisma.player.update({
    where: { id: playerId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.position !== undefined && { position: data.position }),
      ...(data.dorsal !== undefined && { dorsal: data.dorsal }),
    },
  });
}

export async function deletePlayer(teamId: string, playerId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return false;

  const player = await prisma.player.findFirst({ where: { id: playerId, teamId } });
  if (!player) return false;

  await prisma.player.delete({ where: { id: playerId } });
  return true;
}
