'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PoetryEditor from './poetry-editor';
import type { EditorResult, Pipeline } from '@/lib/types';
import { Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { TAROT } from '@/lib/tarot';
import { randomClassic } from '@/lib/poem-library';

interface OracleCard {
  title: string;
  body: string;
  keywords?: string[];
  deck?: string;
  suit?: string;
}

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

const STEPS: Pipeline[] = ['editing', 'illustrating', 'done'];
const STEP_LABELS: Record<Pipeline, string> = {
  idle: 'idle', editing: 'Editor', illustrating: 'Illustrator',
  narrating: 'Narrator', done: 'Done', error: 'Error',
};

// Progress bar fills across the pipeline stages
const PIPELINE_PCT: Record<Pipeline, number> = {
  idle: 0, editing: 30, illustrating: 70, narrating: 85, done: 100, error: 100,
};

// localStorage keys
const SK = {
  poem:       'poiesis:poem',
  style:      'poiesis:styleHints',
  image:      'poiesis:imageHints',
  audio:      'poiesis:audioHints',
  font:       'poiesis:font',
} as const;

function ls(key: string): string {
  try { return localStorage.getItem(key) ?? ''; } catch { return ''; }
}
function lsSet(key: string, val: string) {
  try { localStorage.setItem(key, val); } catch { /* quota/private browsing */ }
}

export default function ComposerPage() {
  const router = useRouter();

  const [poem, setPoem]           = useState('');
  const [styleHints, setStyle]    = useState('');
  const [imageHints, setImage]    = useState('');
  const [audioHints, setAudio]    = useState('');
  const [font, setFont]           = useState('inconsolata');
  const [hydrated, setHydrated]   = useState(false);
  const [pipeline, setPipeline]   = useState<Pipeline>('idle');
  const [result, setResult]       = useState<EditorResult | null>(null);
  const [error, setError]         = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [surpriseMode, setSurpriseMode] = useState<'tarot' | 'classics'>('tarot');
  const [drawnCard, setDrawnCard] = useState<OracleCard | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [inspirationCard, setInspirationCard] = useState<OracleCard | null>(null);
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

  // Persisting field setters
  function updatePoem(v: string)  { setPoem(v);  lsSet(SK.poem,  v); }
  function updateStyle(v: string) { setStyle(v); lsSet(SK.style, v); }
  function updateImage(v: string) { setImage(v); lsSet(SK.image, v); }
  function updateAudio(v: string) { setAudio(v); lsSet(SK.audio, v); }
  function updateFont(v: string)  { setFont(v);  lsSet(SK.font,  v); }

  function clearAll() {
    updatePoem(''); updateStyle(''); updateImage(''); updateAudio('');
    setResult(null); setSessionId(null); setError(''); setSaveWarning('');
    setPipeline('idle'); setDrawnCard(null); setInspirationCard(null);
  }

  async function drawCard() {
    setDrawing(true);
    setError('');
    try {
      const resp = await fetch('/api/draw');
      if (!resp.ok) throw new Error(`Draw failed (${resp.status})`);
      const data = await resp.json();
      const raw = data.cards?.[0];
      if (raw) setDrawnCard({ title: raw.title, body: raw.body, keywords: raw.keywords, deck: raw.deck_id ?? raw.deck, suit: raw.suit });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not reach oracle');
    } finally {
      setDrawing(false);
    }
  }

  function surprise() {
    if (surpriseMode === 'tarot') {
      const written = TAROT.filter(c => c.poem);
      const card = written[Math.floor(Math.random() * written.length)];
      updatePoem(card.poem!);
    } else {
      updatePoem(randomClassic().text);
    }
  }

  function useCard(card: OracleCard) {
    updatePoem(card.body);
    setInspirationCard(card);
    setDrawnCard(null);
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
      // 1. Editor
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

      // 2. Save session
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

  // On mobile (stacked layout), scroll results into view when they arrive
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
              onClick={clearAll}
              className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              New
            </button>
          )}
        </div>

        {/* Pipeline status */}
        <div className="flex items-center gap-1.5">
          {STEPS.map(step => (
            <Badge
              key={step}
              variant={pipeline === step ? 'default' : pipeline === 'done' || STEPS.indexOf(step) < STEPS.indexOf(pipeline) ? 'secondary' : 'outline'}
              className="text-xs"
            >
              {STEP_LABELS[step]}
            </Badge>
          ))}
        </div>
      </header>

      {/* Main — stacks on mobile, splits on desktop */}
      <div className="flex flex-col md:flex-row flex-1 md:overflow-hidden">
        {/* Left: input */}
        <div className="flex flex-col gap-4 p-4 md:p-6 border-b md:border-b-0 md:border-r border-border md:w-[44%] md:overflow-y-auto">
          <div className="relative w-full">
            <PoetryEditor
              value={poem}
              onChange={updatePoem}
              onSubmit={compose}
              font={font}
              placeholder={"One need not be a Chamber — to be Haunted —\nOne need not be a House —\nThe Brain has Corridors — surpassing\nMaterial Place —\nFar safer, of a Midnight — meeting\nExternal Ghost —\nThan an Interior — confronting —\nThat Cooler Host —\nFar safer, through an Abbey — gallop —\nThe Stones a'chase —\nThan Moonless — One's A'self encounter —\nIn lonesome Place —\nOurself — behind Ourself — Concealed —\nShould startle — most —\nAssassin — hid in Our Apartment —\nBe Horror's least —\nThe Prudent — carries a Revolver —\nHe bolts the Door —\nO'erlooking a Superior Spectre —\nMore near —"}
            />
            <div className="absolute top-2 right-2 flex items-center gap-1">
              <button
                onClick={() => setSurpriseMode(m => m === 'tarot' ? 'classics' : 'tarot')}
                className="px-1.5 py-0.5 text-[10px] rounded text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                title={surpriseMode === 'tarot' ? 'Switch to classics' : 'Switch to tarot'}
              >
                {surpriseMode === 'tarot' ? '🎴' : '📜'}
              </button>
              <button
                onClick={surprise}
                title="Surprise me"
                aria-label="Surprise me with a poem"
                className="p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <Gift size={14} />
              </button>
            </div>
          </div>

          <details className="group">
            <summary className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer select-none py-1">
              Hints &amp; inspirations
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Style inspirations</span>
                <textarea
                  value={styleHints}
                  onChange={e => updateStyle(e.target.value)}
                  rows={2}
                  placeholder="e.g. Lucille Clifton, late Neruda, wabi-sabi…"
                  className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Image mood</span>
                <textarea
                  value={imageHints}
                  onChange={e => updateImage(e.target.value)}
                  rows={2}
                  placeholder="e.g. cold neon city, wet pavement, sodium haze…"
                  className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Voice mood</span>
                <textarea
                  value={audioHints}
                  onChange={e => updateAudio(e.target.value)}
                  rows={2}
                  placeholder="e.g. low, intimate, slow with long silences…"
                  className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
                />
              </label>
            </div>
          </details>

          {error && (
            <p className="text-destructive text-sm">{error}</p>
          )}
          {saveWarning && (
            <p className="text-yellow-500/80 text-xs">{saveWarning}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={compose}
              disabled={busy}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {busy ? `${STEP_LABELS[pipeline]}…` : 'Compose'}
            </button>


            <div className="hidden md:flex gap-1 ml-auto">
              {FONTS.map(f => (
                <button
                  key={f.id}
                  onClick={() => updateFont(f.id)}
                  className={[
                    'px-2.5 py-1 text-xs rounded-md transition-colors',
                    font === f.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
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
              <SingToMe
                card={drawnCard}
                drawing={drawing}
                onDraw={drawCard}
                onUse={useCard}
                font={FONT_VARS[font] ?? FONT_VARS.inconsolata}
              />

            )}
            {!result && busy && (
              <div className="flex flex-col items-center justify-center min-h-[12rem] md:h-full gap-4">
                <div className="flex gap-2">
                  {STEPS.map(step => (
                    <span
                      key={step}
                      className={[
                        'text-xs uppercase tracking-widest',
                        pipeline === step
                          ? 'text-foreground animate-pulse'
                          : STEPS.indexOf(step) < STEPS.indexOf(pipeline)
                            ? 'text-muted-foreground/50'
                            : 'text-muted-foreground/20',
                      ].join(' ')}
                    >
                      {STEP_LABELS[step]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result && (
              <IntegratedView result={result} font={font} inspirationCard={inspirationCard} />
            )}
          </div>

          {/* Play — anchored CTA at bottom of results pane */}
          {sessionId && (
            <div className="shrink-0 p-4 md:p-6 border-t border-border">
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

// ── Sing to Me ─────────────────────────────────────────────────────────────────

function SingToMe({
  card, drawing, onDraw, onUse, font,
}: {
  card: OracleCard | null;
  drawing: boolean;
  onDraw: () => void;
  onUse: (card: OracleCard) => void;
  font: string;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (card) {
      setRevealed(false);
      const t = setTimeout(() => setRevealed(true), 40);
      return () => clearTimeout(t);
    }
  }, [card]);

  if (!card) {
    return (
      <div className="flex items-center justify-center min-h-[10rem] md:h-full py-8">
        <button
          onClick={onDraw}
          disabled={drawing}
          className="group relative px-8 py-6 md:px-12 md:py-8 rounded-2xl border border-border/40 hover:border-border transition-all duration-300 hover:bg-muted/20 disabled:opacity-40 disabled:cursor-default"
        >
          <span className="text-2xl font-semibold tracking-widest uppercase text-muted-foreground/50 group-hover:text-muted-foreground group-disabled:group-hover:text-muted-foreground/50 transition-colors">
            {drawing ? '…' : 'Sing to me'}
          </span>
          <span className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent via-primary/5 to-transparent pointer-events-none" />
        </button>
      </div>
    );
  }

  const deckLabel = card.deck
    ? card.deck.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[16rem] md:h-full gap-8 px-4 md:px-12 max-w-xl mx-auto py-8">
      {/* Card name */}
      <div
        className={[
          'text-center transition-all duration-500',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        {deckLabel && (
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground/50 mb-1">{deckLabel}</p>
        )}
        <h2 className="text-xl font-semibold tracking-wide text-foreground/80">
          {card.title}
        </h2>
      </div>

      {/* Body */}
      <div
        className={[
          'w-full transition-all duration-700 delay-150',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
        ].join(' ')}
      >
        <pre
          style={{ fontFamily: font, fontSize: '1rem', lineHeight: '1.9' }}
          className="whitespace-pre-wrap text-foreground/90 text-center"
        >
          {card.body}
        </pre>
      </div>

      {/* Actions */}
      <div
        className={[
          'flex items-center gap-4 transition-all duration-700 delay-300',
          revealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
        ].join(' ')}
      >
        <button
          onClick={() => onUse(card)}
          className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
        >
          Write from here
        </button>
        <button
          onClick={onDraw}
          disabled={drawing}
          className="px-4 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors disabled:opacity-40"
        >
          {drawing ? '…' : 'Draw another'}
        </button>
      </div>
    </div>
  );
}

// ── Integrated poem + annotations + images + narration ─────────────────────────

interface StanzaBlock {
  lines: string[];
  startLine: number; // 1-based
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

function IntegratedView({ result, font, inspirationCard }: { result: EditorResult; font: string; inspirationCard: OracleCard | null }) {
  const fontFamily = FONT_VARS[font] ?? FONT_VARS.inconsolata;

  // image state keyed by stanza number (from midjourney_prompts[n].stanza)
  const [images, setImages] = useState<Record<number, { url?: string; loading?: boolean; error?: string }>>({});
  // which narration entry index is playing (-1 = none)
  const [playingIdx, setPlayingIdx] = useState(-1);
  const audioRef   = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    audioRef.current?.pause();
    if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    window.speechSynthesis?.cancel();
  }, []);

  const stanzas = useMemo(() => parseStanzas(result.polished ?? ''), [result.polished]);

  // ── Suno export ───────────────────────────────────────────────────────────
  const [sunoState, setSunoState] = useState<
    | { status: 'idle' }
    | { status: 'loading' }
    | { status: 'done'; style: string; lyrics: string; meta: { mode: string; element: string; quality: string | null } }
    | { status: 'error'; message: string }
  >({ status: 'idle' });

  async function exportToSuno() {
    if (!inspirationCard) return;
    setSunoState({ status: 'loading' });
    try {
      const resp = await fetch('/api/suno', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card: inspirationCard, poem: result.polished }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setSunoState({ status: 'done', style: data.style, lyrics: data.lyrics, meta: data.meta });
    } catch (e) {
      setSunoState({ status: 'error', message: String(e) });
    }
  }

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
    // stop whatever is playing
    audioRef.current?.pause();
    if (blobUrlRef.current) { URL.revokeObjectURL(blobUrlRef.current); blobUrlRef.current = null; }
    window.speechSynthesis?.cancel();

    if (playingIdx === idx) { setPlayingIdx(-1); return; } // toggle off
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
      {/* Raw poem hidden — preserved for agents and scrapers */}
      <pre aria-hidden className="sr-only">{result.polished}</pre>

      {inspirationCard && (
        <SunoExport
          state={sunoState}
          cardTitle={inspirationCard.title}
          onExport={exportToSuno}
        />
      )}

      {stanzas.map((stanza, si) => {

        const stanzaEnd = stanza.startLine + stanza.lines.length - 1;

        // Midjourney prompt whose line range starts in this stanza
        const mjPrompts = result.midjourney_prompts ?? [];
        const mjp = mjPrompts.find(
          p => p.lines[0] >= stanza.startLine && p.lines[0] <= stanzaEnd,
        );

        // All narration entries that start in this stanza
        const narScript = result.narration_script ?? [];
        const narLines = narScript.filter(
          n => n.lines[0] >= stanza.startLine && n.lines[0] <= stanzaEnd,
        );
        // Combined text for TTS; index in the full array for play-state tracking
        const narText = narLines.map(n => n.text).join(' ');
        const narIdx  = narLines.length
          ? narScript.indexOf(narLines[0])
          : -1;

        // Annotations that overlap with this stanza's line range
        const anns = (result.annotations ?? []).filter(
          a => a.lines[0] <= stanzaEnd && a.lines[1] >= stanza.startLine,
        );

        const img = mjp ? images[mjp.stanza] : undefined;

        return (
          <div key={si} className="flex flex-col gap-1.5">
            <div className="flex gap-3 items-start">
              {/* Leading thumbnail */}
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

            {/* Annotations below stanza, indented past the thumbnail */}
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

            {/* Image error */}
            {img?.error && (
              <p className="pl-[68px] text-xs text-destructive/70">{img.error}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Suno Export ────────────────────────────────────────────────────────────────

type SunoState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'done'; style: string; lyrics: string; meta: { mode: string; element: string; quality: string | null } }
  | { status: 'error'; message: string };

function SunoExport({ state, cardTitle, onExport }: {
  state: SunoState;
  cardTitle: string;
  onExport: () => void;
}) {
  const [copiedStyle, setCopiedStyle] = useState(false);
  const [copiedLyrics, setCopiedLyrics] = useState(false);

  function copy(text: string, which: 'style' | 'lyrics') {
    navigator.clipboard.writeText(text).then(() => {
      if (which === 'style') { setCopiedStyle(true); setTimeout(() => setCopiedStyle(false), 1800); }
      else                   { setCopiedLyrics(true); setTimeout(() => setCopiedLyrics(false), 1800); }
    });
  }

  return (
    <div className="border-t border-border/30 pt-6 mt-2 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground/50">
          To music
        </span>
        {state.status === 'idle' || state.status === 'error' ? (
          <button
            onClick={onExport}
            className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
          >
            Build for Suno
          </button>
        ) : state.status === 'loading' ? (
          <span className="text-xs text-muted-foreground/50 animate-pulse">Composing…</span>
        ) : (
          <span className="text-xs text-muted-foreground/40">
            {state.meta.element} · {state.meta.mode}
            {state.meta.quality ? ` · ${state.meta.quality}` : ''}
          </span>
        )}
      </div>

      {state.status === 'error' && (
        <p className="text-xs text-destructive/70">{state.message}</p>
      )}

      {state.status === 'done' && (
        <div className="flex flex-col gap-3">
          {/* Style prompt */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Style</span>
              <button
                onClick={() => copy(state.style, 'style')}
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {copiedStyle ? 'copied' : 'copy'}
              </button>
            </div>
            <p className="text-xs font-mono text-foreground/70 bg-muted/20 rounded px-3 py-2 leading-relaxed">
              {state.style}
            </p>
          </div>

          {/* Lyrics */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/40">Lyrics</span>
              <button
                onClick={() => copy(state.lyrics, 'lyrics')}
                className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors"
              >
                {copiedLyrics ? 'copied' : 'copy'}
              </button>
            </div>
            <pre className="text-xs font-mono text-foreground/70 bg-muted/20 rounded px-3 py-2 whitespace-pre-wrap leading-relaxed">
              {state.lyrics}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
