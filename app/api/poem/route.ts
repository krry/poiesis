import { NextRequest, NextResponse } from 'next/server';
import { EDITOR_SYSTEM_PROMPT, buildEditorUserMessage } from '@/lib/editor-prompt';

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;

const TEXT_PROVIDER  = ANTHROPIC_KEY ? 'anthropic' : 'openrouter';
const DEFAULT_MODEL  = ANTHROPIC_KEY ? 'claude-sonnet-4-5' : 'meta-llama/llama-3.1-8b-instruct:free';
const TEXT_MODEL     = process.env.MODEL || DEFAULT_MODEL;

async function callLLM(system: string, user: string): Promise<string> {
  if (TEXT_PROVIDER === 'anthropic') {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: TEXT_MODEL,
        max_tokens: 4096,
        system,
        messages: [{ role: 'user', content: [{ type: 'text', text: user }] }],
      }),
    });
    if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
    const data = await resp.json();
    return data.content?.[0]?.text ?? '';
  }

  // OpenRouter (OpenAI-compatible)
  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': 'https://poiesis.app',
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
  if (!ANTHROPIC_KEY && !OPENROUTER_KEY) {
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
    // Return raw for debugging if JSON parse fails
    return NextResponse.json({ raw }, { status: 200 });
  }

  return NextResponse.json(parsed);
}
