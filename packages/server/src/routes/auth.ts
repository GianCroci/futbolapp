import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import { auth0Config } from '../config/auth0';
import { findOrCreateUser } from '../services/auth.service';
import { requireAuth, AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

const router = Router();

// POST /api/auth/callback — exchange Auth0 code for tokens, create user
router.post('/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, redirectUri } = req.body;

    if (!code) {
      res.status(400).json({ error: 'Código de autorización requerido' });
      return;
    }

    // Exchange code for tokens
    const tokenResponse = await axios.post(`https://${auth0Config.domain}/oauth/token`, {
      grant_type: 'authorization_code',
      client_id: auth0Config.clientId,
      client_secret: auth0Config.clientSecret,
      code,
      redirect_uri: redirectUri || 'http://localhost:5173/callback',
    });

    const { access_token } = tokenResponse.data;

    // Get user info from Auth0
    const userInfoResponse = await axios.get(`https://${auth0Config.domain}/userinfo`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });

    const profile = userInfoResponse.data;
    const user = await findOrCreateUser(profile);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
      access_token,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me — current user (auto-creates if first login via PKCE)
router.get('/me', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthRequest;
    const { userId, email, name, picture } = authReq.user!;

    // findOrCreateUser already ran in requireAuth; just fetch the DB user by ID
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      picture: user.picture,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
