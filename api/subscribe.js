// Vercel Serverless Function — Brevo contact proxy.
//
// Why this exists: the Brevo API key is a SECRET and must never ship in
// client-side JS on a static site. The browser form posts here (same-origin);
// this function holds the key in an environment variable and forwards the
// contact to Brevo. Set BREVO_API_KEY (and optionally BREVO_LIST_ID) in the
// Vercel project's Environment Variables — never commit the key.

const BREVO_CONTACTS_URL = 'https://api.brevo.com/v3/contacts';

async function createBrevoContact(apiKey, listId, { email, attributes }) {
  return fetch(BREVO_CONTACTS_URL, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      email,
      attributes,
      listIds: [listId],
      updateEnabled: true, // upsert: don't fail if the contact already exists
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'brevo_not_configured' });
  }
  const listId = Number(process.env.BREVO_LIST_ID || 15);

  try {
    const body =
      typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const email = (body.email || '').trim();
    if (!email) return res.status(400).json({ error: 'email_required' });

    const attributes = {};
    if (body.firstName) attributes.FIRSTNAME = String(body.firstName).trim();
    if (body.lastName) attributes.LASTNAME = String(body.lastName).trim();
    if (body.phone) {
      // Brevo's SMS attribute wants a clean international number (no spaces).
      attributes.SMS = String(body.phone).replace(/[^\d+]/g, '');
    }

    let brevoRes = await createBrevoContact(apiKey, listId, { email, attributes });

    // If a bad phone number tripped SMS validation, retry without it so the
    // contact is still added to the list.
    if (!brevoRes.ok && attributes.SMS) {
      delete attributes.SMS;
      brevoRes = await createBrevoContact(apiKey, listId, { email, attributes });
    }

    if (!brevoRes.ok) {
      const detail = await brevoRes.text();
      return res.status(502).json({ error: 'brevo_failed', status: brevoRes.status, detail });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'exception', detail: String(err) });
  }
}
