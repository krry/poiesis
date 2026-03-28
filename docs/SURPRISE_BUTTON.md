# Feature: Surprise Button

## What
A floating gift/present button (🎁) overlaid on the poem composer textarea. Tapping it populates the editor with a randomly selected poem from a curated library.

## Where
`components/composer-page.tsx` — wrap the `<PoetryEditor>` in a relative container and position the button top-right (or bottom-right) of it.

`components/poetry-editor.tsx` — no changes needed.

New file: `lib/poem-library.ts` — the poem corpus.

## The Button
- Icon: `Gift` from `lucide-react` (already a dep)
- Position: absolute, top-right corner of the PoetryEditor wrapper
- Style: small, rounded, ghost/muted — doesn't compete with the editor
- On click: pick a random poem from the library, call `onChange(poem.text)`
- Tooltip or aria-label: "Surprise me"

## The Library (`lib/poem-library.ts`)
A typed array of poems, all public domain. Start with ~20 entries.

```ts
export interface SurprisePoem {
  title: string;
  author: string;
  text: string;
}

export const POEM_LIBRARY: SurprisePoem[] = [ /* ... */ ];

export function randomPoem(): SurprisePoem {
  return POEM_LIBRARY[Math.floor(Math.random() * POEM_LIBRARY.length)];
}
```

## Suggested corpus
Pull from these — all public domain:

- Emily Dickinson: "Because I could not stop for Death", "I'm Nobody! Who are you?", "Hope is the thing with feathers", "One need not be a Chamber", "Tell all the truth but tell it slant"
- Walt Whitman: "O Me! O Life!", "When I Heard the Learn'd Astronomer"
- William Wordsworth: "I Wandered Lonely as a Cloud", "The World Is Too Much with Us"
- William Blake: "The Tyger", "The Lamb", "London"
- Shakespeare sonnets: 18, 29, 73, 116, 130
- Langston Hughes: "Dreams", "A Dream Deferred", "The Negro Speaks of Rivers"
- Rumi (Coleman Barks translation — verify license, or use older Nicholson translations which are PD): "The Guest House", "Out beyond ideas"
- Mary Oliver: skip — not PD yet
- Pablo Neruda: Spanish originals are PD in some jurisdictions; use with care

## Wire-up in composer-page.tsx

```tsx
import { randomPoem } from '@/lib/poem-library';
import { Gift } from 'lucide-react';

// Inside ComposerPage, wrapping PoetryEditor:
<div className="relative w-full">
  <PoetryEditor
    value={poem}
    onChange={setPoem}
    onSubmit={compose}
    font={font}
    placeholder={...}
  />
  <button
    onClick={() => setPoem(randomPoem().text)}
    title="Surprise me"
    aria-label="Surprise me with a poem"
    className="absolute top-2 right-2 p-1.5 rounded-md text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
  >
    <Gift size={14} />
  </button>
</div>
```

## Acceptance criteria
- Button visible but unobtrusive over the editor
- Each tap loads a different poem (random, not sequential)
- Poem text replaces whatever is in the editor
- No new dependencies required
- Library lives in `lib/poem-library.ts` with at least 15 poems fully populated
