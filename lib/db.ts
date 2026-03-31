import { neon } from '@neondatabase/serverless';
import type { EditorResult } from './types';

const sql = neon(process.env.POIESIS_NEON_DB_URL!);

// Singleton guard: DDL runs at most once per process instance
let _initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!_initPromise) {
    _initPromise = sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id         TEXT        PRIMARY KEY,
        raw_poem   TEXT        NOT NULL,
        style_hints TEXT,
        image_hints TEXT,
        audio_hints TEXT,
        editor_result JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `.then(() => undefined);
  }
  return _initPromise;
}

function isEditorResult(v: unknown): v is EditorResult {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.polished === 'string' &&
    Array.isArray(o.annotations) &&
    Array.isArray(o.midjourney_prompts) &&
    Array.isArray(o.narration_script)
  );
}

export async function createSession(data: {
  id: string;
  rawPoem: string;
  styleHints?: string;
  imageHints?: string;
  audioHints?: string;
  editorResult?: EditorResult;
  userId?: string | null;
}) {
  await sql`
    INSERT INTO sessions (id, raw_poem, style_hints, image_hints, audio_hints, editor_result, user_id)
    VALUES (
      ${data.id},
      ${data.rawPoem},
      ${data.styleHints ?? null},
      ${data.imageHints ?? null},
      ${data.audioHints ?? null},
      ${data.editorResult ? JSON.stringify(data.editorResult) : null},
      ${data.userId ?? null}
    )
    ON CONFLICT (id) DO UPDATE SET
      editor_result = EXCLUDED.editor_result
  `;
}

export async function getSessionsByUser(userId: string) {
  const rows = await sql`
    SELECT id, raw_poem, style_hints, image_hints, audio_hints, editor_result, created_at
    FROM sessions
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  return rows.map(row => ({
    id: row.id as string,
    rawPoem: row.raw_poem as string,
    styleHints: row.style_hints as string | null,
    imageHints: row.image_hints as string | null,
    audioHints: row.audio_hints as string | null,
    editorResult: isEditorResult(row.editor_result) ? row.editor_result : null,
    createdAt: row.created_at as Date,
  }));
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
    editorResult: isEditorResult(row.editor_result) ? row.editor_result : null,
    createdAt: row.created_at as Date,
  };
}
