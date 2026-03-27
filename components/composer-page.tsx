'use client';

import { useState } from 'react';
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

const STEPS: Pipeline[] = ['editing', 'illustrating', 'done'];
const STEP_LABELS: Record<Pipeline, string> = {
  idle: 'idle', editing: 'Editor', illustrating: 'Illustrator',
  narrating: 'Narrator', done: 'Done', error: 'Error',
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
  const [activeTab, setActiveTab] = useState<'poem' | 'annotations' | 'images' | 'narration'>('poem');
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
      setActiveTab('poem');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setPipeline('error');
    }
  }

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
            font={font}
            placeholder={"Write or paste your poem here…\n\nThe words will be coloured by their part of speech."}
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
                className="px-5 py-2 rounded-full border border-border text-sm hover:bg-muted/50 transition-colors"
              >
                View in Poiesis →
              </button>
            )}
          </div>
        </div>

        {/* Right: results */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-border shrink-0">
            {(['poem', 'annotations', 'images', 'narration'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  'px-4 py-2.5 text-xs uppercase tracking-widest transition-colors',
                  activeTab === tab
                    ? 'text-foreground border-b-2 border-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                ].join(' ')}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!result && pipeline === 'idle' && (
              <p className="text-muted-foreground text-sm">Results will appear here after you compose.</p>
            )}
            {!result && busy && (
              <p className="text-muted-foreground text-sm animate-pulse">{STEP_LABELS[pipeline]}…</p>
            )}

            {result && activeTab === 'poem' && (
              <PoemPanel result={result} font={font} />
            )}
            {result && activeTab === 'annotations' && (
              <AnnotationsPanel result={result} />
            )}
            {result && activeTab === 'images' && (
              <ImagesPanel result={result} />
            )}
            {result && activeTab === 'narration' && (
              <NarrationPanel result={result} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-panels ────────────────────────────────────────────────────────────────

function PoemPanel({ result, font }: { result: EditorResult; font: string }) {
  const fontVar = {
    inconsolata: 'var(--font-inconsolata)',
    'fira-code':  'var(--font-fira-code)',
    recursive:   'var(--font-recursive)',
    'geist-mono': 'var(--font-geist-mono)',
  }[font] ?? 'var(--font-inconsolata)';

  return (
    <pre
      className="text-foreground leading-loose whitespace-pre-wrap"
      style={{ fontFamily: fontVar, fontSize: '1rem', lineHeight: '1.9' }}
    >
      {result.polished}
    </pre>
  );
}

function AnnotationsPanel({ result }: { result: EditorResult }) {
  return (
    <div className="flex flex-col gap-3">
      {result.annotations.map((ann, i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase tracking-wider text-blue-400 font-medium">{ann.stage}</span>
            <span className="text-xs text-muted-foreground">lines {ann.lines[0]}–{ann.lines[1]}</span>
          </div>
          <p className="text-sm text-foreground/80">{ann.note}</p>
        </div>
      ))}
    </div>
  );
}

function ImagesPanel({ result }: { result: EditorResult }) {
  const [images, setImages] = useState<Record<number, { url?: string; loading?: boolean; error?: string }>>({});

  async function generate(stanza: number, prompt: string) {
    setImages(prev => ({ ...prev, [stanza]: { loading: true } }));
    try {
      const resp = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = await resp.json();
      setImages(prev => ({ ...prev, [stanza]: { url: data.value } }));
    } catch (err) {
      setImages(prev => ({ ...prev, [stanza]: { error: String(err) } }));
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {result.midjourney_prompts.map((p) => (
        <div key={p.stanza} className="rounded-lg border border-border bg-card overflow-hidden">
          <div className="flex items-start justify-between gap-3 p-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Stanza {p.stanza}</span>
              <p className="text-sm mt-1 text-foreground/80">{p.prompt}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => navigator.clipboard.writeText(p.prompt)}
                className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-muted/50"
              >
                Copy
              </button>
              <button
                onClick={() => generate(p.stanza, p.prompt)}
                disabled={images[p.stanza]?.loading}
                className="px-2.5 py-1 text-xs border border-border rounded-md hover:bg-muted/50 disabled:opacity-40"
              >
                {images[p.stanza]?.loading ? '…' : 'Generate'}
              </button>
            </div>
          </div>
          {images[p.stanza]?.url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={images[p.stanza].url} alt={`Stanza ${p.stanza}`} className="w-full" />
          )}
          {images[p.stanza]?.error && (
            <p className="px-4 pb-3 text-xs text-destructive">{images[p.stanza].error}</p>
          )}
        </div>
      ))}
    </div>
  );
}

function NarrationPanel({ result }: { result: EditorResult }) {
  async function speak(text: string) {
    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.addEventListener('ended', () => URL.revokeObjectURL(url));
      audio.play();
    } catch {
      // fallback to browser speech
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(text), { rate: 0.9 }));
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {result.narration_script.map((line, i) => (
        <div key={i} className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
          <button
            onClick={() => speak(line.text)}
            className="mt-0.5 shrink-0 w-6 h-6 flex items-center justify-center rounded-full border border-border text-xs hover:bg-muted/50"
          >
            ▶
          </button>
          <div>
            <div className="text-xs text-muted-foreground mb-0.5">
              lines {line.lines[0]}–{line.lines[1]} <span className="text-blue-400/70">{line.cue}</span>
            </div>
            <p className="text-sm">{line.text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
