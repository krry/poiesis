import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 15;

const MODEL = process.env.POEM_MODEL || 'groq/llama-3.1-8b-instant';

const SYSTEM = `You are a poetry editor's assistant. Given a poem draft, suggest contextual hints for three fields.
Respond ONLY with a JSON object — no prose, no markdown fences.
Schema: { "style": string, "image": string, "voice": string }
- style: 2-4 poets or aesthetic traditions the poem echoes (comma-separated)
- image: a vivid 5-10 word visual mood phrase
- voice: a 5-10 word narration direction phrase`;

export async function POST(req: NextRequest) {
  const { poem } = await req.json();
  if (!poem?.trim()) {
    return NextResponse.json({ error: 'poem is required' }, { status: 400 });
  }

  let raw: string;
  try {
    const result = await generateText({
      model: gateway(MODEL),
      system: SYSTEM,
      prompt: `Poem:\n${poem.slice(0, 2000)}`,
      abortSignal: AbortSignal.timeout(12_000),
    });
    raw = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `LLM error: ${msg}` }, { status: 502 });
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const cleaned = jsonMatch ? jsonMatch[0] : raw.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json({ error: 'unparseable', raw }, { status: 422 });
  }
}
