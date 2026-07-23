import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getTeamStats } from '../services/stats.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/teams/:teamId/stats?from=&to= — get team stats
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    // Verify team belongs to user
    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const stats = await getTeamStats(teamId, from ?? null, to ?? null);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;
