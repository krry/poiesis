// ── State ────────────────────────────────────────────────────────────────────

let serverInfo = { textProvider: "?", imageProvider: "pollinations", ttsProvider: "browser" };

// ── DOM refs ─────────────────────────────────────────────────────────────────

const runBtn         = document.getElementById("run-btn");
const statusEl       = document.getElementById("status");
const errorEl        = document.getElementById("error");
const poemInput      = document.getElementById("poem-input");
const imageHintsInput = document.getElementById("image-hints");
const audioHintsInput = document.getElementById("audio-hints");
const providerBadge  = document.getElementById("provider-badge");

const panelPoem        = document.getElementById("panel-poem");
const panelAnnotations = document.getElementById("panel-annotations");
const panelMidjourney  = document.getElementById("panel-midjourney");
const panelNarration   = document.getElementById("panel-narration");

const tabs   = document.querySelectorAll(".tab");
const panels = { poem: panelPoem, annotations: panelAnnotations, midjourney: panelMidjourney, narration: panelNarration };

// ── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const resp = await fetch("/api/info");
    serverInfo = await resp.json();
    if (providerBadge) {
      providerBadge.textContent = `${serverInfo.textProvider} · img: ${serverInfo.imageProvider} · tts: ${serverInfo.ttsProvider}`;
    }
  } catch {
    // non-fatal
  }
}

init();

// ── Tabs ─────────────────────────────────────────────────────────────────────

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const name = tab.dataset.tab;
    tabs.forEach(t => t.classList.toggle("active", t === tab));
    Object.entries(panels).forEach(([key, panel]) => panel.classList.toggle("active", key === name));
  });
});

// ── Compose ───────────────────────────────────────────────────────────────────

runBtn.addEventListener("click", async () => {
  const poem = poemInput.value.trim();
  if (!poem) { errorEl.textContent = "Give me at least one line of a poem."; return; }

  errorEl.textContent = "";
  runBtn.disabled = true;
  statusEl.textContent = "Asking the oracle...";
  panelPoem.textContent = "";
  panelAnnotations.replaceChildren();
  panelMidjourney.replaceChildren();
  panelNarration.replaceChildren();

  try {
    const resp = await fetch("/api/poem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poem,
        imageHints: imageHintsInput.value.trim() || null,
        audioHints: audioHintsInput.value.trim() || null,
      }),
    });

    if (!resp.ok) throw new Error(`${resp.status} ${await resp.text()}`);

    const data = await resp.json();
    renderPoem(data);
    renderAnnotations(data);
    renderMidjourney(data);
    renderNarration(data);
    statusEl.textContent = "Done.";
  } catch (err) {
    console.error(err);
    errorEl.textContent = `Error: ${err.message}`;
    statusEl.textContent = "Error.";
  } finally {
    runBtn.disabled = false;
  }
});

// ── Render: poem ──────────────────────────────────────────────────────────────

function renderPoem(data) {
  panelPoem.textContent = data.polished || data.raw || "";
}

// ── Render: annotations ───────────────────────────────────────────────────────

function renderAnnotations(data) {
  const anns = data.annotations || [];
  if (!anns.length) { panelAnnotations.textContent = "No annotations."; return; }

  panelAnnotations.replaceChildren();
  for (const ann of anns) {
    const div   = document.createElement("div");
    div.className = "annotation";

    const stage = el("div", "stage", ann.stage || "");
    const lines = el("div", "lines", lineRange(ann.lines));
    const note  = el("div", "note",  ann.note || "");

    div.append(stage, lines, note);
    panelAnnotations.appendChild(div);
  }
}

// ── Render: midjourney ────────────────────────────────────────────────────────

