import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { answerQuestion } from '../services/insights.service';

const prisma = new PrismaClient();
const router = Router({ mergeParams: true });

const MAX_QUESTION_LENGTH = 1000;
const MAX_HISTORY_ITEMS = 20;
const MAX_HISTORY_CONTENT_LENGTH = 1000;

// Optional conversation history is forwarded to the model for coherence only
// (R2 preserved: figures must still come from the current context block).
function isHistoryItem(item: unknown): item is { role: 'user' | 'assistant'; content: string } {
  if (typeof item !== 'object' || item === null) return false;
  const candidate = item as { role?: unknown; content?: unknown };
  return (
    (candidate.role === 'user' || candidate.role === 'assistant') &&
    typeof candidate.content === 'string' &&
    candidate.content.trim().length > 0 &&
    candidate.content.trim().length <= MAX_HISTORY_CONTENT_LENGTH
  );
}

router.use(requireAuth);

// POST /api/teams/:teamId/insights/query — natural-language question over team data
router.post('/query', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const teamId = req.params.teamId as string;
    const { question, history } = req.body ?? {};

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

    // Malformed history → 400, and MUST NOT call the LLM (coherence-only context)
    if (
      history !== undefined &&
      (!Array.isArray(history) || history.length > MAX_HISTORY_ITEMS || !history.every(isHistoryItem))
    ) {
      res.status(400).json({
        error: `El historial es inválido: debe ser un arreglo de hasta ${MAX_HISTORY_ITEMS} mensajes, cada uno con rol user o assistant y contenido de entre 1 y ${MAX_HISTORY_CONTENT_LENGTH} caracteres`,
      });
      return;
    }
    const historyTurns = (history as Array<{ role: 'user' | 'assistant'; content: string }> | undefined)?.map(
      (item) => ({ role: item.role, text: item.content.trim() })
    );

    // Ownership check (R1): 404 on mismatch, no data leakage
    const team = await prisma.team.findFirst({ where: { id: teamId, userId: authReq.user!.userId } });
    if (!team) {
      res.status(404).json({ error: 'Equipo no encontrado' });
      return;
    }

    // answerQuestion throws typed errors mapped by the shared errorHandler:
    // 503 no key (no LLM call) / 429 provider rate limit / 502 upstream failure
    const answer = await answerQuestion(teamId, trimmed, historyTurns);
    res.json({ answer });
  } catch (error) {
    next(error);
  }
});

export default router;
