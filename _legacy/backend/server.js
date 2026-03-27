import http from "http";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3738;

// ── Key resolution ───────────────────────────────────────────────────────────

const ANTHROPIC_KEY      = process.env.ANTHROPIC_API_KEY;
const OPENROUTER_KEY     = process.env.OPENROUTER_API_KEY;
const GOOGLE_KEY         = process.env.GOOGLE_API_KEY;
const ELEVENLABS_KEY     = process.env.ELEVENLABS_API_KEY;
const FISH_AUDIO_KEY     = process.env.FISH_AUDIO_KEY;

if (!ANTHROPIC_KEY && !OPENROUTER_KEY) {
  console.error("Missing API key: set ANTHROPIC_API_KEY or OPENROUTER_API_KEY");
  process.exit(1);
}

const TEXT_PROVIDER  = ANTHROPIC_KEY ? "anthropic" : "openrouter";
const IMAGE_PROVIDER = GOOGLE_KEY    ? "gemini"    : "pollinations";
const TTS_PROVIDER   = ELEVENLABS_KEY ? "elevenlabs" : FISH_AUDIO_KEY ? "fish" : "browser";

const DEFAULT_TEXT_MODEL = ANTHROPIC_KEY
  ? "claude-sonnet-4-5"
  : "meta-llama/llama-3.1-8b-instruct:free";
const TEXT_MODEL         = process.env.MODEL || DEFAULT_TEXT_MODEL;
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || "gemini-2.0-flash-preview-image-generation";
const ELEVENLABS_VOICE   = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // Sarah
const FISH_VOICE         = process.env.FISH_AUDIO_VOICE_ID || "";

console.log(`Text: ${TEXT_PROVIDER}/${TEXT_MODEL} | Images: ${IMAGE_PROVIDER} | TTS: ${TTS_PROVIDER}`);

// ── Text LLM ─────────────────────────────────────────────────────────────────

async function callLLM(systemPrompt, userText) {
  return TEXT_PROVIDER === "anthropic"
    ? callAnthropic(systemPrompt, userText)
    : callOpenRouter(systemPrompt, userText);
}

async function callAnthropic(systemPrompt, userText) {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: [{ type: "text", text: userText }] }],
    }),
  });
  if (!resp.ok) throw new Error(`Anthropic ${resp.status}: ${await resp.text()}`);
  return (await resp.json()).content?.[0]?.text ?? "";
}

async function callOpenRouter(systemPrompt, userText) {
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENROUTER_KEY}`,
      "HTTP-Referer": `http://localhost:${PORT}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: TEXT_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: userText },
      ],
    }),
  });
  if (!resp.ok) throw new Error(`OpenRouter ${resp.status}: ${await resp.text()}`);
  return (await resp.json()).choices?.[0]?.message?.content ?? "";
}

// ── Image generation ─────────────────────────────────────────────────────────

// Free: return a stable Pollinations URL — browser fetches it directly
function generateImagePollinations(prompt) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&model=flux&nologo=true`;
  return { type: "url", value: url };
}

// Premium: Gemini returns base64 inline data
async function generateImageGemini(prompt) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_IMAGE_MODEL}:generateContent?key=${GOOGLE_KEY}`;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });
  if (!resp.ok) throw new Error(`Gemini ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const part = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
  if (!part) throw new Error("Gemini returned no image");
  const { data: b64, mimeType } = part.inlineData;
  return { type: "b64", value: `data:${mimeType};base64,${b64}` };
}

async function generateImage(prompt) {
  return IMAGE_PROVIDER === "gemini"
    ? generateImageGemini(prompt)
    : generateImagePollinations(prompt);
}

// ── TTS ──────────────────────────────────────────────────────────────────────

async function synthesizeElevenLabs(text) {
  const resp = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_KEY,
        "content-type": "application/json",
        "accept": "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );
  if (!resp.ok) throw new Error(`ElevenLabs ${resp.status}: ${await resp.text()}`);
  return { buffer: await resp.arrayBuffer(), contentType: "audio/mpeg" };
}

async function synthesizeFishAudio(text) {
  const body = { text, format: "mp3", latency: "normal" };
  if (FISH_VOICE) body.reference_id = FISH_VOICE;

  const resp = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${FISH_AUDIO_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`fish.audio ${resp.status}: ${await resp.text()}`);
  return { buffer: await resp.arrayBuffer(), contentType: "audio/mpeg" };
}

// ── Static file server ───────────────────────────────────────────────────────

const STATIC = {
  "/":           ["index.html", "text/html; charset=utf-8"],
  "/index.html": ["index.html", "text/html; charset=utf-8"],
  "/app.js":     ["app.js",     "application/javascript; charset=utf-8"],
};

async function serveStatic(req, res) {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
  const route = STATIC[pathname];
  if (!route) return false;
  const content = await readFile(path.join(__dirname, route[0]), "utf8");
  res.writeHead(200, { "Content-Type": route[1] });
  res.end(content);
  return true;
}

// ── Route handlers ───────────────────────────────────────────────────────────

function handleInfo(req, res) {
  res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify({
    textProvider:  TEXT_PROVIDER,
    textModel:     TEXT_MODEL,
    imageProvider: IMAGE_PROVIDER,
    ttsProvider:   TTS_PROVIDER,
  }));
}

const SYSTEM_PROMPT = `
You are Poem Studio: a poet-editor, image dramaturg, and voice director.
You ONLY respond with JSON matching the schema described below. No prose, no markdown, no commentary.

You receive:
- A raw poem
- Optional text descriptions of reference images (mood, palette, visual world)
- Optional text descriptions of reference audio (voice tone, pacing, emotional register)

Your job:
1) Polish the poem (meter, rhythm, imagery, natural rhyme, but keep the poet's voice).
2) Add inline annotations: emotional "stage directions" and craft notes per passage.
3) Generate one Midjourney prompt per stanza, informed by the poem and the image hints.
4) Generate a narration script with per-line [cue] directions, informed by the poem and the audio hints.

