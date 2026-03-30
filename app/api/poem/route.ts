import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';
import { EDITOR_SYSTEM_PROMPT, buildEditorUserMessage } from '@/lib/editor-prompt';

// Allow up to 30s for the serverless function
export const maxDuration = 30;

const MODEL = process.env.POEM_MODEL || 'groq/llama-3.1-8b-instant';

export async function POST(req: NextRequest) {
  const { poem, styleHints, imageHints, audioHints } = await req.json();
  if (!poem?.trim()) {
    return NextResponse.json({ error: 'poem is required' }, { status: 400 });
  }
  if (poem.length > 10_000) {
    return NextResponse.json({ error: 'Poem too long (max 10,000 chars)' }, { status: 400 });
  }

  const userMessage = buildEditorUserMessage(poem, styleHints, imageHints, audioHints);

  let raw: string;
  try {
    const result = await generateText({
      model: gateway(MODEL),
      system: EDITOR_SYSTEM_PROMPT,
      prompt: userMessage,
      abortSignal: AbortSignal.timeout(25_000),
    });
    raw = result.text;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `LLM error: ${msg}` }, { status: 502 });
  }

  // Extract JSON object — tolerate markdown fences and surrounding prose from the model
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const cleaned = jsonMatch ? jsonMatch[0] : raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json({ error: 'LLM returned unparseable response', raw }, { status: 422 });
  }

  return NextResponse.json(parsed);
}
