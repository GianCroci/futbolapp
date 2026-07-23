import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from the correct location based on where this file is
// Config file is at: packages/server/src/config/auth0.ts
// .env is at: packages/server/.env
// Need to go up 3 levels: src/config -> src -> server -> project root
const envPath = resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

export const auth0Config = {
  domain: process.env.AUTH0_DOMAIN || '',
  audience: process.env.AUTH0_AUDIENCE || '',
  clientId: process.env.AUTH0_CLIENT_ID || '',
  clientSecret: process.env.AUTH0_CLIENT_SECRET || '',
};

export function getJwksUri(): string {
  return `https://${auth0Config.domain}/.well-known/jwks.json`;
}

export function getIssuer(): string {
  return `https://${auth0Config.domain}/`;
}
