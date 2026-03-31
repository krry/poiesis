'use client';

import { createAuthClient } from 'better-auth/react';

// NEXT_PUBLIC_AUTH_URL points to Ouracle's betterAuth server in production
// so OAuth callback URLs (Google, GitHub, Apple) stay at api.ouracle.kerry.ink.
// betterAuth redirects back to Poiesis after OAuth via the callbackURL state param.
// Falls back to local server for email/password in dev.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
