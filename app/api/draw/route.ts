export async function GET() {
  const resp = await fetch('https://api.ouracle.kerry.ink/draw?n=1');
  if (!resp.ok) return new Response('Ouracle unavailable', { status: 502 });
  const data = await resp.json();
  return Response.json(data);
}
