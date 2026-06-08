// ActiveCampaign v3 helper — usado por api/submit.js e api/submit/faturamento.js

function base(env)    { return env.AC_API_URL.replace(/\/$/, '') + '/api/3'; }
function headers(env) { return { 'Api-Token': env.AC_API_KEY, 'Content-Type': 'application/json' }; }

// Cria ou atualiza contato (upsert por e-mail). Retorna o ID do contato no AC.
export async function acSyncContact(env, { nome, whatsapp, email }) {
  if (!env.AC_API_URL || !env.AC_API_KEY || !email) return null;

  const res = await fetch(base(env) + '/contact/sync', {
    method:  'POST',
    headers: headers(env),
    body: JSON.stringify({
      contact: {
        email,
        firstName: (nome || '').split(' ')[0],
        lastName:  (nome || '').split(' ').slice(1).join(' '),
        phone:     normalizePhone(whatsapp || ''),
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  return data?.contact?.id ?? null;
}

// Adiciona uma tag ao contato. Cria a tag se não existir.
export async function acAddTag(env, contactId, tagName) {
  if (!env.AC_API_URL || !env.AC_API_KEY || !contactId || !tagName) return;

  // Busca tag existente
  const searchRes  = await fetch(base(env) + '/tags?search=' + encodeURIComponent(tagName), { headers: headers(env) });
  const searchData = await searchRes.json().catch(() => ({}));

  let tagId = searchData?.tags?.[0]?.id;

  // Cria se não encontrou
  if (!tagId) {
    const createRes  = await fetch(base(env) + '/tags', {
      method:  'POST',
      headers: headers(env),
      body: JSON.stringify({ tag: { tag: tagName, tagType: 'contact' } }),
    });
    const createData = await createRes.json().catch(() => ({}));
    tagId = createData?.tag?.id;
  }

  if (!tagId) return;

  await fetch(base(env) + '/contactTags', {
    method:  'POST',
    headers: headers(env),
    body: JSON.stringify({ contactTag: { contact: String(contactId), tag: String(tagId) } }),
  });
}

// ── HELPERS ──────────────────────────────────────────────────────────────────

function normalizePhone(raw) {
  let p = raw.replace(/\D/g, '');
  if (p.length <= 11) p = '55' + p;
  return '+' + p;
}
