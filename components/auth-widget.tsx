'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/lib/auth-client';

export function AuthWidget() {
  const { data: session, isPending } = useSession();

  if (isPending) return null;

  if (!session) {
    return (
      <Link
        href="/sign-in"
        className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/history"
        className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        title="Your compositions"
      >
        {session.user.name ?? session.user.email}
      </Link>
      <button
        onClick={() => signOut()}
        className="text-xs text-muted-foreground/30 hover:text-muted-foreground/70 transition-colors"
      >
        ↩
      </button>
    </div>
  );
}
