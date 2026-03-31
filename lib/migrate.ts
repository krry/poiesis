// Run once to create betterAuth tables (user, session, account, verification)
// and extend the sessions table with user_id.
//
// Usage:  npx tsx lib/migrate.ts
//
// Safe to re-run — all DDL uses IF NOT EXISTS / IF COLUMN NOT EXISTS.

import { getMigrations } from 'better-auth/db/migration';
import { auth } from './auth';
import { neon } from '@neondatabase/serverless';

const dbUrl = process.env.AUTH_DB_URL ?? process.env.POIESIS_NEON_DB_URL;
if (!dbUrl) { console.error('AUTH_DB_URL or POIESIS_NEON_DB_URL must be set'); process.exit(1); }

const sql = neon(dbUrl);

console.log('[migrate] running betterAuth migrations…');
const { runMigrations } = await getMigrations(auth.options);
await runMigrations();
console.log('[migrate] betterAuth tables OK');

// Extend the Poiesis sessions table with user_id (nullable FK to betterAuth user)
await sql`
  ALTER TABLE sessions
    ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL
`;
console.log('[migrate] sessions.user_id column OK');

process.exit(0);
