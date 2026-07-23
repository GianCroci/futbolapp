import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { getJwksUri, getIssuer } from '../config/auth0';
import { findOrCreateUser } from '../services/auth.service';

export interface AuthRequest extends Request {
  user?: {
    sub: string;
    userId: string; // DB UUID — the one foreign keys actually reference
    email?: string;
    name?: string;
    picture?: string;
    [key: string]: unknown;
  };
}

const client = jwksClient({
  jwksUri: getJwksUri(),
  cache: true,
  rateLimit: true,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Token de acceso requerido' });
    return;
  }

  const token = authHeader.split(' ')[1];

  // Verify ID token — only check issuer (no audience for ID tokens)
  jwt.verify(
    token,
    getKey,
    {
      issuer: getIssuer(),
      algorithms: ['RS256'],
    },
    async (err, decoded) => {
      if (err) {
        res.status(401).json({ error: 'Token inválido o expirado' });
        return;
      }

      const payload = decoded as { sub: string; email?: string; name?: string; picture?: string };

      // Resolve Auth0 sub → DB UUID so foreign keys work
      try {
        const dbUser = await findOrCreateUser({
          sub: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
        });

        (req as AuthRequest).user = {
          ...payload,
          userId: dbUser.id,
        };
        next();
      } catch (lookupErr) {
        console.error('[Auth] Failed to resolve user:', lookupErr);
        res.status(401).json({ error: 'No se pudo resolver el usuario' });
      }
    }
  );
}
