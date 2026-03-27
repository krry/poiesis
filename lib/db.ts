import { neon } from '@neondatabase/serverless';
import type { EditorResult } from './types';

const sql = neon(process.env.POIESIS_NEON_DB_URL!);

export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT        PRIMARY KEY,
      raw_poem   TEXT        NOT NULL,
      style_hints TEXT,
      image_hints TEXT,
      audio_hints TEXT,
      editor_result JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}

export async function createSession(data: {
  id: string;
  rawPoem: string;
  styleHints?: string;
  imageHints?: string;
  audioHints?: string;
  editorResult?: EditorResult;
}) {
  await sql`
    INSERT INTO sessions (id, raw_poem, style_hints, image_hints, audio_hints, editor_result)
    VALUES (
      ${data.id},
      ${data.rawPoem},
      ${data.styleHints ?? null},
      ${data.imageHints ?? null},
      ${data.audioHints ?? null},
      ${data.editorResult ? JSON.stringify(data.editorResult) : null}
    )
    ON CONFLICT (id) DO UPDATE SET
      editor_result = EXCLUDED.editor_result
  `;
}

export async function getSession(id: string) {
  const rows = await sql`
    SELECT id, raw_poem, style_hints, image_hints, audio_hints, editor_result, created_at
    FROM sessions WHERE id = ${id}
  `;
  if (!rows[0]) return null;
  const row = rows[0];
  return {
    id: row.id as string,
    rawPoem: row.raw_poem as string,
    styleHints: row.style_hints as string | null,
    imageHints: row.image_hints as string | null,
    audioHints: row.audio_hints as string | null,
    editorResult: row.editor_result as EditorResult | null,
    createdAt: row.created_at as Date,
  };
}
