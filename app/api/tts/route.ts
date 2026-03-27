import { NextRequest, NextResponse } from 'next/server';

const ELEVENLABS_KEY   = process.env.ELEVENLABS_API_KEY;
const FISH_AUDIO_KEY   = process.env.FISH_AUDIO_KEY;
const ELEVENLABS_VOICE = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';
const FISH_VOICE       = process.env.FISH_AUDIO_VOICE_ID || '';

const TTS_PROVIDER = ELEVENLABS_KEY ? 'elevenlabs' : FISH_AUDIO_KEY ? 'fish' : null;

async function elevenlabs(text: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_KEY!,
        'content-type': 'application/json',
        accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!resp.ok) throw new Error(`ElevenLabs ${resp.status}: ${await resp.text()}`);
  return { buffer: await resp.arrayBuffer(), contentType: 'audio/mpeg' };
}

async function fishAudio(text: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  const body: Record<string, unknown> = { text, format: 'mp3', latency: 'normal' };
  if (FISH_VOICE) body.reference_id = FISH_VOICE;

  const resp = await fetch('https://api.fish.audio/v1/tts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${FISH_AUDIO_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`fish.audio ${resp.status}: ${await resp.text()}`);
  return { buffer: await resp.arrayBuffer(), contentType: 'audio/mpeg' };
}

export async function POST(req: NextRequest) {
  if (!TTS_PROVIDER) {
    return NextResponse.json({ error: 'No server TTS configured' }, { status: 400 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const { buffer, contentType } = TTS_PROVIDER === 'elevenlabs'
    ? await elevenlabs(text)
    : await fishAudio(text);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Content-Length': String(buffer.byteLength),
    },
  });
}
