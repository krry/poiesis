import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

async function postImage(body: Record<string, unknown>) {
  vi.resetModules(); // reset so env stubs take effect per-test
  const { POST } = await import('../app/api/image/route');
  const req = new Request('http://localhost/api/image', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
  return POST(req as never);
}

const FAKE_B64 = 'iVBORw0KGgo='; // minimal base64 stand-in

describe('POST /api/image', () => {
  beforeEach(() => mockFetch.mockReset());

  it('returns 400 when prompt is missing', async () => {
    const res = await postImage({});
    expect(res.status).toBe(400);
  });

  it('returns 400 when prompt exceeds 1,000 chars', async () => {
    const res = await postImage({ prompt: 'x'.repeat(1_001) });
    expect(res.status).toBe(400);
  });

  it('uses Pollinations when no GOOGLE_API_KEY is set', async () => {
    vi.stubEnv('GOOGLE_API_KEY', '');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Buffer.from(FAKE_B64, 'base64').buffer,
    });
    const res = await postImage({ prompt: 'a lone tree' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.value).toMatch(/^data:image\/jpeg;base64,/);
    // Pollinations URL was hit
    expect(mockFetch.mock.calls[0][0]).toContain('pollinations.ai');
  });

  it('falls back to Pollinations when Gemini fails', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'fake-key');
    // Gemini fails
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'err' });
    // Pollinations succeeds
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'image/jpeg' },
      arrayBuffer: async () => Buffer.from(FAKE_B64, 'base64').buffer,
    });
    const res = await postImage({ prompt: 'dark forest' });
    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('returns 503 when both providers fail', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'fake-key');
    mockFetch.mockResolvedValue({ ok: false, status: 500, text: async () => 'err' });
    const res = await postImage({ prompt: 'stormy sea' });
    expect(res.status).toBe(503);
  });
});
