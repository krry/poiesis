import { describe, it, expect } from 'vitest';
import { POEM_LIBRARY, randomClassic } from '../lib/poem-library';

describe('POEM_LIBRARY', () => {
  it('contains 12 poems', () => {
    expect(POEM_LIBRARY).toHaveLength(12);
  });

  it('every poem has a non-empty title, author, and text', () => {
    for (const poem of POEM_LIBRARY) {
      expect(poem.title.trim(), `title missing in: ${JSON.stringify(poem)}`).not.toBe('');
      expect(poem.author.trim(), `author missing in: ${poem.title}`).not.toBe('');
      expect(poem.text.trim(), `text missing in: ${poem.title}`).not.toBe('');
    }
  });

  it('every poem text contains at least one newline (multi-line)', () => {
    for (const poem of POEM_LIBRARY) {
      expect(poem.text, `${poem.title} appears to be a single line`).toContain('\n');
    }
  });

  it('has no duplicate titles', () => {
    const titles = POEM_LIBRARY.map(p => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});

describe('randomClassic', () => {
  it('returns a poem from the library', () => {
    const poem = randomClassic();
    expect(POEM_LIBRARY).toContain(poem);
  });

  it('returns different poems across calls (probabilistic)', () => {
    const seen = new Set(Array.from({ length: 50 }, () => randomClassic().title));
    // With 12 poems and 50 draws we should see at least 3 unique titles
    expect(seen.size).toBeGreaterThan(3);
  });
});
