import { auth } from '@/lib/auth';
import { getSessionsByUser, initDb } from '@/lib/db';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HistoryPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect('/sign-in');

  await initDb();
  const items = await getSessionsByUser(session.user.id);

  return (
    <div className="min-h-screen bg-background px-4 py-8 max-w-2xl mx-auto">
      <header className="flex items-center justify-between mb-8">
        <div>
          <Link href="/" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
            ← Poiesis
          </Link>
          <h1 className="text-lg font-semibold mt-1">Your compositions</h1>
        </div>
        <p className="text-xs text-muted-foreground/50">{session.user.email}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-muted-foreground/40 text-sm">No compositions yet. <Link href="/" className="underline hover:text-foreground">Write one.</Link></p>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map(item => (
            <li key={item.id}>
              <Link
                href={`/read/${item.id}`}
                className="block rounded-lg border border-border p-4 hover:border-ring transition-colors group"
              >
                <p className="text-sm text-foreground/80 line-clamp-2 font-mono leading-relaxed group-hover:text-foreground transition-colors">
                  {item.rawPoem.trim().split('\n')[0]}
                </p>
                <p className="text-xs text-muted-foreground/40 mt-2">
                  {new Date(item.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
