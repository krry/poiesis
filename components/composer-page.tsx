'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PoetryEditor from './poetry-editor';
import type { EditorResult, Pipeline } from '@/lib/types';
import { Gift } from 'lucide-react';
import { TAROT } from '@/lib/tarot';
import { randomClassic } from '@/lib/poem-library';
import { ThemeToggle } from '@/components/theme-toggle';
import { AuthWidget } from '@/components/auth-widget';

const FONTS = [
  { id: 'inconsolata', label: 'Inconsolata' },
  { id: 'fira-code',   label: 'Fira Code' },
  { id: 'recursive',   label: 'Recursive' },
  { id: 'geist-mono',  label: 'Geist Mono' },
];

const FONT_VARS: Record<string, string> = {
  inconsolata:  'var(--font-inconsolata)',
  'fira-code':  'var(--font-fira-code)',
  recursive:    'var(--font-recursive)',
  'geist-mono': 'var(--font-geist-mono)',
};

// ── Flow steps (words → look → feel → sound → magic) ─────────────────────────

const FLOW_STEPS = ['words', 'look', 'feel', 'sound', 'magic'] as const;
type FlowStep = typeof FLOW_STEPS[number];

const PIPELINE_TO_FLOW: Record<Pipeline, FlowStep | null> = {
  idle: null, editing: 'words', illustrating: 'look',
  narrating: 'sound', done: 'magic', error: null,
};

// keep legacy labels for the loading indicator text
const PIPELINE_LABEL: Record<Pipeline, string> = {
  idle: '', editing: 'words', illustrating: 'look',
  narrating: 'sound', done: 'magic', error: 'error',
};

const PIPELINE_PCT: Record<Pipeline, number> = {
  idle: 0, editing: 30, illustrating: 70, narrating: 85, done: 100, error: 100,
};

interface Suggestions { style: string; image: string; voice: string; }

// localStorage keys
const SK = {
  poem:  'poiesis:poem',
  style: 'poiesis:styleHints',
  image: 'poiesis:imageHints',
  audio: 'poiesis:audioHints',
  font:  'poiesis:font',
} as const;

function ls(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch {}
}

// ── Braille spinner ────────────────────────────────────────────────────────────

const BRAILLE = ['⣾','⣽','⣻','⢿','⡿','⣟','⣯','⣷'];

function BrailleSpinner({ className = '' }: { className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI(n => (n + 1) % BRAILLE.length), 100);
    return () => clearInterval(t);
  }, []);
  return <span className={className} aria-hidden>{BRAILLE[i]}</span>;
}

// ── HintField ─────────────────────────────────────────────────────────────────

interface HintFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  suggestion: string | null;
}

