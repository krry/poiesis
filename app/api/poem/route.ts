import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { EDITOR_SYSTEM_PROMPT, buildEditorUserMessage } from '@/lib/editor-prompt';

const GATEWAY_KEY    = process.env.AI_GATEWAY_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// Gateway: route to any provider/model via Vercel AI Gateway
// Override with MODEL env var (e.g. "anthropic/claude-sonnet-4.6")
const TEXT_MODEL = process.env.MODEL || 'openrouter/auto';

async function callLLM(system: string, user: string): Promise<string> {
  if (GATEWAY_KEY) {
    const { text } = await generateText({
      model: gateway(TEXT_MODEL),
      system,
      messages: [{ role: 'user', content: user }],
      maxTokens: 4096,
    });
    return text;
  }

  // Direct OpenRouter fallback (no gateway key)
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://poiesis.kerry.ink',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
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
  if (!GATEWAY_KEY && !OPENROUTER_KEY) {
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