function renderMidjourney(data) {
  const prompts = data.midjourney_prompts || [];
  if (!prompts.length) { panelMidjourney.textContent = "No Midjourney prompts."; return; }

  panelMidjourney.replaceChildren();
  for (const p of prompts) {
    const block = document.createElement("div");
    block.className = "prompt-block";

    // Header row: stanza label + copy + generate buttons
    const hdr  = document.createElement("div");
    hdr.className = "prompt-header";

    const h3 = el("h3", "", `Stanza ${p.stanza ?? "?"} · ${lineRange(p.lines)}`);

    const copyBtn = btn("Copy", async () => {
      await navigator.clipboard.writeText(p.prompt || "");
      copyBtn.textContent = "Copied";
      setTimeout(() => { copyBtn.textContent = "Copy"; }, 1500);
    });
    copyBtn.className = "btn-small";

    const genBtn = btn("Generate ↓", () => generateImage(block, p.prompt || "", genBtn));
    genBtn.className = "btn-small btn-accent";

    hdr.append(h3, copyBtn, genBtn);

    const body = el("div", "prompt-text", p.prompt || "");
    const imgArea = document.createElement("div");
    imgArea.className = "img-area";

    block.append(hdr, body, imgArea);
    panelMidjourney.appendChild(block);
  }
}

async function generateImage(block, prompt, triggerBtn) {
  const imgArea = block.querySelector(".img-area");
  triggerBtn.disabled = true;
  triggerBtn.textContent = "Generating…";
  imgArea.replaceChildren();

  const loadingEl = el("div", "img-loading", "generating…");
  imgArea.appendChild(loadingEl);

  try {
    const resp = await fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const result = await resp.json();
    imgArea.replaceChildren();

    const img = document.createElement("img");
    img.className = "generated-img";
    img.alt = "Generated image";
    img.src = result.value; // works for both URL and data URL
    imgArea.appendChild(img);
  } catch (err) {
    imgArea.replaceChildren();
    imgArea.appendChild(el("div", "img-error", `Error: ${err.message}`));
  } finally {
    triggerBtn.disabled = false;
    triggerBtn.textContent = "Regenerate ↓";
  }
}

// ── Render: narration ─────────────────────────────────────────────────────────

function renderNarration(data) {
  const lines = data.narration_script || [];
  if (!lines.length) { panelNarration.textContent = "No narration script."; return; }

  panelNarration.replaceChildren();
  for (const line of lines) {
    const div = document.createElement("div");
    div.className = "cue-line";

    const metaRow = document.createElement("div");
    metaRow.className = "cue-meta-row";

    const meta = el("span", "meta", `${lineRange(line.lines)} ${line.cue || ""}`);
    const speakBtn = btn("▶", () => speak(line.text || "", line.cue || "", speakBtn));
    speakBtn.className = "btn-speak";

    metaRow.append(meta, speakBtn);

    const text = el("div", "text", line.text || "");
    div.append(metaRow, text);
    panelNarration.appendChild(div);
  }
}

async function speak(text, cue, triggerBtn) {
  if (!text) return;

  if (serverInfo.ttsProvider === "browser") {
    speakBrowser(text, cue);
    return;
  }

  triggerBtn.disabled = true;
  triggerBtn.textContent = "…";

  try {
    const resp = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!resp.ok) throw new Error(await resp.text());

    const blob = await resp.blob();
    const url  = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener("ended", () => URL.revokeObjectURL(url));
    await audio.play();
  } catch (err) {
    console.error("TTS error:", err);
    // Fallback to browser TTS on failure
    speakBrowser(text, cue);
  } finally {
    triggerBtn.disabled = false;
    triggerBtn.textContent = "▶";
  }
}

function speakBrowser(text, _cue) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.rate  = 0.9;
  utt.pitch = 1.0;
  window.speechSynthesis.speak(utt);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className   = cls;
  if (text) e.textContent = text;
  return e;
}

function btn(label, onClick) {
  const b = document.createElement("button");
  b.textContent = label;
  b.addEventListener("click", onClick);
  return b;
}

function lineRange([start, end] = []) {
  if (start == null) return "";
  return `lines ${start}${end && end !== start ? "–" + end : ""}`;
}
