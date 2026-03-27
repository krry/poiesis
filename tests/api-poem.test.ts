import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch for API tests
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Set env before importing route
vi.stubEnv('ANTHROPIC_API_KEY', 'test-key');

describe('POST /api/poem', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns parsed JSON on success', async () => {
    const fakeResult = {
      polished: 'Roses are crimson',
      annotations: [],
      midjourney_prompts: [],
      narration_script: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: JSON.stringify(fakeResult) }],
      }),
    });

    const { POST } = await import('../app/api/poem/route');
    const req = new Request('http://localhost/api/poem', {
      method: 'POST',
      body: JSON.stringify({ poem: 'roses are red' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const data = await res.json();
    expect(data.polished).toBe('Roses are crimson');
  });

  it('returns 400 for missing poem', async () => {
    const { POST } = await import('../app/api/poem/route');
    const req = new Request('http://localhost/api/poem', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });

  it('strips markdown fences from LLM response', async () => {
    const fakeResult = {
      polished: 'clean poem',
      annotations: [],
      midjourney_prompts: [],
      narration_script: [],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: '```json\n' + JSON.stringify(fakeResult) + '\n```' }],
      }),
    });

    const { POST } = await import('../app/api/poem/route');
    const req = new Request('http://localhost/api/poem', {
      method: 'POST',
      body: JSON.stringify({ poem: 'some poem' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req as never);
    const data = await res.json();
    expect(data.polished).toBe('clean poem');
  });
});
