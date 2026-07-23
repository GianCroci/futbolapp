import { PrismaClient, MatchEventType } from '@prisma/client';

const prisma = new PrismaClient();

export async function createEvent(
  formationId: string,
  playerId: string,
  eventType: MatchEventType,
  minute?: number | null
) {
  // Validate player belongs to the formation
  const formationPlayer = await prisma.formationPlayer.findUnique({
    where: { formationId_playerId: { formationId, playerId } },
  });
  if (!formationPlayer) {
    throw new Error('Player is not part of this formation');
  }

  // Validate minute range if provided
  if (minute !== null && minute !== undefined) {
    if (!Number.isInteger(minute) || minute < 0 || minute > 120) {
      throw new Error('Minute must be an integer between 0 and 120');
    }
  }

  return prisma.matchEvent.create({
    data: {
      formationId,
      playerId,
      eventType,
      minute: minute ?? null,
    },
    include: {
      player: true,
    },
  });
}

export async function listEvents(formationId: string) {
  return prisma.matchEvent.findMany({
    where: { formationId },
    include: {
      player: true,
    },
    orderBy: { minute: 'asc' },
  });
}

export async function deleteEvent(formationId: string, eventId: string) {
  const event = await prisma.matchEvent.findFirst({
    where: { id: eventId, formationId },
  });
  if (!event) return false;

  await prisma.matchEvent.delete({ where: { id: eventId } });
  return true;
}

export async function updateEvent(
  eventId: string,
  data: { minute?: number | null; eventType?: MatchEventType }
) {
  // Validate minute range if provided
  if (data.minute !== null && data.minute !== undefined) {
    if (!Number.isInteger(data.minute) || data.minute < 0 || data.minute > 120) {
      throw new Error('Minute must be an integer between 0 and 120');
    }
  }

  return prisma.matchEvent.update({
    where: { id: eventId },
    data,
    include: {
      player: true,
    },
  });
}
