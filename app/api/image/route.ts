import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_KEY         = process.env.GOOGLE_API_KEY;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.0-flash-preview-image-generation';

type ImageResult = { type: 'url'; value: string } | { type: 'b64'; value: string };

function pollinationsImage(prompt: string): ImageResult {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`;
  return { type: 'url', value: url };
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

  const result = GOOGLE_KEY ? await geminiImage(prompt) : pollinationsImage(prompt);
  return NextResponse.json(result);
}
