import { acSyncContact, acAddTag } from '../_ac.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  let body = {};
  try { body = await request.json(); } catch {}

  const { nome, whatsapp, email, faturamento } = body;
  if (!nome && !whatsapp) return json({ ok: false, error: 'Dados insuficientes' }, 400);

  const cookieHeader = request.headers.get('Cookie') || '';
  const sidMatch     = cookieHeader.match(/_krob_sid=([^;]+)/);
  const session_id   = sidMatch ? decodeURIComponent(sidMatch[1]) : '';

  const result = await env.DB.prepare(
    'INSERT INTO leads (nome, whatsapp, email, faturamento, session_id) VALUES (?, ?, ?, ?, ?)'
  ).bind(nome || '', whatsapp || '', email || '', faturamento || '', session_id).run();

  // Sincroniza contato no ActiveCampaign (não bloqueia resposta)
  if (email) {
    context.waitUntil(
      acSyncContact(env, { nome, whatsapp, email })
        .then(id => id && acAddTag(env, id, 'ventture-leads'))
        .catch(() => {})
    );
  }

  return json({ ok: true, id: result.meta.last_row_id });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
