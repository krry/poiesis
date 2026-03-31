import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';
import { type NextRequest } from 'next/server';

const handlers = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (e) {
    console.error('[auth:GET]', req.nextUrl.pathname, e);
    throw e;
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (e) {
    console.error('[auth:POST]', req.nextUrl.pathname, e);
    throw e;
  }
}
