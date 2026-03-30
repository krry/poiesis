import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

async function getDrawRoute() {
  const { GET } = await import('../app/api/draw/route');
  return GET();
}

describe('GET /api/draw', () => {
  beforeEach(() => mockFetch.mockReset());

  it('proxies Ouracle response on success', async () => {
    const payload = { cards: [{ title: 'The Tower', body: 'Everything falls.' }] };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => payload,
    });
    const res = await getDrawRoute();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.cards[0].title).toBe('The Tower');
  });

  it('returns 502 when Ouracle is unavailable', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });
    const res = await getDrawRoute();
    expect(res.status).toBe(502);
  });
});
