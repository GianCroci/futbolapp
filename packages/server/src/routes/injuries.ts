import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as injuryService from '../services/injury.service';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/teams/:teamId/injuries — get all injuries for a team
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;

    const injuries = await injuryService.getAllByTeam(teamId, authReq.user!.userId);
    if (injuries === null) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.json(injuries);
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:teamId/injuries — create injury entry
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { playerId, injuryType, incidentDate, recoveryDate, notes } = req.body;

    if (!playerId || typeof playerId !== 'string') {
      res.status(400).json({ error: 'El jugador es requerido' });
      return;
    }
    if (!injuryType || typeof injuryType !== 'string') {
      res.status(400).json({ error: 'El tipo de lesión es requerido' });
      return;
    }
    if (!incidentDate) {
      res.status(400).json({ error: 'La fecha de lesión es requerida' });
      return;
    }

    const injury = await injuryService.create(teamId, authReq.user!.userId, {
      playerId,
      injuryType,
      incidentDate: new Date(incidentDate),
      ...(recoveryDate !== undefined && { recoveryDate: new Date(recoveryDate) }),
      ...(notes !== undefined && { notes }),
    });

    if (injury === null) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.status(201).json(injury);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'El jugador no pertenece a este equipo') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message === 'La fecha de recuperación no puede ser anterior a la fecha de lesión') {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    next(error);
  }
});

// PUT /api/teams/:teamId/injuries/:id — update injury
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const injuryId = req.params.id as string;
    const { injuryType, incidentDate, recoveryDate, notes } = req.body;

    const injury = await injuryService.update(injuryId, teamId, authReq.user!.userId, {
      ...(injuryType !== undefined && { injuryType }),
      ...(incidentDate !== undefined && { incidentDate: new Date(incidentDate) }),
      ...(recoveryDate !== undefined && { recoveryDate: recoveryDate ? new Date(recoveryDate) : undefined }),
      ...(notes !== undefined && { notes }),
    });

    if (injury === null) {
      res.status(404).json({ error: 'Lesión no encontrada' });
      return;
    }

    res.json(injury);
  } catch (error) {
    if (error instanceof Error && error.message === 'La fecha de recuperación no puede ser anterior a la fecha de lesión') {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

// DELETE /api/teams/:teamId/injuries/:id — delete injury
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const injuryId = req.params.id as string;

    const result = await injuryService.remove(injuryId, teamId, authReq.user!.userId);
    if (result === null) {
      res.status(404).json({ error: 'Lesión no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/teams/:teamId/injuries/:id/recover — mark injury as recovered
router.patch('/:id/recover', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const injuryId = req.params.id as string;

    const injury = await injuryService.markRecovered(injuryId, teamId, authReq.user!.userId);
    if (injury === null) {
      res.status(404).json({ error: 'Lesión no encontrada' });
      return;
    }

    res.json(injury);
  } catch (error) {
    if (error instanceof Error && error.message === 'La lesión ya ha sido marcada como recuperada') {
      res.status(400).json({ error: error.message });
      return;
    }
    next(error);
  }
});

export default router;
