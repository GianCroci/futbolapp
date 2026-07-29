import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/teams/:teamId/fixtures — get all fixture entries + image
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;

    const team = await prisma.team.findFirst({
      where: { id: teamId, userId: authReq.user!.userId },
      select: { fixtureImage: true },
    });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const entries = await prisma.fixtureEntry.findMany({
      where: { teamId },
      orderBy: [{ matchDay: { sort: 'asc', nulls: 'last' } }, { date: 'asc' }],
    });

    res.json({ entries, fixtureImage: team.fixtureImage });
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:teamId/fixtures — create fixture entry
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { matchDay, date, opponent, location, scoreHome, scoreAway } = req.body;

    if (!opponent || typeof opponent !== 'string') {
      res.status(400).json({ error: 'El rival es requerido' });
      return;
    }

    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const entry = await prisma.fixtureEntry.create({
      data: {
        teamId,
        matchDay: matchDay ?? null,
        date: date || null,
        opponent,
        location: location || null,
        scoreHome: scoreHome ?? null,
        scoreAway: scoreAway ?? null,
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:teamId/fixtures/:id — update fixture entry
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const entryId = req.params.id as string;
    const { matchDay, date, opponent, location, scoreHome, scoreAway } = req.body;

    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const entry = await prisma.fixtureEntry.findFirst({ where: { id: entryId, teamId } });
    if (!entry) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    const updated = await prisma.fixtureEntry.update({
      where: { id: entryId },
      data: {
        matchDay: matchDay ?? null,
        date: date ?? null,
        opponent: opponent ?? entry.opponent,
        location: location ?? null,
        scoreHome: scoreHome ?? null,
        scoreAway: scoreAway ?? null,
      },
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:teamId/fixtures/:id — delete fixture entry
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const entryId = req.params.id as string;

    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const entry = await prisma.fixtureEntry.findFirst({ where: { id: entryId, teamId } });
    if (!entry) {
      res.status(404).json({ error: 'Partido no encontrado' });
      return;
    }

    await prisma.fixtureEntry.delete({ where: { id: entryId } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/teams/:teamId/fixtures/image — update fixture image (base64)
router.patch('/image', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { fixtureImage } = req.body;

    if (typeof fixtureImage !== 'string' && fixtureImage !== null) {
      res.status(400).json({ error: 'La imagen debe ser texto base64 o null' });
      return;
    }

    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: { fixtureImage },
      select: { fixtureImage: true },
    });

    res.json({ fixtureImage: updated.fixtureImage });
  } catch (error) {
    next(error);
  }
});

export default router;
