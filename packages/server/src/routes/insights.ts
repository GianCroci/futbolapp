import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { answerQuestion } from '../services/insights.service';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

const MAX_QUESTION_LENGTH = 1000;

router.use(requireAuth);

// POST /api/teams/:teamId/insights/query — natural-language question over team data
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { question } = req.body ?? {};

    // Validation first (R9): 400 without touching the LLM or the DB
    if (typeof question !== 'string' || question.trim().length === 0) {
      res.status(400).json({ error: 'La pregunta es requerida' });
      return;
    }
    const trimmed = question.trim();
    if (trimmed.length > MAX_QUESTION_LENGTH) {
      res.status(400).json({ error: `La pregunta no puede superar los ${MAX_QUESTION_LENGTH} caracteres` });
      return;
    }

    // Ownership check (R1): 404 on mismatch, no data leakage
    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    // answerQuestion throws typed errors mapped by the shared errorHandler:
    // 503 no key (no LLM call) / 429 provider rate limit / 502 upstream failure
    const answer = await answerQuestion(teamId, trimmed);
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

export default router;
