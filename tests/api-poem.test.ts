import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the AI SDK — don't touch real HTTP
vi.mock('ai', () => ({ generateText: vi.fn() }));
vi.mock('@ai-sdk/gateway', () => ({ gateway: vi.fn().mockReturnValue('mocked-model') }));

import { generateText } from 'ai';

const VALID_RESULT = {
  polished: 'The sea remembers everything',
  annotations: [{ lines: [1, 2], stage: 'opening', note: 'establishes the sea as memory' }],
  midjourney_prompts: [{ stanza: 1, lines: [1, 2], prompt: 'vast dark ocean at dusk' }],
  narration_script: [{ lines: [1, 1], cue: '[quiet]', text: 'The sea remembers everything' }],
};

function mockLLM(text: string) {
  vi.mocked(generateText).mockResolvedValueOnce({ text } as never);
}

async function postPoem(body: Record<string, unknown>) {
  const { POST } = await import('../app/api/poem/route');
  const req = new Request('http://localhost/api/poem', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return POST(req as never);
}

describe('POST /api/poem', () => {
  beforeEach(() => vi.clearAllMocks());

  // Input validation
  it('returns 400 when poem is missing', async () => {
    const res = await postPoem({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when poem is blank whitespace', async () => {
    const res = await postPoem({ poem: '   ' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when poem exceeds 10,000 chars', async () => {
    const res = await postPoem({ poem: 'x'.repeat(10_001) });
    expect(res.status).toBe(400);
  });

  // Happy path
  it('returns parsed EditorResult on clean JSON response', async () => {
    mockLLM(JSON.stringify(VALID_RESULT));
    const res = await postPoem({ poem: 'the sea is wide' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.polished).toBe(VALID_RESULT.polished);
    expect(data.annotations).toHaveLength(1);
    expect(data.midjourney_prompts).toHaveLength(1);
    expect(data.narration_script).toHaveLength(1);
  });

  it('passes style, image, and audio hints to the model', async () => {
    mockLLM(JSON.stringify(VALID_RESULT));
    await postPoem({ poem: 'waves crash', styleHints: 'Neruda', imageHints: 'neon', audioHints: 'slow' });
    expect(vi.mocked(generateText)).toHaveBeenCalledOnce();
    const call = vi.mocked(generateText).mock.calls[0][0] as { prompt: string };
    expect(call.prompt).toContain('Neruda');
    expect(call.prompt).toContain('neon');
    expect(call.prompt).toContain('slow');
  });

  // JSON extraction robustness
  it('parses response wrapped in ```json fences', async () => {
    mockLLM('```json\n' + JSON.stringify(VALID_RESULT) + '\n```');
    const res = await postPoem({ poem: 'waves crash' });
    const data = await res.json();
    expect(data.polished).toBe(VALID_RESULT.polished);
  });

  it('parses response with prose before the JSON block', async () => {
    mockLLM('Here is your edited poem:\n\n' + JSON.stringify(VALID_RESULT));
    const res = await postPoem({ poem: 'waves crash' });
    const data = await res.json();
    expect(data.polished).toBe(VALID_RESULT.polished);
  });

  it('parses response with prose after the JSON block', async () => {
    mockLLM(JSON.stringify(VALID_RESULT) + '\n\nI hope this helps!');
    const res = await postPoem({ poem: 'waves crash' });
    const data = await res.json();
    expect(data.polished).toBe(VALID_RESULT.polished);
  });

  it('parses response with prose both before and after', async () => {
    mockLLM('Sure:\n' + JSON.stringify(VALID_RESULT) + '\nLet me know!');
    const res = await postPoem({ poem: 'waves crash' });
    const data = await res.json();
    expect(data.polished).toBe(VALID_RESULT.polished);
  });

  // Error handling
  it('returns 422 with raw when LLM output has no JSON', async () => {
    mockLLM('I cannot help with that.');
    const res = await postPoem({ poem: 'waves crash' });
    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toContain('unparseable');
    expect(data.raw).toBeDefined();
  });

  it('returns 502 when generateText throws', async () => {
    vi.mocked(generateText).mockRejectedValueOnce(new Error('timeout'));
    const res = await postPoem({ poem: 'waves crash' });
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain('timeout');
  });
});
