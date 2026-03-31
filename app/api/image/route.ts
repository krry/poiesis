import { NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { gateway } from '@ai-sdk/gateway';

export const maxDuration = 60;

const IMAGE_MODEL = process.env.IMAGE_MODEL || 'google/gemini-3.1-flash-image-preview';

type ImageResult = { type: 'b64'; value: string };

// Proxy Pollinations server-side — their nologo param now requires auth on the
// new gen.pollinations.ai subdomain, causing 401s when the browser fetches directly.
async function pollinationsImage(prompt: string): Promise<ImageResult> {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&seed=${seed}&nologo=true`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!resp.ok) throw new Error(`Pollinations ${resp.status}`);
  const mime = resp.headers.get('content-type') ?? 'image/jpeg';
  const buf = await resp.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  return { type: 'b64', value: `data:${mime};base64,${b64}` };
}

async function gatewayImage(prompt: string): Promise<ImageResult> {
  const result = await generateText({
    model: gateway(IMAGE_MODEL),
    prompt,
    providerOptions: {
      google: { responseModalities: ['IMAGE'] },
    },
    abortSignal: AbortSignal.timeout(30_000),
  });

  const file = result.files?.[0];
  if (!file) throw new Error(`Gateway returned no image file (model: ${IMAGE_MODEL})`);

  const mime = file.mediaType ?? 'image/jpeg';
  const b64  = file.base64;
  if (!b64) throw new Error('Gateway image missing base64 data');

  return { type: 'b64', value: `data:${mime};base64,${b64}` };
}

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (prompt.length > 1_000) {
    return NextResponse.json({ error: 'Prompt too long (max 1,000 chars)' }, { status: 400 });
  }

  let result: ImageResult;
  try {
    result = await gatewayImage(prompt);
  } catch (gatewayErr) {
    console.error('[image] gateway failed:', gatewayErr instanceof Error ? gatewayErr.message : gatewayErr);
    try {
      result = await pollinationsImage(prompt);
    } catch (pollinationsErr) {
      console.error('[image] pollinations failed:', pollinationsErr instanceof Error ? pollinationsErr.message : pollinationsErr);
      return NextResponse.json({ error: 'Image generation unavailable' }, { status: 503 });
    }
  }
  return NextResponse.json(result);
}
