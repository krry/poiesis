// Run once to create betterAuth tables (user, session, account, verification)
// and extend the Poiesis sessions table with user_id.
//
// Usage:  npx tsx lib/migrate.ts
//
// Safe to re-run — all DDL uses IF NOT EXISTS / IF COLUMN NOT EXISTS.
// Uses a minimal betterAuth instance (no social providers) — only the database
// connection matters for schema migration.

import { betterAuth } from 'better-auth';
import { Pool } from '@neondatabase/serverless';
import { getMigrations } from 'better-auth/db/migration';
import { neon } from '@neondatabase/serverless';

async function main() {
  const dbUrl = process.env.AUTH_DB_URL ?? process.env.POIESIS_NEON_DB_URL;
  if (!dbUrl) { console.error('AUTH_DB_URL or POIESIS_NEON_DB_URL must be set'); process.exit(1); }

  const pool = new Pool({ connectionString: dbUrl });
  const sql  = neon(dbUrl);

  const auth = betterAuth({
    database: pool,
    emailAndPassword: { enabled: true },
  });

  console.log('[migrate] running betterAuth migrations…');
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();
  console.log('[migrate] betterAuth tables OK');

  await sql`
    ALTER TABLE sessions
      ADD COLUMN IF NOT EXISTS user_id TEXT REFERENCES "user"(id) ON DELETE SET NULL
  `;
  console.log('[migrate] sessions.user_id column OK');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
