import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  listTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../services/team.service';

const router = Router();

router.use(requireAuth);

// GET /api/teams — list user's teams
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teams = await listTeams(authReq.user!.userId);
    res.json(teams);
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:teamId — get team details
router.get('/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const team = await getTeam(teamId, authReq.user!.userId);
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }
    res.json(team);
  } catch (error) {
    next(error);
  }
});

// POST /api/teams — create team
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre del equipo es requerido' });
      return;
    }

    const team = await createTeam(name.trim(), authReq.user!.userId);
    res.status(201).json(team);
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:teamId — update team name
router.put('/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'El nombre del equipo es requerido' });
      return;
    }

    const team = await updateTeam(teamId, authReq.user!.userId, name.trim());
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.json(team);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:teamId — delete team
router.delete('/:teamId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const deleted = await deleteTeam(teamId, authReq.user!.userId);

    if (!deleted) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
