'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { EditorResult } from '@/lib/types';

interface Props {
  editorResult: EditorResult;
  imageHints?: string | null;
}

interface Slide {
  stanzaIndex: number;
  lines: string[];
  prompt: string;
  imageUrl?: string;
  loading: boolean;
}

function splitIntoStanzas(poem: string): string[][] {
  const stanzas: string[][] = [];
  let current: string[] = [];
  for (const line of poem.split('\n')) {
    if (line.trim() === '') {
      if (current.length) { stanzas.push(current); current = []; }
    } else {
      current.push(line);
    }
  }
  if (current.length) stanzas.push(current);
  return stanzas.length ? stanzas : [poem.split('\n').filter(Boolean)];
}

export default function CuratorView({ editorResult }: Props) {
  const stanzas = splitIntoStanzas(editorResult.polished);
  const [slides, setSlides] = useState<Slide[]>(() =>
    editorResult.midjourney_prompts.map((p, i) => ({
      stanzaIndex: i,
      lines: stanzas[i] ?? [],
      prompt: p.prompt,
      loading: false,
    }))
  );
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Load image for a slide. Uses functional setSlides to atomically check-and-set
  // loading state, preventing stale-closure race conditions when called concurrently.
  const loadImage = useCallback(async (index: number) => {
    let prompt = '';
    setSlides(prev => {
      const slide = prev[index];
      if (!slide || slide.imageUrl || slide.loading) return prev; // already done or in-flight
      prompt = slide.prompt;
      return prev.map((s, i) => i === index ? { ...s, loading: true } : s);
    });
    if (!prompt) return;

    try {
      const resp = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      if (!resp.ok) throw new Error();
      const data = await resp.json();
      setSlides(prev => prev.map((s, i) => i === index ? { ...s, imageUrl: data.value, loading: false } : s));
    } catch {
      setSlides(prev => prev.map((s, i) => i === index ? { ...s, loading: false } : s));
    }
  }, []); // stable ref — no stale closures; all reads go through functional setSlides

  // Preload current + next
  useEffect(() => {
    loadImage(current);
    if (current + 1 < slides.length) loadImage(current + 1);
  }, [current, loadImage]);

  const navigate = useCallback((dir: 1 | -1) => {
    setCurrent(c => Math.max(0, Math.min(slides.length - 1, c + dir)));
    if (playing) stopAudio();
  }, [slides.length, playing]); // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke any outstanding blob URL on unmount
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') navigate(1);
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   navigate(-1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Touch swipe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0;
    const onStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onEnd   = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) navigate(dx < 0 ? 1 : -1);
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchend',   onEnd);
    };
  }, [navigate]);

  async function playNarration() {
    const stanzaStart = editorResult.midjourney_prompts[current]?.lines[0] ?? 1;
    const nextStanzaStart = editorResult.midjourney_prompts[current + 1]?.lines[0] ?? Infinity;
    // Collect all narration lines that fall within this stanza's line range
    const scriptLines = editorResult.narration_script.filter(
      l => l.lines[0] >= stanzaStart && l.lines[0] < nextStanzaStart
    );
    if (!scriptLines.length) return;
    const fullText = scriptLines.map(l => l.text).join(' ');

    stopAudio();
    setPlaying(true);

    try {
      const resp = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: fullText }),
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
        setPlaying(false);
      });
      audio.play();
    } catch {
      setPlaying(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(fullText);
        utt.rate = 0.9;
        utt.addEventListener('end', () => setPlaying(false));
        window.speechSynthesis.speak(utt);
      }
    }
  }

  function stopAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    window.speechSynthesis?.cancel();
    setPlaying(false);
  }

  const slide = slides[current];
  const font = 'var(--font-inconsolata)';

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden bg-black flex items-center justify-center select-none"
    >
      {/* Background image */}
      {slide?.imageUrl && (
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-700"
          style={{ backgroundImage: `url("${slide.imageUrl.replace(/"/g, '%22')}")` }}
        />
      )}
      {slide?.loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-white/30 text-sm animate-pulse">generating image…</span>
        </div>
      )}

      {/* Dark scrim */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

      {/* Poem text */}
      <div className="relative z-10 flex flex-col items-center px-8 max-w-2xl text-center">
        {slide?.lines.map((line, i) => (
          <p
            key={i}
            className="text-white drop-shadow-lg"
            style={{
              fontFamily: font,
              fontSize: 'clamp(1.1rem, 2.8vw, 1.6rem)',
              lineHeight: '1.8',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Navigation arrows */}
      <button
        onClick={() => navigate(-1)}
        disabled={current === 0}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white/60 hover:bg-black/60 hover:text-white disabled:opacity-20 transition"
      >
        ‹
      </button>
      <button
        onClick={() => navigate(1)}
        disabled={current === slides.length - 1}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white/60 hover:bg-black/60 hover:text-white disabled:opacity-20 transition"
      >
        ›
      </button>

      {/* Bottom controls */}
      <div className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-4">
        {/* Slide dots */}
        <div className="flex gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={[
                'w-1.5 h-1.5 rounded-full transition-all',
                i === current ? 'bg-white scale-125' : 'bg-white/40',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Audio button */}
        <button
          onClick={playing ? stopAudio : playNarration}
          className="ml-4 px-3 py-1.5 rounded-full bg-black/40 border border-white/20 text-white/70 text-xs hover:bg-black/60 hover:text-white transition"
        >
          {playing ? '⏹ stop' : '▶ narrate'}
        </button>
      </div>

      {/* Slide counter */}
      <div className="absolute top-4 right-4 z-20 text-white/40 text-xs">
        {current + 1} / {slides.length}
      </div>
    </div>
  );
}
