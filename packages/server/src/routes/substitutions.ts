import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  createSubstitution,
  listSubstitutions,
  deleteSubstitution,
} from '../services/substitution.service';
import { getFormation } from '../services/formation.service';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// POST /api/formations/:formationId/substitutions — create substitution
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const teamId = req.params.teamId as string;
    const { playerOutId, playerInId, minute } = req.body;

    if (!playerOutId || typeof playerOutId !== 'string') {
      res.status(400).json({ error: 'playerOutId is required' });
      return;
    }
    if (!playerInId || typeof playerInId !== 'string') {
      res.status(400).json({ error: 'playerInId is required' });
      return;
    }
    if (minute === undefined || minute === null) {
      res.status(400).json({ error: 'minute is required' });
      return;
    }

    // Verify formation belongs to user's team
    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const sub = await createSubstitution(formationId, playerOutId, playerInId, Number(minute));
    res.status(201).json(sub);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (
      message.includes('Minute must be') ||
      message.includes('Cannot substitute') ||
      message.includes('not part of this formation') ||
      message.includes('must be a starter') ||
      message.includes('must be a substitute') ||
      message.includes('already entered')
    ) {
      res.status(400).json({ error: message });
      return;
    }
    next(error);
  }
});

// GET /api/formations/:formationId/substitutions — list substitutions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const teamId = req.params.teamId as string;

    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const subs = await listSubstitutions(formationId);
    res.json(subs);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/formations/:formationId/substitutions/:id — delete substitution
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const subId = req.params.id as string;
    const teamId = req.params.teamId as string;

    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const deleted = await deleteSubstitution(formationId, subId);
    if (!deleted) {
      res.status(404).json({ error: 'Sustitución no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
