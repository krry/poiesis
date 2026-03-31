import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { type NextRequest } from 'next/server';

const handlers = toNextJsHandler(auth);

export async function GET(req: NextRequest, ctx: unknown) {
  try {
    return await handlers.GET(req, ctx as never);
  } catch (e) {
    console.error('[auth] GET error:', e);
    throw e;
  }
}

export async function POST(req: NextRequest, ctx: unknown) {
  try {
    return await handlers.POST(req, ctx as never);
  } catch (e) {
    console.error('[auth] POST error:', e);
    throw e;
  }
}
