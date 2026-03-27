import { NextRequest, NextResponse } from 'next/server';
import { EDITOR_SYSTEM_PROMPT, buildEditorUserMessage } from '@/lib/editor-prompt';

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

// openrouter/free auto-routes to whichever free model has capacity — $0 cost
const TEXT_MODEL = process.env.MODEL || 'openrouter/free';

async function callLLM(system: string, user: string): Promise<string> {
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
  if (!OPENROUTER_KEY) {
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
