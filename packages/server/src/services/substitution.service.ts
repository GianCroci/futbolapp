import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createSubstitution(
  formationId: string,
  playerOutId: string,
  playerInId: string,
  minute: number
) {
  // Validate minute range
  if (!Number.isInteger(minute) || minute < 0 || minute > 120) {
    throw new Error('Minute must be an integer between 0 and 120');
  }

  // Validate different players
  if (playerOutId === playerInId) {
    throw new Error('Cannot substitute a player with themselves');
  }

  // Validate both players belong to the formation
  const [playerOutFP, playerInFP] = await Promise.all([
    prisma.formationPlayer.findUnique({
      where: { formationId_playerId: { formationId, playerId: playerOutId } },
    }),
    prisma.formationPlayer.findUnique({
      where: { formationId_playerId: { formationId, playerId: playerInId } },
    }),
  ]);

  if (!playerOutFP) {
    throw new Error('Player leaving is not part of this formation');
  }
  if (!playerInFP) {
    throw new Error('Player entering is not part of this formation');
  }

  // Validate playerOut is a starter (not a substitute)
  if (playerOutFP.isSubstitute) {
    throw new Error('Player leaving must be a starter, not a substitute');
  }

  // Validate playerIn is a substitute
  if (!playerInFP.isSubstitute) {
    throw new Error('Player entering must be a substitute');
  }

  // Validate max one entry per substitute per formation
  const existingEntry = await prisma.substitution.findFirst({
    where: { formationId, playerInId },
  });
  if (existingEntry) {
    throw new Error('This substitute has already entered the match');
  }

  return prisma.substitution.create({
    data: {
      formationId,
      playerOutId,
      playerInId,
      minute,
    },
    include: {
      playerOut: true,
      playerIn: true,
    },
  });
}

export async function listSubstitutions(formationId: string) {
  return prisma.substitution.findMany({
    where: { formationId },
    include: {
      playerOut: true,
      playerIn: true,
    },
    orderBy: { minute: 'asc' },
  });
}

export async function deleteSubstitution(formationId: string, substitutionId: string) {
  const sub = await prisma.substitution.findFirst({
    where: { id: substitutionId, formationId },
  });
  if (!sub) return null;

  await prisma.substitution.delete({ where: { id: substitutionId } });
  return sub;
}
