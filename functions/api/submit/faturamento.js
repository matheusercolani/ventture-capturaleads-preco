import { acSyncContact, acAddTag } from '../../_ac.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try { body = await request.json(); } catch {}

  const { id, faturamento } = body;
  if (!id || !faturamento) return json({ ok: false, error: 'id e faturamento obrigatórios' }, 400);

  await env.DB.prepare(
    `UPDATE leads SET faturamento = ?, updated_at = datetime('now') WHERE id = ? AND faturamento = ''`
  ).bind(faturamento, id).run();

  // Busca e-mail do lead para atualizar tag de faturamento no AC
  const lead = await env.DB.prepare('SELECT nome, whatsapp, email FROM leads WHERE id = ?').bind(id).first();
  if (lead?.email) {
    context.waitUntil(
      acSyncContact(env, lead)
        .then(cid => cid && acAddTag(env, cid, 'Faturamento: ' + faturamento))
        .catch(() => {})
    );
  }

  return json({ ok: true });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
