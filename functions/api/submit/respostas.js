export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try { body = await request.json(); } catch {}

  const { id, respostas } = body;
  if (!id || !respostas) return json({ ok: false, error: 'id e respostas obrigatórios' }, 400);

  const payload = typeof respostas === 'string' ? respostas : JSON.stringify(respostas);

  await env.DB.prepare(
    `UPDATE leads SET respostas = ?, updated_at = datetime('now') WHERE id = ?`
  ).bind(payload, id).run();

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