function HintField({ label, value, onChange, placeholder, suggestion }: HintFieldProps) {
  function applySuggestion() {
    const sep = value.trim() ? ', ' : '';
    onChange(value.trim() + sep + suggestion);
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
      />
      {suggestion && (
        <button
          onClick={applySuggestion}
          className="self-start text-[11px] text-muted-foreground/50 hover:text-muted-foreground transition-colors italic"
        >
          ✦ {suggestion}
        </button>
      )}
    </label>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────────

export default function ComposerPage() {
  const router = useRouter();

  const [poem, setPoem]         = useState('');
  const [styleHints, setStyle]  = useState('');
  const [imageHints, setImage]  = useState('');
  const [audioHints, setAudio]  = useState('');
  const [font, setFont]         = useState('inconsolata');
  const [hydrated, setHydrated] = useState(false);
  const [pipeline, setPipeline] = useState<Pipeline>('idle');
  const [result, setResult]     = useState<EditorResult | null>(null);
  const [error, setError]       = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [surpriseMode, setSurpriseMode] = useState<'tarot' | 'classics'>('tarot');
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const suggestTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultPaneRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage once on mount
  useEffect(() => {
    setPoem(ls(SK.poem));
    setStyle(ls(SK.style));
    setImage(ls(SK.image));
    setAudio(ls(SK.audio));
    const savedFont = ls(SK.font);
    if (savedFont) setFont(savedFont);
    setHydrated(true);
  }, []);

  const fetchSuggestions = useCallback(async (text: string) => {
    if (!text.trim() || text.trim().length < 20) return;
    setSuggesting(true);
    try {
      const resp = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poem: text }),
        signal: AbortSignal.timeout(14_000),
      });
      if (resp.ok) setSuggestions(await resp.json());
    } catch {
      // suggestions are best-effort — silent failure
    } finally {
      setSuggesting(false);
    }
  }, []);

  // Idle-timer: suggest 3s after typing stops (only if poem changed and hints are sparse)
  useEffect(() => {
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    if (!poem.trim() || poem.trim().length < 20) return;
    suggestTimer.current = setTimeout(() => fetchSuggestions(poem), 3000);
    return () => { if (suggestTimer.current) clearTimeout(suggestTimer.current); };
  }, [poem, fetchSuggestions]);

  // Persisting setters
  function updatePoem(v: string)  { setPoem(v);  lsSet(SK.poem,  v); }
  function updateStyle(v: string) { setStyle(v); lsSet(SK.style, v); }
  function updateImage(v: string) { setImage(v); lsSet(SK.image, v); }
  function updateAudio(v: string) { setAudio(v); lsSet(SK.audio, v); }
  function updateFont(v: string)  { setFont(v);  lsSet(SK.font,  v); }

  function clearAll() {
    updatePoem(''); updateStyle(''); updateImage(''); updateAudio('');
    setResult(null); setSessionId(null); setError(''); setSaveWarning('');
    setPipeline('idle');
  }

  function surprise() {
    setSuggestions(null);
    if (surpriseMode === 'tarot') {
      const written = TAROT.filter(c => c.poem);
      const card = written[Math.floor(Math.random() * written.length)];
      updatePoem(card.poem!);
    } else {
      updatePoem(randomClassic().text);
    }
  }

  function handleEditorBlur() {
    if (suggestTimer.current) { clearTimeout(suggestTimer.current); suggestTimer.current = null; }
    fetchSuggestions(poem);
  }

  const busy = pipeline !== 'idle' && pipeline !== 'done' && pipeline !== 'error';

  async function compose() {
    if (!poem.trim()) { setError('Add at least one line of a poem.'); return; }
    setError('');
    setSaveWarning('');
    setResult(null);
    setSessionId(null);
    setPipeline('editing');

    try {
      const editResp = await fetch('/api/poem', {
        method: 'POST',
        signal: AbortSignal.timeout(32_000),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poem, styleHints, imageHints, audioHints }),
      });
      if (!editResp.ok) throw new Error(await editResp.text());
      const editorResult: EditorResult = await editResp.json();
      setResult(editorResult);
      setPipeline('illustrating');

      const saveResp = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawPoem: poem, styleHints, imageHints, audioHints, editorResult }),
      });
      if (saveResp.ok) {
        const { id } = await saveResp.json();
        setSessionId(id);
      } else {
        setSaveWarning('Session could not be saved — results are still usable above.');
      }

      setPipeline('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPipeline('error');
    }
  }

  useEffect(() => {
    if (result) {
      resultPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const pct = PIPELINE_PCT[pipeline];

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background md:h-screen md:overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
            Poiesis
          </span>
          {hydrated && (poem || styleHints || imageHints || audioHints) && !busy && (
            <button
              onClick={() => {
                const dirty = poem && !result;
                if (dirty && !confirm('Clear everything and start fresh?')) return;
                clearAll();
              }}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              New
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <AuthWidget />
          <ThemeToggle />
        </div>
      </header>

      {/* Main — stacks on mobile, splits on desktop */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">

        {/* Left: input */}
        <div className="flex flex-col border-b md:border-b-0 md:border-r border-border md:w-[44%] md:overflow-hidden">

          {/* Scrollable content area */}
          <div className="flex flex-col flex-1 min-h-0 gap-3 p-4 md:p-6 overflow-y-auto">

            {/* Editor — fills available height */}
            <div className="flex-1 min-h-[13rem] flex flex-col gap-1">
              <span className="text-xs text-muted-foreground/40 uppercase tracking-widest select-none">Lyrics or verses ↓</span>
              <PoetryEditor
                value={poem}
                onChange={updatePoem}
                onSubmit={compose}
                onBlur={handleEditorBlur}
                font={font}
                className="flex-1"
                placeholder={"One need not be a Chamber — to be Haunted —\nOne need not be a House —\nThe Brain has Corridors — surpassing\nMaterial Place —\nFar safer, of a Midnight — meeting\nExternal Ghost —\nThan an Interior — confronting —\nThat Cooler Host —\nFar safer, through an Abbey — gallop —\nThe Stones a'chase —\nThan Moonless — One's A'self encounter —\nIn lonesome Place —\nOurself — behind Ourself — Concealed —\nShould startle — most —\nAssassin — hid in Our Apartment —\nBe Horror's least —\nThe Prudent — carries a Revolver —\nHe bolts the Door —\nO'erlooking a Superior Spectre —\nMore near —"}
              />
            </div>

            {/* Controls row: font, surprise mode, surprise */}
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={font}
                onChange={e => updateFont(e.target.value)}
                style={{ fontFamily: FONT_VARS[font] }}
                className="text-xs bg-transparent border border-border rounded px-2 py-1 text-muted-foreground focus:outline-none focus:border-ring cursor-pointer"
              >
                {FONTS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>

              <button
                onClick={() => setSurpriseMode(m => m === 'tarot' ? 'classics' : 'tarot')}
                className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1 rounded border border-border/50 hover:border-border"
                title={surpriseMode === 'tarot' ? 'Switch to classics' : 'Switch to tarot'}
              >
                <span>{surpriseMode === 'tarot' ? '🎴' : '📜'}</span>
                <span>{surpriseMode === 'tarot' ? 'Tarot' : 'Classics'}</span>
              </button>

              <button
                onClick={surprise}
                title="Surprise me"
                aria-label="Surprise me with a poem"
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors text-xs"
              >
                <Gift size={13} />
                <span>Surprise</span>
              </button>
            </div>

            {/* Embellishments */}
            <details className="group shrink-0">
              <summary className="cursor-pointer select-none py-2.5 px-4 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
                <span>Embellishments</span>
                {suggesting && <BrailleSpinner className="text-muted-foreground/40 font-mono text-sm" />}
                <span className="text-muted-foreground/40 transition-transform duration-200 group-open:rotate-180">▾</span>
              </summary>
              <div className="mt-3 flex flex-col gap-3">
                <HintField
                  label="Lyrical style"
                  value={styleHints}
                  onChange={updateStyle}
                  placeholder="e.g. Lucille Clifton, late Neruda, wabi-sabi…"
                  suggestion={suggestions?.style ?? null}
                />
                <HintField
                  label="Visual style"
                  value={imageHints}
                  onChange={updateImage}
                  placeholder="e.g. cold neon city, wet pavement, sodium haze…"
                  suggestion={suggestions?.image ?? null}
                />
                <HintField
                  label="Oral style"
                  value={audioHints}
                  onChange={updateAudio}
                  placeholder="e.g. low, intimate, slow with long silences…"
                  suggestion={suggestions?.voice ?? null}
                />
              </div>
            </details>

            {error && <p className="text-destructive text-sm shrink-0">{error}</p>}
            {saveWarning && <p className="text-yellow-500/80 text-xs shrink-0">{saveWarning}</p>}
          </div>

          {/* Compose — anchored CTA at bottom of left column */}
          <div className="shrink-0 px-4 md:px-6 py-4 border-t border-border">
            <button
              onClick={compose}
              disabled={busy}
              className="w-full py-3 rounded-full bg-primary text-primary-foreground text-base font-semibold disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {busy ? `${PIPELINE_LABEL[pipeline]}…` : 'Compose'}
            </button>
          </div>
        </div>

        {/* Right: results */}
        <div ref={resultPaneRef} className="flex flex-col flex-1 md:overflow-hidden">
          {/* Progress bar */}
          <div className="h-0.5 bg-border shrink-0 relative overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
              style={{ width: `${pct}%`, opacity: pipeline === 'idle' ? 0 : 1 }}
            />
            {busy && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]" />
            )}
          </div>

          <div className="flex-1 md:overflow-y-auto p-4 md:p-6">
            {!result && pipeline === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full min-h-[10rem] gap-4">
                <div className="flex items-center gap-0.5 text-[11px] font-mono">
                  {FLOW_STEPS.map((step, i) => (
                    <span key={step} className="flex items-center gap-0.5">
                      <span className="px-1.5 py-0.5 rounded text-muted-foreground/30">{step}</span>
                      {i < FLOW_STEPS.length - 1 && <span className="text-muted-foreground/20">→</span>}
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground/30 text-sm tracking-widest uppercase select-none">
                  your composition will appear here
                </p>
              </div>
            )}
            {!result && busy && (
              <div className="flex flex-col items-center justify-center min-h-[12rem] md:h-full gap-4">
                <div className="flex items-center gap-0.5 text-[11px] font-mono">
                  {FLOW_STEPS.map((step, i) => {
                    const activeStep = PIPELINE_TO_FLOW[pipeline];
                    const activeIdx  = activeStep ? FLOW_STEPS.indexOf(activeStep) : -1;
                    const isActive   = step === activeStep;
                    const isPast     = activeIdx >= 0 && i < activeIdx;
                    return (
                      <span key={step} className="flex items-center gap-0.5">
                        <span className={[
                          isActive ? 'text-foreground animate-pulse' :
                          isPast   ? 'text-muted-foreground/50' :
                                     'text-muted-foreground/20',
                        ].join(' ')}>
                          {step}
                        </span>
                        {i < FLOW_STEPS.length - 1 && <span className="text-muted-foreground/20">→</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {result && (
              <IntegratedView result={result} font={font} />
            )}
          </div>

          {/* Play — anchored CTA at bottom of results pane */}
          {sessionId && (
            <div className="shrink-0 px-4 md:px-6 py-4 border-t border-border">
              <button
                onClick={() => router.push(`/read/${sessionId}`)}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground text-base font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                ▶ Play
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}

// ── Integrated poem + annotations + images + narration ─────────────────────────

interface StanzaBlock {
  lines: string[];
  startLine: number;
}

function parseStanzas(polished: string): StanzaBlock[] {
  const allLines = polished.split('\n');
  const out: StanzaBlock[] = [];
  let current: string[] = [];
  let stanzaStart = 1;
  let lineNum = 1;
  for (const line of allLines) {
    if (line.trim() === '') {
      if (current.length) {
        out.push({ lines: current, startLine: stanzaStart });
        current = [];
        stanzaStart = lineNum + 1;
      }
    } else {
      current.push(line);
    }
    lineNum++;
  }
  if (current.length) out.push({ lines: current, startLine: stanzaStart });
  return out;
}

function IntegratedView({ result, font }: { result: EditorResult; font: string }) {
  const fontFamily = FONT_VARS[font] ?? FONT_VARS.inconsolata;

  const [images, setImages] = useState<Record<number, { url?: string; loading?: boolean; error?: string }>>({});
  const [playingIdx, setPlayingIdx] = useState(-1);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const stanzas = useMemo(() => parseStanzas(result.polished ?? ''), [result.polished]);

  async function generateImage(stanzaNum: number, prompt: string) {
    setImages(prev => ({ ...prev, [stanzaNum]: { loading: true } }));
    try {
      const resp = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setImages(prev => ({ ...prev, [stanzaNum]: { url: data.value } }));
    } catch (err) {
      setImages(prev => ({ ...prev, [stanzaNum]: { error: String(err) } }));
    }
  }

  async function toggleNarration(idx: number, text: string) {
    audioRef.current?.pause();
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    window.speechSynthesis?.cancel();

    if (playingIdx === idx) { setPlayingIdx(-1); return; }
    setPlayingIdx(idx);

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.addEventListener('ended', () => {
        URL.revokeObjectURL(url);
        blobUrlRef.current = null;
        setPlayingIdx(-1);
      });
      audio.play();
    } catch {
      if ('speechSynthesis' in window) {
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 0.9;
        utt.addEventListener('end', () => setPlayingIdx(-1));
        window.speechSynthesis.speak(utt);
      } else {
        setPlayingIdx(-1);
      }
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <pre aria-hidden className="sr-only">{result.polished}</pre>

      {stanzas.map((stanza, si) => {
        const stanzaEnd = stanza.startLine + stanza.lines.length - 1;

        const mjPrompts = result.midjourney_prompts ?? [];
        const mjp = mjPrompts.find(
          p => p.lines[0] >= stanza.startLine && p.lines[0] <= stanzaEnd,
        );

        const narScript = result.narration_script ?? [];
        const narLines = narScript.filter(
          n => n.lines[0] >= stanza.startLine && n.lines[0] <= stanzaEnd,
        );
        const narText = narLines.map(n => n.text).join(' ');
        const narIdx  = narLines.length ? narScript.indexOf(narLines[0]) : -1;

        const anns = (result.annotations ?? []).filter(
          a => a.lines[0] <= stanzaEnd && a.lines[1] >= stanza.startLine,
        );

        const img = mjp ? images[mjp.stanza] : undefined;

        return (
          <div key={si} className="flex flex-col gap-1.5">
            <div className="flex gap-3 items-start">
              {/* Thumbnail */}
              <div className="shrink-0 w-14 h-14 rounded-md overflow-hidden border border-border/60 bg-muted/20 flex items-center justify-center">
                {img?.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                ) : img?.loading ? (
                  <BrailleSpinner className="text-muted-foreground/50 text-base font-mono" />
                ) : mjp ? (
                  <button
                    onClick={() => generateImage(mjp.stanza, mjp.prompt)}
                    title={mjp.prompt}
                    className="w-full h-full flex items-center justify-center text-muted-foreground/30 hover:text-muted-foreground/70 text-base transition-colors"
                  >
                    +
                  </button>
                ) : null}
              </div>

              {/* Lines */}
              <div className="flex-1 min-w-0">
                {stanza.lines.map((line, li) => {
                  const isLast = li === stanza.lines.length - 1;
                  return (
                    <div key={li} className="flex items-baseline justify-between gap-2 group/line">
                      <span
                        style={{ fontFamily, fontSize: '1rem', lineHeight: '1.9' }}
                        className="text-foreground"
                      >
                        {line || '\u00a0'}
                      </span>
                      {isLast && narIdx >= 0 && (
                        <button
                          onClick={() => toggleNarration(narIdx, narText)}
                          className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full border border-border/50 text-muted-foreground/50 hover:text-foreground hover:border-border transition-colors text-[10px] opacity-0 group-hover/line:opacity-100 focus:opacity-100"
                        >
                          {playingIdx === narIdx ? '⏹' : '▶'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {anns.length > 0 && (
              <div className="pl-[68px] flex flex-col gap-1">
                {anns.map((ann, ai) => (
                  <div key={ai} className="flex items-start gap-2 text-xs">
                    <span className="text-blue-400/70 uppercase tracking-wider shrink-0 pt-px">{ann.stage}</span>
                    <span className="text-muted-foreground leading-relaxed">{ann.note}</span>
                  </div>
                ))}
              </div>
            )}

            {img?.error && (
              <p className="pl-[68px] text-xs text-destructive/70">{img.error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
