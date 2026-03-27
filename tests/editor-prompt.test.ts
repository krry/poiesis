import { describe, it, expect } from 'vitest';
import { buildEditorUserMessage, EDITOR_SYSTEM_PROMPT } from '../lib/editor-prompt';

describe('buildEditorUserMessage', () => {
  it('includes the raw poem', () => {
    const msg = buildEditorUserMessage('roses are red');
    expect(msg).toContain('roses are red');
  });

  it('uses "none" when hints are omitted', () => {
    const msg = buildEditorUserMessage('poem');
    expect(msg).toContain('style_hints: none');
    expect(msg).toContain('image_hints: none');
    expect(msg).toContain('audio_hints: none');
  });

  it('includes provided hints', () => {
    const msg = buildEditorUserMessage('poem', 'Neruda', 'neon city', 'breathy');
    expect(msg).toContain('Neruda');
    expect(msg).toContain('neon city');
    expect(msg).toContain('breathy');
  });

  it('ends with JSON instruction', () => {
    const msg = buildEditorUserMessage('poem');
    expect(msg).toContain('Return JSON ONLY');
  });
});

describe('EDITOR_SYSTEM_PROMPT', () => {
  it('mentions the four output types', () => {
    expect(EDITOR_SYSTEM_PROMPT).toContain('polished');
    expect(EDITOR_SYSTEM_PROMPT).toContain('annotations');
    expect(EDITOR_SYSTEM_PROMPT).toContain('midjourney_prompts');
    expect(EDITOR_SYSTEM_PROMPT).toContain('narration_script');
  });

  it('instructs JSON-only output', () => {
    expect(EDITOR_SYSTEM_PROMPT).toContain('ONLY respond with valid JSON');
  });
});
