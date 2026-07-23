import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface Auth0Profile {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

export async function findOrCreateUser(profile: Auth0Profile) {
  const { sub, email, name, picture } = profile;

  let user = await prisma.user.findUnique({ where: { auth0Id: sub } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        auth0Id: sub,
        email: email || '',
        name: name || '',
        picture: picture || null,
      },
    });
  } else if (email || name || picture) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        email: email || user.email,
        name: name || user.name,
        picture: picture ?? user.picture,
      },
    });
  }

  return user;
}

export async function getUserByAuth0Id(auth0Id: string) {
  return prisma.user.findUnique({ where: { auth0Id } });
}
