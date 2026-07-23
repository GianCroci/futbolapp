import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listTeams(userId: string) {
  return prisma.team.findMany({
    where: { userId },
    include: {
      _count: { select: { players: true, formations: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getTeam(teamId: string, userId: string) {
  return prisma.team.findFirst({
    where: { id: teamId, userId },
    include: {
      _count: { select: { players: true, formations: true } },
    },
  });
}

export async function createTeam(name: string, userId: string) {
  return prisma.team.create({
    data: { name, userId },
    include: {
      _count: { select: { players: true, formations: true } },
    },
  });
}

export async function updateTeam(teamId: string, userId: string, name: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.team.update({
    where: { id: teamId },
    data: { name },
    include: {
      _count: { select: { players: true, formations: true } },
    },
  });
}

export async function deleteTeam(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return false;

  await prisma.team.delete({ where: { id: teamId } });
  return true;
}
