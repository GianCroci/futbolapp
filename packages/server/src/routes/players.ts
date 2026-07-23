import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  listPlayers,
  getPlayer,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from '../services/player.service';
import { Position } from '@prisma/client';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// GET /api/teams/:teamId/players — list players, optional ?position filter
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const position = req.query.position as string | undefined;

    const players = await listPlayers(teamId, authReq.user!.userId, position);
    if (players === null) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.json(players);
  } catch (error) {
    next(error);
  }
});

// GET /api/teams/:teamId/players/:id — get player
router.get('/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const playerId = req.params.playerId as string;

    const player = await getPlayer(teamId, playerId, authReq.user!.userId);
    if (!player) {
      res.status(404).json({ error: 'Jugador no encontrado' });
      return;
    }

    res.json(player);
  } catch (error) {
    next(error);
  }
});

// POST /api/teams/:teamId/players — create player
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { name, position, dorsal } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json({ error: 'El nombre del jugador es requerido' });
      return;
    }

    if (!position || !Object.values(Position).includes(position)) {
      res.status(400).json({
        error: 'Posición inválida. Valores válidos: ' + Object.values(Position).join(', '),
      });
      return;
    }

    if (dorsal !== undefined && dorsal !== null) {
      const numDorsal = Number(dorsal);
      if (!Number.isInteger(numDorsal) || numDorsal < 1 || numDorsal > 99) {
        res.status(400).json({ error: 'El dorsal debe ser un número entre 1 y 99' });
        return;
      }
    }

    const player = await createPlayer(teamId, authReq.user!.userId, {
      name: name.trim(),
      position,
      dorsal: dorsal ? Number(dorsal) : null,
    });

    if (!player) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    res.status(201).json(player);
  } catch (error: unknown) {
    // Prisma unique constraint violation (dorsal duplicado)
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un jugador con ese dorsal en este equipo' });
      return;
    }
    next(error);
  }
});

// PUT /api/teams/:teamId/players/:id — update player
router.put('/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const playerId = req.params.playerId as string;
    const { name, position, dorsal } = req.body;

    const updateData: { name?: string; position?: Position; dorsal?: number | null } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        res.status(400).json({ error: 'El nombre del jugador no puede estar vacío' });
        return;
      }
      updateData.name = name.trim();
    }

    if (position !== undefined) {
      if (!Object.values(Position).includes(position)) {
        res.status(400).json({ error: 'Posición inválida' });
        return;
      }
      updateData.position = position;
    }

    if (dorsal !== undefined) {
      const numDorsal = Number(dorsal);
      if (!Number.isInteger(numDorsal) || numDorsal < 1 || numDorsal > 99) {
        res.status(400).json({ error: 'El dorsal debe ser un número entre 1 y 99' });
        return;
      }
      updateData.dorsal = numDorsal;
    }

    const player = await updatePlayer(teamId, playerId, authReq.user!.userId, updateData);
    if (!player) {
      res.status(404).json({ error: 'Jugador no encontrado' });
      return;
    }

    res.json(player);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      res.status(409).json({ error: 'Ya existe un jugador con ese dorsal en este equipo' });
      return;
    }
    next(error);
  }
});

// DELETE /api/teams/:teamId/players/:id — delete player
router.delete('/:playerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const playerId = req.params.playerId as string;

    const deleted = await deletePlayer(teamId, playerId, authReq.user!.userId);
    if (!deleted) {
      res.status(404).json({ error: 'Jugador no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
