'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type Token = { text: string; pre: string; post: string; cls: string };

const TAG_TO_CLASS: [string, string][] = [
  ['Noun',        'pos-noun'],
  ['Verb',        'pos-verb'],
  ['Adjective',   'pos-adj'],
  ['Adverb',      'pos-adv'],
  ['Preposition', 'pos-prep'],
  ['Conjunction', 'pos-conj'],
  ['Determiner',  'pos-det'],
];

function posClass(tags: Record<string, boolean>): string {
  for (const [tag, cls] of TAG_TO_CLASS) {
    if (tags[tag]) return cls;
  }
  return 'pos-other';
}

async function tokenize(text: string): Promise<Token[]> {
  if (!text) return [];
  const { default: nlp } = await import('compromise');
  const tokens: Token[] = [];

  const lines = text.split('\n');
  lines.forEach((line, i) => {
    if (line.trim()) {
      const doc = nlp(line);
      const sentences: Array<{ terms: Array<{ text: string; pre: string; post: string; tags: Record<string, boolean> }> }>
        = doc.json();
      for (const sentence of sentences) {
        for (const term of sentence.terms) {
          tokens.push({ text: term.text, pre: term.pre, post: term.post, cls: posClass(term.tags) });
        }
      }
    }
    if (i < lines.length - 1) {
      tokens.push({ text: '\n', pre: '', post: '', cls: '' });
    }
  });
  return tokens;
}

const FONT_VARS: Record<string, string> = {
  inconsolata: 'var(--font-inconsolata)',
  'fira-code':  'var(--font-fira-code)',
  recursive:   'var(--font-recursive)',
  'geist-mono': 'var(--font-geist-mono)',
};

interface Props {
  value: string;
  onChange: (v: string) => void;
  font: string;
  placeholder?: string;
}

export default function PoetryEditor({ value, onChange, font, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const [tokens, setTokens] = useState<Token[]>([]);

  const refresh = useCallback(async (text: string) => {
    setTokens(await tokenize(text));
  }, []);

  useEffect(() => {
    const id = setTimeout(() => refresh(value), 120);
    return () => clearTimeout(id);
  }, [value, refresh]);

  const syncScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const fontFamily = FONT_VARS[font] ?? FONT_VARS.inconsolata;
  const shared: React.CSSProperties = {
    fontFamily,
    fontSize: '1.05rem',
    lineHeight: '1.9',
    letterSpacing: '0.01em',
    padding: '1.25rem 1.5rem',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    minHeight: '16rem',
  };

  return (
    <div className="relative w-full">
      {/* POS-highlighted backdrop — rendered as safe React elements, no innerHTML */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none select-none rounded-lg"
        style={{ ...shared, color: 'oklch(0.65 0 0)', overflowY: 'hidden' }}
      >
        {tokens.length === 0 && (
          <span style={{ color: 'transparent' }}>{value}</span>
        )}
        {tokens.map((t, i) =>
          t.text === '\n' ? (
            <br key={i} />
          ) : (
            <span key={i} className={t.cls}>
              {t.pre}{t.text}{t.post}
            </span>
          ),
        )}
      </div>

      {/* Transparent textarea captures input */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncScroll}
        placeholder={placeholder}
        spellCheck={false}
        className="relative w-full resize-none bg-transparent outline-none border border-border rounded-lg focus:border-ring placeholder:text-muted-foreground/40"
        style={{
          ...shared,
          color: 'transparent',
          caretColor: 'oklch(0.85 0 0)',
        }}
      />

      <style>{`
        .pos-noun  { color: oklch(0.82 0.12 60) }
        .pos-verb  { color: oklch(0.78 0.10 200) }
        .pos-adj   { color: oklch(0.76 0.12 290) }
        .pos-adv   { color: oklch(0.74 0.10 155) }
        .pos-prep,
        .pos-conj,
        .pos-det   { color: oklch(0.52 0 0) }
        .pos-other { color: oklch(0.70 0 0) }
      `}</style>
    </div>
  );
}
