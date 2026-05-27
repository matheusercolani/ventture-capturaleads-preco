export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try { body = await request.json(); } catch {}

  const { id, faturamento } = body;
  if (!id || !faturamento) return json({ ok: false, error: 'id e faturamento obrigatórios' }, 400);

  await env.DB.prepare(
    `UPDATE leads SET faturamento = ?, updated_at = datetime('now') WHERE id = ? AND faturamento = ''`
  ).bind(faturamento, id).run();

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
