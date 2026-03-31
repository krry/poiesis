import { NextRequest, NextResponse } from 'next/server';
import { createSession, initDb } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// Rejection sampling eliminates modulo bias (256 % 36 = 4 would skew chars 0–3)
function nanoid(len = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const limit = 256 - (256 % chars.length); // 252 — reject bytes >= this
  const result: string[] = [];
  while (result.length < len) {
    for (const b of crypto.getRandomValues(new Uint8Array(len * 2))) {
      if (b < limit) { result.push(chars[b % chars.length]); if (result.length === len) break; }
    }
  }
  return result.join('');
}

export async function POST(req: NextRequest) {
  await initDb();
  const body = await req.json();
  const { rawPoem, styleHints, imageHints, audioHints, editorResult } = body;

  if (!rawPoem?.trim()) {
    return NextResponse.json({ error: 'rawPoem is required' }, { status: 400 });
  }
  if (rawPoem.length > 10_000) {
    return NextResponse.json({ error: 'rawPoem too long (max 10,000 chars)' }, { status: 400 });
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id ?? null;

  const id = nanoid();
  await createSession({ id, rawPoem, styleHints, imageHints, audioHints, editorResult, userId });
  return NextResponse.json({ id });
}
