import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as trainingService from '../services/training.service';

const router = Router();

router.use(requireAuth);

// GET /api/training-sessions — get all sessions for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessions = await trainingService.getAllByUser(authReq.user!.userId);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

// POST /api/training-sessions — create a new training session with default stages
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const { name, date, generalNotes } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'El nombre de la sesión es requerido' });
      return;
    }
    if (!date || typeof date !== 'string') {
      res.status(400).json({ error: 'La fecha de la sesión es requerida' });
      return;
    }

    const session = await trainingService.create(authReq.user!.userId, { name, date, generalNotes });
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
});

// GET /api/training-sessions/:id — get a single session by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;
    const session = await trainingService.getById(id, authReq.user!.userId);

    if (!session) {
      res.status(404).json({ error: 'Sesión de entrenamiento no encontrada' });
      return;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// PUT /api/training-sessions/:id — update a training session
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;
    const { name, date, generalNotes, diagram } = req.body;

    const session = await trainingService.update(id, authReq.user!.userId, {
      ...(name !== undefined && { name }),
      ...(date !== undefined && { date }),
      ...(generalNotes !== undefined && { generalNotes }),
      ...(diagram !== undefined && { diagram }),
    });

    if (!session) {
      res.status(404).json({ error: 'Sesión de entrenamiento no encontrada' });
      return;
    }

    res.json(session);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/training-sessions/:id — delete a training session
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;
    const result = await trainingService.remove(id, authReq.user!.userId);

    if (result === null) {
      res.status(404).json({ error: 'Sesión de entrenamiento no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// POST /api/training-sessions/:id/stages — add a stage to a session
router.post('/:id/stages', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessionId = req.params.id as string;
    const { name, notes } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({ error: 'El nombre de la etapa es requerido' });
      return;
    }

    const stage = await trainingService.addStage(sessionId, authReq.user!.userId, { name, notes });

    if (!stage) {
      res.status(404).json({ error: 'Sesión de entrenamiento no encontrada' });
      return;
    }

    res.status(201).json(stage);
  } catch (error) {
    next(error);
  }
});

// PUT /api/training-sessions/:id/stages/:stageId — update a stage
router.put('/:id/stages/:stageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessionId = req.params.id as string;
    const stageId = req.params.stageId as string;
    const { name, notes } = req.body;

    const stage = await trainingService.updateStage(sessionId, stageId, authReq.user!.userId, {
      ...(name !== undefined && { name }),
      ...(notes !== undefined && { notes }),
    });

    if (!stage) {
      res.status(404).json({ error: 'Etapa no encontrada' });
      return;
    }

    res.json(stage);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/training-sessions/:id/stages/:stageId — delete a stage
router.delete('/:id/stages/:stageId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessionId = req.params.id as string;
    const stageId = req.params.stageId as string;
    const result = await trainingService.removeStage(sessionId, stageId, authReq.user!.userId);

    if (result === null) {
      res.status(404).json({ error: 'Etapa no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// PATCH /api/training-sessions/:id/stages/reorder — reorder stages
router.patch('/:id/stages/reorder', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const sessionId = req.params.id as string;
    const { order } = req.body;

    if (!Array.isArray(order) || !order.every((id: unknown) => typeof id === 'string')) {
      res.status(400).json({ error: 'El orden debe ser un array de identificadores' });
      return;
    }

    const stages = await trainingService.reorderStages(sessionId, authReq.user!.userId, order);

    if (!stages) {
      res.status(404).json({ error: 'Sesión de entrenamiento no encontrada' });
      return;
    }

    res.json(stages);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'El orden debe incluir todas las etapas de la sesión') {
        res.status(400).json({ error: error.message });
        return;
      }
      if (error.message.startsWith('La etapa')) {
        res.status(400).json({ error: error.message });
        return;
      }
    }
    next(error);
  }
});

export default router;
