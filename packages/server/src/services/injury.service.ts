import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateInjuryData {
  playerId: string;
  injuryType: string;
  incidentDate: Date;
  recoveryDate?: Date;
  notes?: string;
}

interface UpdateInjuryData {
  injuryType?: string;
  incidentDate?: Date;
  recoveryDate?: Date;
  notes?: string;
}

export async function getAllByTeam(teamId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  return prisma.injury.findMany({
    where: { teamId },
    include: {
      player: { select: { name: true } },
    },
    orderBy: { incidentDate: 'desc' },
  });
}

export async function create(teamId: string, userId: string, data: CreateInjuryData) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const player = await prisma.player.findFirst({ where: { id: data.playerId, teamId } });
  if (!player) {
    throw new Error('El jugador no pertenece a este equipo');
  }

  if (data.recoveryDate && data.incidentDate > data.recoveryDate) {
    throw new Error('La fecha de recuperación no puede ser anterior a la fecha de lesión');
  }

  return prisma.injury.create({
    data: {
      playerId: data.playerId,
      teamId,
      injuryType: data.injuryType,
      incidentDate: data.incidentDate,
      recoveryDate: data.recoveryDate ?? null,
      notes: data.notes ?? null,
    },
    include: {
      player: { select: { name: true } },
    },
  });
}

export async function update(id: string, teamId: string, userId: string, data: UpdateInjuryData) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const injury = await prisma.injury.findFirst({ where: { id, teamId } });
  if (!injury) return null;

  // If recoveryDate is being set/changed, validate against incidentDate
  const effectiveIncidentDate = data.incidentDate ?? injury.incidentDate;
  const effectiveRecoveryDate = data.recoveryDate ?? injury.recoveryDate;

  if (effectiveRecoveryDate && effectiveIncidentDate > effectiveRecoveryDate) {
    throw new Error('La fecha de recuperación no puede ser anterior a la fecha de lesión');
  }

  return prisma.injury.update({
    where: { id },
    data: {
      ...(data.injuryType !== undefined && { injuryType: data.injuryType }),
      ...(data.incidentDate !== undefined && { incidentDate: data.incidentDate }),
      ...(data.recoveryDate !== undefined && { recoveryDate: data.recoveryDate }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
    include: {
      player: { select: { name: true } },
    },
  });
}

export async function remove(id: string, teamId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const injury = await prisma.injury.findFirst({ where: { id, teamId } });
  if (!injury) return null;

  await prisma.injury.delete({ where: { id } });
}

export async function markRecovered(id: string, teamId: string, userId: string) {
  const team = await prisma.team.findFirst({ where: { id: teamId, userId } });
  if (!team) return null;

  const injury = await prisma.injury.findFirst({ where: { id, teamId } });
  if (!injury) return null;

  if (injury.recoveryDate) {
    throw new Error('La lesión ya ha sido marcada como recuperada');
  }

  return prisma.injury.update({
    where: { id },
    data: { recoveryDate: new Date() },
    include: {
      player: { select: { name: true } },
    },
  });
}
