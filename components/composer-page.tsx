'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PoetryEditor from './poetry-editor';
import type { EditorResult, Pipeline } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

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

export default function ComposerPage() {
  const router = useRouter();

  const [poem, setPoem]           = useState('');
  const [styleHints, setStyle]    = useState('');
  const [imageHints, setImage]    = useState('');
  const [audioHints, setAudio]    = useState('');
  const [font, setFont]           = useState('inconsolata');
  const [pipeline, setPipeline]   = useState<Pipeline>('idle');
  const [result, setResult]       = useState<EditorResult | null>(null);
  const [error, setError]         = useState('');
  const [saveWarning, setSaveWarning] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

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

  const pct = PIPELINE_PCT[pipeline];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
        <span className="text-sm font-semibold tracking-widest uppercase text-muted-foreground">
          Poiesis
        </span>

        {/* Font selector */}
        <div className="flex gap-1">
          {FONTS.map(f => (
            <button
              key={f.id}
              onClick={() => setFont(f.id)}
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

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: input */}
        <div className="w-[44%] flex flex-col gap-4 p-6 overflow-y-auto border-r border-border">
          <PoetryEditor
            value={poem}
            onChange={setPoem}
            onSubmit={compose}
            font={font}
            placeholder={"One need not be a Chamber — to be Haunted —\nOne need not be a House —\nThe Brain has Corridors — surpassing\nMaterial Place —\nFar safer, of a Midnight — meeting\nExternal Ghost —\nThan an Interior — confronting —\nThat Cooler Host —\nFar safer, through an Abbey — gallop —\nThe Stones a'chase —\nThan Moonless — One's A'self encounter —\nIn lonesome Place —\nOurself — behind Ourself — Concealed —\nShould startle — most —\nAssassin — hid in Our Apartment —\nBe Horror's least —\nThe Prudent — carries a Revolver —\nHe bolts the Door —\nO'erlooking a Superior Spectre —\nMore near —"}
          />

          <details className="group">
            <summary className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer select-none py-1">
              Hints &amp; inspirations
            </summary>
            <div className="mt-3 flex flex-col gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Style inspirations</span>
                <textarea
                  value={styleHints}
                  onChange={e => setStyle(e.target.value)}
                  rows={2}
                  placeholder="e.g. Lucille Clifton, late Neruda, wabi-sabi…"
                  className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Image mood</span>
                <textarea
                  value={imageHints}
                  onChange={e => setImage(e.target.value)}
                  rows={2}
                  placeholder="e.g. cold neon city, wet pavement, sodium haze…"
                  className="text-sm bg-muted/30 border border-border rounded-md p-2 resize-none outline-none focus:border-ring"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Voice mood</span>
                <textarea
                  value={audioHints}
                  onChange={e => setAudio(e.target.value)}
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

          <div className="flex items-center gap-3 mt-auto pt-2">
            <button
              onClick={compose}
              disabled={busy}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              {busy ? `${STEP_LABELS[pipeline]}…` : 'Compose'}
            </button>

            {sessionId && (
              <button
                onClick={() => router.push(`/read/${sessionId}`)}
                className="px-4 py-2 rounded-full border border-border text-sm hover:bg-muted/50 transition-colors flex items-center gap-1.5"
              >
                ▶ Play
              </button>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="flex-1 flex flex-col overflow-hidden">
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

          <div className="flex-1 overflow-y-auto p-6">
            {!result && pipeline === 'idle' && (
              <p className="text-muted-foreground text-sm">Results will appear here after you compose.</p>
            )}
            {!result && busy && (
              <div className="flex flex-col items-center justify-center h-full gap-4">
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
              <IntegratedView result={result} font={font} />
            )}
          </div>
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

function IntegratedView({ result, font }: { result: EditorResult; font: string }) {
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

  const stanzas = useMemo(() => parseStanzas(result.polished), [result.polished]);

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

      {stanzas.map((stanza, si) => {
        const stanzaEnd = stanza.startLine + stanza.lines.length - 1;

        // Midjourney prompt whose line range starts in this stanza
        const mjp = result.midjourney_prompts.find(
          p => p.lines[0] >= stanza.startLine && p.lines[0] <= stanzaEnd,
        );

        // All narration entries that start in this stanza
        const narLines = result.narration_script.filter(
          n => n.lines[0] >= stanza.startLine && n.lines[0] <= stanzaEnd,
        );
        // Combined text for TTS; index in the full array for play-state tracking
        const narText = narLines.map(n => n.text).join(' ');
        const narIdx  = narLines.length
          ? result.narration_script.indexOf(narLines[0])
          : -1;

        // Annotations that overlap with this stanza's line range
        const anns = result.annotations.filter(
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
                  <span className="text-muted-foreground/40 text-xs animate-pulse">…</span>
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
