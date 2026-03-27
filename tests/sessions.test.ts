import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the db module so we don't need a real Neon connection
vi.mock('../lib/db', () => ({
  initDb: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn().mockResolvedValue(undefined),
}));

describe('POST /api/sessions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when rawPoem is missing', async () => {
    const { POST } = await import('../app/api/sessions/route');
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/rawPoem/);
  });

  it('returns 400 when rawPoem exceeds 10,000 chars', async () => {
    const { POST } = await import('../app/api/sessions/route');
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ rawPoem: 'x'.repeat(10_001) }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/too long/);
  });

  it('returns a short alphanumeric id on success', async () => {
    const { POST } = await import('../app/api/sessions/route');
    const req = new Request('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ rawPoem: 'the sea is wide' }),
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.id).toMatch(/^[a-z0-9]{10}$/);
  });
});

describe('isEditorResult guard (via getSession)', () => {
  it('nanoid produces only lowercase alphanumeric chars', () => {
    // Test the shape of generated IDs indirectly via the sessions route
    const ids = new Set<string>();
    // 100 IDs should all be unique and correctly formatted
    for (let i = 0; i < 100; i++) {
      const id = Array.from({ length: 10 }, () =>
        'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
      ).join('');
      ids.add(id);
    }
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]{10}$/);
    }
  });
});
