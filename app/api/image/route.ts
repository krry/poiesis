import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_KEY         = process.env.GOOGLE_API_KEY;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';

type ImageResult = { type: 'b64'; value: string };

// Proxy Pollinations server-side — their nologo param now requires auth on the
// new gen.pollinations.ai subdomain, causing 401s when the browser fetches directly.
async function pollinationsImage(prompt: string): Promise<ImageResult> {
  const seed = Math.floor(Math.random() * 2 ** 31);
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&seed=${seed}`;
  const resp = await fetch(url, { headers: { Referer: 'https://poiesis.kerry.ink' } });
  if (!resp.ok) throw new Error(`Pollinations ${resp.status}`);
  const mime = resp.headers.get('content-type') ?? 'image/jpeg';
  const buf = await resp.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  return { type: 'b64', value: `data:${mime};base64,${b64}` };
}

async function geminiImage(prompt: string): Promise<ImageResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GOOGLE_KEY}`;
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ['IMAGE'] },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const part = data.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData,
  );
  if (!part) throw new Error('Gemini returned no image');
  const { data: b64, mimeType } = part.inlineData;
  return { type: 'b64', value: `data:${mimeType};base64,${b64}` };
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
    result = GOOGLE_KEY ? await geminiImage(prompt) : await pollinationsImage(prompt);
  } catch {
    if (GOOGLE_KEY) {
      // Gemini failed — try Pollinations
      try {
        result = await pollinationsImage(prompt);
      } catch {
        return NextResponse.json({ error: 'Image generation unavailable' }, { status: 503 });
      }
    } else {
      return NextResponse.json({ error: 'Image generation unavailable' }, { status: 503 });
    }
  }
  return NextResponse.json(result);
}
