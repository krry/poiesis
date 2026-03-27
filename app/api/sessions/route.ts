import { NextRequest, NextResponse } from 'next/server';
import { createSession, initDb } from '@/lib/db';

function nanoid(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length])
    .join('');
}

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { rawPoem, styleHints, imageHints, audioHints, editorResult } = body;

  if (!rawPoem?.trim()) {
    return NextResponse.json({ error: 'rawPoem is required' }, { status: 400 });
  }

  const id = nanoid();
  await createSession({ id, rawPoem, styleHints, imageHints, audioHints, editorResult });
  return NextResponse.json({ id });
}
