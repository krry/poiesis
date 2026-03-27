import { notFound } from 'next/navigation';
import { getSession, initDb } from '@/lib/db';
import CuratorView from '@/components/curator-view';

export default async function ReadPage({ params }: { params: Promise<{ id: string }> }) {
  await initDb();
  const { id } = await params;
  const session = await getSession(id);
  if (!session?.editorResult) notFound();

  return (
    <CuratorView
      editorResult={session.editorResult}
      imageHints={session.imageHints}
    />
  );
}
