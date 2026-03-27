import { NextRequest, NextResponse } from 'next/server';
import { getSession, initDb } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await initDb();
  const { id } = await params;
  const session = await getSession(id);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(session);
}
