export async function POST(req: Request) {
  const body = await req.json();
  const resp = await fetch('https://api.ouracle.kerry.ink/suno', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    return new Response(text, { status: resp.status });
  }
  const data = await resp.json();
  return Response.json(data);
}
