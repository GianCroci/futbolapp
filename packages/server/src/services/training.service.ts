import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateTrainingData {
  name: string;
  date: string;
  generalNotes?: string;
}

interface UpdateTrainingData {
  name?: string;
  date?: string;
  generalNotes?: string;
  diagram?: any;
}

interface CreateStageData {
  name: string;
  notes?: string;
}

interface UpdateStageData {
  name?: string;
  notes?: string;
}

export async function getAllByUser(userId: string) {
  return prisma.trainingSession.findMany({
    where: { userId },
    include: {
      _count: { select: { stages: true } },
      stages: { select: { name: true }, orderBy: { order: 'asc' } },
    },
    orderBy: { date: 'desc' },
  });
}

export async function getById(id: string, userId: string) {
  return prisma.trainingSession.findFirst({
    where: { id, userId },
    include: {
      stages: { orderBy: { order: 'asc' } },
    },
  });
}

export async function create(userId: string, data: CreateTrainingData) {
  return prisma.$transaction(async (tx) => {
    const session = await tx.trainingSession.create({
      data: {
        userId,
        name: data.name,
        date: new Date(data.date),
        generalNotes: data.generalNotes ?? null,
      },
    });

    await tx.trainingStage.createMany({
      data: [
        { sessionId: session.id, name: 'Entrada en calor', order: 0 },
        { sessionId: session.id, name: 'Puesta a punto', order: 1 },
        { sessionId: session.id, name: 'Ejercicio principal', order: 2 },
      ],
    });

    return tx.trainingSession.findUniqueOrThrow({
      where: { id: session.id },
      include: { stages: { orderBy: { order: 'asc' } } },
    });
  });
}

export async function update(id: string, userId: string, data: UpdateTrainingData) {
  const session = await prisma.trainingSession.findFirst({ where: { id, userId } });
  if (!session) return null;

  return prisma.trainingSession.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.generalNotes !== undefined && { generalNotes: data.generalNotes }),
      ...(data.diagram !== undefined && { diagram: data.diagram }),
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  });
}

export async function remove(id: string, userId: string) {
  const session = await prisma.trainingSession.findFirst({ where: { id, userId } });
  if (!session) return null;

  await prisma.trainingSession.delete({ where: { id } });
}

export async function addStage(sessionId: string, userId: string, data: CreateStageData) {
  const session = await prisma.trainingSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) return null;

  const maxStage = await prisma.trainingStage.aggregate({
    where: { sessionId },
    _max: { order: true },
  });

  const nextOrder = (maxStage._max.order ?? -1) + 1;

  return prisma.trainingStage.create({
    data: {
      sessionId,
      name: data.name,
      order: nextOrder,
      notes: data.notes ?? null,
    },
  });
}

export async function updateStage(
  sessionId: string,
  stageId: string,
  userId: string,
  data: UpdateStageData
) {
  const session = await prisma.trainingSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) return null;

  const stage = await prisma.trainingStage.findFirst({ where: { id: stageId, sessionId } });
  if (!stage) return null;

  return prisma.trainingStage.update({
    where: { id: stageId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.notes !== undefined && { notes: data.notes }),
    },
  });
}

export async function removeStage(sessionId: string, stageId: string, userId: string) {
  const session = await prisma.trainingSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) return null;

  const stage = await prisma.trainingStage.findFirst({ where: { id: stageId, sessionId } });
  if (!stage) return null;

  await prisma.trainingStage.delete({ where: { id: stageId } });
}

export async function reorderStages(sessionId: string, userId: string, order: string[]) {
  const session = await prisma.trainingSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) return null;

  const existingStages = await prisma.trainingStage.findMany({
    where: { sessionId },
    select: { id: true },
  });

  const validIds = new Set(existingStages.map((s) => s.id));

  for (const id of order) {
    if (!validIds.has(id)) {
      throw new Error(`La etapa ${id} no pertenece a esta sesión`);
    }
  }

  if (order.length !== existingStages.length) {
    throw new Error('El orden debe incluir todas las etapas de la sesión');
  }

  await prisma.$transaction(
    order.map((stageId, index) =>
      prisma.trainingStage.update({
        where: { id: stageId },
        data: { order: index },
      })
    )
  );

  return prisma.trainingStage.findMany({
    where: { sessionId },
    orderBy: { order: 'asc' },
  });
}
