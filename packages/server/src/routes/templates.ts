import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import * as templateService from '../services/template.service';

const router = Router();

router.use(requireAuth);

// GET /api/exercise-templates — list all templates for the authenticated user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const templates = await templateService.getAllByUser(authReq.user!.userId);
    res.json(templates);
  } catch (error) {
    next(error);
  }
});

// POST /api/exercise-templates — create a new template
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const { name, diagram } = req.body;

    if (!diagram) {
      res.status(400).json({ error: 'El diagrama es requerido' });
      return;
    }

    const template = await templateService.create(authReq.user!.userId, { name, diagram });
    res.status(201).json(template);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/exercise-templates/:id — delete a template
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const id = req.params.id as string;
    const result = await templateService.remove(id, authReq.user!.userId);

    if (result === null) {
      res.status(404).json({ error: 'Plantilla no encontrada' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
