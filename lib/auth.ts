import { betterAuth } from 'better-auth';
import { Pool } from '@neondatabase/serverless';
import { Kysely, PostgresDialect } from 'kysely';
import { nextCookies } from 'better-auth/next-js';
import { SignJWT, importPKCS8 } from 'jose';

// Shared auth uses Ouracle's database so sessions are valid across both apps.
// AUTH_DB_URL should be the same connection string as Ouracle's DATABASE_URL.
// Fallback to POIESIS_NEON_DB_URL for standalone / dev without Ouracle.
const pool = new Pool({
  connectionString: process.env.AUTH_DB_URL ?? process.env.POIESIS_NEON_DB_URL!,
});
const db = new Kysely({ dialect: new PostgresDialect({ pool }) });

// Apple requires a signed JWT as client secret — regenerate at startup
async function appleClientSecret(): Promise<string> {
  const { OAUTH_APPLE_CLIENT_SECRET: p8, OAUTH_APPLE_KEY_ID: kid, OAUTH_APPLE_TEAM_ID: teamId, OAUTH_APPLE_CLIENT_ID: clientId } = process.env;
  if (!p8 || !kid || !teamId || !clientId) return p8 ?? '';
  const key = await importPKCS8(p8.replace(/\\n/g, '\n'), 'ES256');
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid })
    .setIssuer(teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + 15_552_000) // 6 months
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .sign(key);
}

let appleSecret = '';
if (process.env.OAUTH_APPLE_CLIENT_ID) {
  try {
    appleSecret = await appleClientSecret();
  } catch (e) {
    console.error('[auth] Apple client secret generation failed:', e);
  }
}

type SocialProviders = Parameters<typeof betterAuth>[0]['socialProviders'];
const socialProviders: SocialProviders = {};

if (process.env.OAUTH_GOOGLE_CLIENT_ID) {
  socialProviders!.google = {
    clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
    clientSecret: process.env.OAUTH_GOOGLE_CLIENT_SECRET!,
  };
}
if (process.env.OAUTH_GITHUB_CLIENT_ID) {
  socialProviders!.github = {
    clientId: process.env.OAUTH_GITHUB_CLIENT_ID,
    clientSecret: process.env.OAUTH_GITHUB_CLIENT_SECRET!,
  };
}
if (process.env.OAUTH_APPLE_CLIENT_ID && appleSecret) {
  socialProviders!.apple = {
    clientId: process.env.OAUTH_APPLE_CLIENT_ID,
    clientSecret: appleSecret,
  };
}

export const auth = betterAuth({
  database: { db, type: 'postgres' },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 7,
  },
  socialProviders,
  // Shared session cookies across all *.kerry.ink subdomains.
  // Requires same BETTER_AUTH_SECRET on all apps sharing the cookie.
  advanced: {
    crossSubDomainCookies: {
      enabled: !!process.env.COOKIE_DOMAIN,
      domain: process.env.COOKIE_DOMAIN?.trim() ?? '',
    },
  },
  trustedOrigins: [
    'https://poiesis.kerry.ink',
    'https://ouracle.kerry.ink',
    'http://localhost:3000',
  ],
  plugins: [nextCookies()], // must be last
});
