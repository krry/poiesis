import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 30;

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'google/gemini-3.1-flash-image-preview';

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (prompt.length > 1_000) {
    return NextResponse.json({ error: 'Prompt too long (max 1,000 chars)' }, { status: 400 });
  }

  try {
    const result = await generateText({
      model: gateway(IMAGE_MODEL),
      prompt,
      providerOptions: {
        google: { responseModalities: ['IMAGE'] },
      },
      abortSignal: AbortSignal.timeout(25_000),
    });

    const file = result.files?.[0];
    if (!file) throw new Error(`No image returned (model: ${IMAGE_MODEL})`);

    return NextResponse.json({ type: 'b64', value: `data:${file.mediaType ?? 'image/jpeg'};base64,${file.base64}` });
  } catch (err) {
    console.error('[image] gateway failed:', err instanceof Error ? err.message : err);
    // Client will fall back to Pollinations directly (CORS-open)
    return NextResponse.json({ error: 'Image generation unavailable' }, { status: 503 });
  }
}
