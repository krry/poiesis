import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { EDITOR_SYSTEM_PROMPT, buildEditorUserMessage } from '@/lib/editor-prompt';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// On Vercel, VERCEL_OIDC_TOKEN is auto-injected — gateway needs no explicit key
const ON_VERCEL     = !!process.env.VERCEL_ENV;

// MODEL env var overrides the default for either path
const MODEL_OVERRIDE = process.env.MODEL;

async function callLLM(system: string, user: string): Promise<string> {
  if (ON_VERCEL) {
    const model = MODEL_OVERRIDE || 'anthropic/claude-haiku-4.5';
    const { text } = await generateText({
      model: gateway(model),
      system,
      messages: [{ role: 'user', content: user }],
      maxOutputTokens: 4096,
    });
    return text;
  }

  // Direct OpenRouter fallback (no gateway key); openrouter/free routes to
  // whichever free model has capacity — no quota exhaustion on any single model
  const model = MODEL_OVERRIDE || 'openrouter/free';
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://poiesis.kerry.ink',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function POST(req: NextRequest) {
  if (!ON_VERCEL && !OPENROUTER_KEY) {
    return NextResponse.json({ error: 'No LLM API key configured' }, { status: 500 });
  }

  const { poem, styleHints, imageHints, audioHints } = await req.json();
  if (!poem?.trim()) {
    return NextResponse.json({ error: 'poem is required' }, { status: 400 });
  }
  if (poem.length > 10_000) {
    return NextResponse.json({ error: 'Poem too long (max 10,000 chars)' }, { status: 400 });
  }

  const userMessage = buildEditorUserMessage(poem, styleHints, imageHints, audioHints);

  const raw = await callLLM(EDITOR_SYSTEM_PROMPT, userMessage);
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ raw }, { status: 200 });
  }

  return NextResponse.json(parsed);
}
