import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  listFormations,
  getFormation,
  createFormation,
  updateFormation,
  deleteFormation,
  updatePlayerRating,
} from '../services/formation.service';
import { FormationType, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/teams/:teamId/formations — list formations
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formations = await listFormations(teamId, authReq.user!.userId);

    if (formations === null) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.json(formations);
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:teamId/formations/:id — get formation with players
router.get('/:formationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formationId = req.params.formationId as string;

    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    res.json(formation);
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:teamId/formations — create formation
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { name, players, formationType, matchDate, scoreHome, scoreAway, opponent } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre de la formación es requerido' });
      return;
    }

    if (!Array.isArray(players) || players.length === 0) {
      res.status(400).json({ error: 'La formación debe tener al menos un jugador' });
      return;
    }

    // Validate player count: 17–23 (11 starters + 6–12 subs)
    if (players.length < 17 || players.length > 23) {
      res.status(400).json({ error: 'La formación debe tener entre 17 y 23 jugadores (11 titulares + 6-12 suplentes)' });
      return;
    }

    // Validate substitute count (max 12)
    const subs = players.filter((p: { isSubstitute?: boolean }) => p.isSubstitute === true);
    if (subs.length > 12) {
      res.status(400).json({ error: 'No pueden haber más de 12 suplentes' });
      return;
    }

    // Validate score parity: both null or both set
    const hasScoreHome = scoreHome !== null && scoreHome !== undefined;
    const hasScoreAway = scoreAway !== null && scoreAway !== undefined;
    if (hasScoreHome !== hasScoreAway) {
      res.status(400).json({ error: 'El marcador local y visitante deben estar ambos presentes o ambos ausentes' });
      return;
    }

    for (const p of players) {
      if (!p.playerId || typeof p.positionX !== 'number' || typeof p.positionY !== 'number' || !p.slotPosition) {
        res.status(400).json({ error: 'Datos de jugador inválidos en la formación' });
        return;
      }

      // Validate substitutes must have subInMinute
      if (p.isSubstitute === true && (p.subInMinute === null || p.subInMinute === undefined)) {
        res.status(400).json({ error: 'Los suplentes deben tener subInMinute definido' });
        return;
      }
    }

    const formation = await createFormation(teamId, authReq.user!.userId, {
      name: name.trim(),
      formationType: formationType ?? null,
      matchDate: matchDate ? new Date(matchDate) : null,
      scoreHome: scoreHome ?? null,
      scoreAway: scoreAway ?? null,
      opponent: opponent ?? null,
      players,
    });

    if (!formation) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.status(201).json(formation);
  } catch (error) {
    next(error);
  }
});

// PUT /api/teams/:teamId/formations/:id — update formation
router.put('/:formationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formationId = req.params.formationId as string;
    const { name, players, formationType, matchDate, scoreHome, scoreAway, opponent } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre de la formación es requerido' });
      return;
    }

    if (!Array.isArray(players) || players.length === 0) {
      res.status(400).json({ error: 'La formación debe tener al menos un jugador' });
      return;
    }

    // Validate player count: 17–23 (11 starters + 6–12 subs)
    if (players.length < 17 || players.length > 23) {
      res.status(400).json({ error: 'La formación debe tener entre 17 y 23 jugadores (11 titulares + 6-12 suplentes)' });
      return;
    }

    // Validate substitute count (max 12)
    const subs = players.filter((p: { isSubstitute?: boolean }) => p.isSubstitute === true);
    if (subs.length > 12) {
      res.status(400).json({ error: 'No pueden haber más de 12 suplentes' });
      return;
    }

    // Validate score parity
    const hasScoreHome = scoreHome !== null && scoreHome !== undefined;
    const hasScoreAway = scoreAway !== null && scoreAway !== undefined;
    if (hasScoreHome !== hasScoreAway) {
      res.status(400).json({ error: 'El marcador local y visitante deben estar ambos presentes o ambos ausentes' });
      return;
    }

    for (const p of players) {
      if (!p.playerId || typeof p.positionX !== 'number' || typeof p.positionY !== 'number' || !p.slotPosition) {
        res.status(400).json({ error: 'Datos de jugador inválidos en la formación' });
        return;
      }

      // Validate substitutes must have subInMinute
      if (p.isSubstitute === true && (p.subInMinute === null || p.subInMinute === undefined)) {
        res.status(400).json({ error: 'Los suplentes deben tener subInMinute definido' });
        return;
      }
    }

    const formation = await updateFormation(teamId, formationId, authReq.user!.userId, {
      name: name.trim(),
      formationType: formationType ?? null,
      matchDate: matchDate ? new Date(matchDate) : null,
      scoreHome: scoreHome ?? null,
      scoreAway: scoreAway ?? null,
      opponent: opponent ?? null,
      players,
    });

    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    res.json(formation);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/teams/:teamId/formations/:id — delete formation
router.delete('/:formationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formationId = req.params.formationId as string;

    const deleted = await deleteFormation(teamId, formationId, authReq.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/teams/:teamId/formations/:formationId/players/:playerId/rating — update player rating
router.patch('/:formationId/players/:playerId/rating', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formationId = req.params.formationId as string;
    const playerId = req.params.playerId as string;
    const { rating } = req.body;

    if (rating !== null && (typeof rating !== 'number' || rating < 1 || rating > 10 || !Number.isInteger(rating))) {
      res.status(400).json({ error: 'El puntaje debe ser un número entero entre 1 y 10, o null para eliminar' });
      return;
    }

    const updated = await updatePlayerRating(teamId, formationId, playerId, authReq.user!.userId, rating);
    if (!updated) {
      res.status(404).json({ error: 'Formación o jugador no encontrado' });
      return;
    }

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// PATCH /api/teams/:teamId/formations/:formationId — update formation metadata (partial)
router.patch('/:formationId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const formationId = req.params.formationId as string;
    const { comments, opponent, scoreHome, scoreAway, matchDate } = req.body;

    // Build partial update data
    const data: Record<string, unknown> = {};

    if (Object.prototype.hasOwnProperty.call(req.body, 'comments')) {
      if (typeof comments !== 'string' && comments !== null) {
        res.status(400).json({ error: 'Los comentarios deben ser texto o null' });
        return;
      }
      data.comments = comments || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'opponent')) {
      if (typeof opponent !== 'string' && opponent !== null) {
        res.status(400).json({ error: 'El rival debe ser texto o null' });
        return;
      }
      data.opponent = opponent || null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'scoreHome')) {
      if (scoreHome !== null && (typeof scoreHome !== 'number' || !Number.isInteger(scoreHome) || scoreHome < 0)) {
        res.status(400).json({ error: 'El marcador local debe ser un número entero positivo o null' });
        return;
      }
      data.scoreHome = scoreHome ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'scoreAway')) {
      if (scoreAway !== null && (typeof scoreAway !== 'number' || !Number.isInteger(scoreAway) || scoreAway < 0)) {
        res.status(400).json({ error: 'El marcador visitante debe ser un número entero positivo o null' });
        return;
      }
      data.scoreAway = scoreAway ?? null;
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'matchDate')) {
      data.matchDate = matchDate ? new Date(matchDate) : null;
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No hay campos para actualizar' });
      return;
    }

    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    const formation = await prisma.formation.findFirst({ where: { id: formationId, teamId } });
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const updated = await prisma.formation.update({
      where: { id: formationId },
      data,
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
});

export default router;
