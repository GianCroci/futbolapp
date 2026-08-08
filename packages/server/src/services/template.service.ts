import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getAllByUser(userId: string) {
  return prisma.exerciseTemplate.findMany({
    where: { userId },
    orderBy: { name: 'asc' },
  });
}

export async function create(userId: string, data: { name: string; diagram: any }) {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('El nombre es requerido');
  }
  return prisma.exerciseTemplate.create({
    data: {
      userId,
      name: data.name,
      diagram: data.diagram,
    },
  });
}

export async function remove(id: string, userId: string) {
  const template = await prisma.exerciseTemplate.findFirst({
    where: { id, userId },
  });
  if (!template) return null;
  return prisma.exerciseTemplate.delete({ where: { id } });
}
