'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/lib/auth-client';

const HAS_GOOGLE = !!process.env.NEXT_PUBLIC_OAUTH_GOOGLE;
const HAS_GITHUB  = !!process.env.NEXT_PUBLIC_OAUTH_GITHUB;
const HAS_APPLE   = !!process.env.NEXT_PUBLIC_OAUTH_APPLE;

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await signIn.email({ email, password, callbackURL: '/' });
    setBusy(false);
    if (err) { setError(err.message ?? 'Sign in failed'); return; }
    router.push('/');
  }

  async function social(provider: 'google' | 'github' | 'apple') {
    setBusy(true);
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000').trim();
    await signIn.social({ provider, callbackURL: `${base}/` });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div className="text-center">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Poiesis</p>
          <h1 className="text-lg font-semibold">Sign in</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            required
            autoComplete="email"
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ring placeholder:text-muted-foreground/40"
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Password"
            required
            autoComplete="current-password"
            className="w-full bg-muted/30 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-ring placeholder:text-muted-foreground/40"
          />
          {error && <p className="text-destructive text-xs">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
          >
            {busy ? '…' : 'Sign in'}
          </button>
        </form>

        {(HAS_GOOGLE || HAS_GITHUB || HAS_APPLE) && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-muted-foreground/30 text-xs">
              <div className="flex-1 h-px bg-border" /><span>or</span><div className="flex-1 h-px bg-border" />
            </div>
            {HAS_GOOGLE && (
              <button onClick={() => social('google')} disabled={busy}
                className="w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors disabled:opacity-40">
                Continue with Google
              </button>
            )}
            {HAS_GITHUB && (
              <button onClick={() => social('github')} disabled={busy}
                className="w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors disabled:opacity-40">
                Continue with GitHub
              </button>
            )}
            {HAS_APPLE && (
              <button onClick={() => social('apple')} disabled={busy}
                className="w-full py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-ring transition-colors disabled:opacity-40">
                Continue with Apple
              </button>
            )}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground/50">
          No account?{' '}
          <Link href="/sign-up" className="text-muted-foreground hover:text-foreground transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