JSON schema:
{
  "polished": "string",
  "annotations": [
    { "lines": [1, 3], "stage": "string", "note": "string" }
  ],
  "midjourney_prompts": [
    { "stanza": 1, "lines": [1, 4], "prompt": "string" }
  ],
  "narration_script": [
    { "lines": [1, 1], "cue": "[gentle, breathy]", "text": "string" }
  ]
}

Constraints:
- Preserve the underlying meaning and emotional arc.
- Use the image hints to bias visual details and prompts, not to overwrite the poem.
- Use the audio hints to bias cues (tempo, intensity, timbre).
- Always return valid JSON that parses with a strict JSON parser.
`.trim();

async function handlePoemRequest(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end("Method not allowed"); return; }

  let body = "";
  for await (const chunk of req) body += chunk;

  let payload;
  try { payload = JSON.parse(body); }
  catch { res.writeHead(400); res.end("Invalid JSON"); return; }

  const { poem, imageHints, audioHints } = payload;
  const userText =
    `Raw poem:\n${poem}` +
    `\n\nReference images:\n${imageHints || "none"}` +
    `\n\nReference audio:\n${audioHints || "none"}` +
    `\n\nReturn JSON ONLY, matching the schema.`;

  try {
    const content = await callLLM(SYSTEM_PROMPT, userText);
    const cleaned = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ raw: content }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(parsed));
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err.message);
  }
}

async function handleImageRequest(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end("Method not allowed"); return; }

  let body = "";
  for await (const chunk of req) body += chunk;

  let payload;
  try { payload = JSON.parse(body); }
  catch { res.writeHead(400); res.end("Invalid JSON"); return; }

  if (!payload.prompt) { res.writeHead(400); res.end("Missing prompt"); return; }

  try {
    const result = await generateImage(payload.prompt);
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err.message);
  }
}

async function handleTTSRequest(req, res) {
  if (req.method !== "POST") { res.writeHead(405); res.end("Method not allowed"); return; }
  if (TTS_PROVIDER === "browser") { res.writeHead(400); res.end("No server TTS configured"); return; }

  let body = "";
  for await (const chunk of req) body += chunk;

  let payload;
  try { payload = JSON.parse(body); }
  catch { res.writeHead(400); res.end("Invalid JSON"); return; }

  if (!payload.text) { res.writeHead(400); res.end("Missing text"); return; }

  try {
    const { buffer, contentType } = TTS_PROVIDER === "elevenlabs"
      ? await synthesizeElevenLabs(payload.text)
      : await synthesizeFishAudio(payload.text);

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": buffer.byteLength,
    });
    res.end(Buffer.from(buffer));
  } catch (err) {
    console.error(err);
    res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
    res.end(err.message);
  }
}

// ── Router ───────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS");

  if (req.method === "OPTIONS") { res.writeHead(204); res.end(); return; }

  switch (url.pathname) {
    case "/api/info":  handleInfo(req, res);             return;
    case "/api/poem":  await handlePoemRequest(req, res); return;
    case "/api/image": await handleImageRequest(req, res); return;
    case "/api/tts":   await handleTTSRequest(req, res);  return;
  }

  const served = await serveStatic(req, res);
  if (!served) { res.writeHead(404); res.end("Not found"); }
});

server.listen(PORT, () => {
  console.log(`Poem Studio running at http://localhost:${PORT}`);
});
