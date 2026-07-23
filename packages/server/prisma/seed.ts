import { PrismaClient, Position, FormationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@futbolapp.com' },
    update: {},
    create: {
      auth0Id: 'auth0|demo',
      email: 'demo@futbolapp.com',
      name: 'Carlos Bianchi',
    },
  });

  // Create demo team
  const team = await prisma.team.create({
    data: {
      name: 'Club Atlético Demostración',
      userId: user.id,
    },
  });

  // Create demo players
  const players = [
    { name: 'Luis Fernández', position: Position.ARQUERO, dorsal: 1 },
    { name: 'Martín Rodríguez', position: Position.DEFENSOR_CENTRAL, dorsal: 2 },
    { name: 'Diego González', position: Position.DEFENSOR_CENTRAL, dorsal: 6 },
    { name: 'Juan Pérez', position: Position.LATERAL_DERECHO, dorsal: 4 },
    { name: 'Carlos López', position: Position.LATERAL_IZQUIERDO, dorsal: 3 },
    { name: 'Pablo Martínez', position: Position.MEDIOCENTRO_DEFENSIVO, dorsal: 5 },
    { name: 'Andrés Silva', position: Position.MEDIOCENTRO_OFENSIVO, dorsal: 8 },
    { name: 'Lautaro Díaz', position: Position.EXTREMO_DERECHO, dorsal: 7 },
    { name: 'Facundo Álvarez', position: Position.EXTREMO_IZQUIERDO, dorsal: 11 },
    { name: 'Gonzalo Torres', position: Position.ENGANCHE, dorsal: 10 },
    { name: 'Sergio Gómez', position: Position.DELANTERO_CENTRO, dorsal: 9 },
    { name: 'Matías Ruiz', position: Position.MEDIOCENTRO_DEFENSIVO, dorsal: 14 },
    { name: 'Emiliano Castro', position: Position.DELANTERO_PUNTA, dorsal: 19 },
  ];

  for (const player of players) {
    await prisma.player.create({
      data: { ...player, teamId: team.id },
    });
  }

  // Create demo formation
  await prisma.formation.create({
    data: {
      name: 'Formación Titular',
      teamId: team.id,
      formationType: FormationType.F_4_4_2,
    },
  });

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
