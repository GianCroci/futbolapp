import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { MatchEventType } from '@prisma/client';
import {
  createEvent,
  listEvents,
  deleteEvent,
  updateEvent,
} from '../services/matchEvent.service';
import { getFormation } from '../services/formation.service';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// POST /api/formations/:formationId/events — create event
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const { playerId, eventType, minute } = req.body;

    if (!playerId || typeof playerId !== 'string') {
      res.status(400).json({ error: 'playerId is required' });
      return;
    }

    if (!eventType || !Object.values(MatchEventType).includes(eventType)) {
      res.status(400).json({
        error: 'eventType is required. Valid values: ' + Object.values(MatchEventType).join(', '),
      });
      return;
    }

    if (minute !== null && minute !== undefined) {
      const numMinute = Number(minute);
      if (!Number.isInteger(numMinute) || numMinute < 0 || numMinute > 120) {
        res.status(400).json({ error: 'minute must be an integer between 0 and 120' });
        return;
      }
    }

    // Verify formation belongs to user's team
    const teamId = req.params.teamId as string;
    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const event = await createEvent(formationId, playerId, eventType, minute ? Number(minute) : null);
    res.status(201).json(event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Player is not part of this formation')) {
      res.status(400).json({ error: message });
      return;
    }
    if (message.includes('Minute must be')) {
      res.status(400).json({ error: message });
      return;
    }
    next(error);
  }
});

// GET /api/formations/:formationId/events — list events
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const teamId = req.params.teamId as string;

    // Verify formation belongs to user's team
    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const events = await listEvents(formationId);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

// PUT /api/formations/:formationId/events/:eventId — update event
router.put('/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const eventId = req.params.eventId as string;
    const teamId = req.params.teamId as string;
    const { minute, eventType } = req.body;

    // Verify formation belongs to user's team
    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const updateData: { minute?: number | null; eventType?: MatchEventType } = {};

    if (minute !== undefined) {
      if (minute !== null) {
        const numMinute = Number(minute);
        if (!Number.isInteger(numMinute) || numMinute < 0 || numMinute > 120) {
          res.status(400).json({ error: 'minute must be an integer between 0 and 120' });
          return;
        }
        updateData.minute = numMinute;
      } else {
        updateData.minute = null;
      }
    }

    if (eventType !== undefined) {
      if (!Object.values(MatchEventType).includes(eventType)) {
        res.status(400).json({
          error: 'Invalid eventType. Valid values: ' + Object.values(MatchEventType).join(', '),
        });
        return;
      }
      updateData.eventType = eventType;
    }

    const event = await updateEvent(eventId, updateData);
    res.json(event);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    if (message.includes('Minute must be')) {
      res.status(400).json({ error: message });
      return;
    }
    next(error);
  }
});

// DELETE /api/formations/:formationId/events/:eventId — delete event
router.delete('/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const formationId = req.params.formationId as string;
    const eventId = req.params.eventId as string;
    const teamId = req.params.teamId as string;

    // Verify formation belongs to user's team
    const formation = await getFormation(teamId, formationId, authReq.user!.userId);
    if (!formation) {
      res.status(404).json({ error: 'Formación no encontrada' });
      return;
    }

    const deleted = await deleteEvent(formationId, eventId);
    if (!deleted) {
      res.status(404).json({ error: 'Evento no encontrado' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
