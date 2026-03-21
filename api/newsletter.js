import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function sanitize(str) {
  return escapeHtml(str.trim().replace(/<[^>]*>/g, ''));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstile(token, ip) {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });
    const data = await response.json();
    return data.success === true;
  } catch {
    return false;
  }
}

async function checkRateLimit(ip) {
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
  const { count, error } = await supabase
    .from('form_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('form_type', 'newsletter')
    .gte('created_at', oneHourAgo);

  if (error) return false; // Fail closed
  return (count ?? 0) < 3;
}

async function subscribeToMailchimp(email) {
  const server = process.env.MAILCHIMP_SERVER_PREFIX;
  const listId = process.env.MAILCHIMP_LIST_ID;
  const apiKey = process.env.MAILCHIMP_API_KEY;

  const response = await fetch(
    `https://${server}.api.mailchimp.com/3.0/lists/${listId}/members`,
    {
      method: 'POST',
      headers: {
        Authorization: `apikey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email_address: email, status: 'subscribed' }),
    }
  );

  if (response.ok) return { success: true };
  const data = await response.json();
  if (data.title === 'Member Exists') return { success: true };
  return { success: false, error: data.detail || 'Subscription failed' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, 'cf-turnstile-response': turnstileToken, fax_number } = req.body || {};

    // Honeypot
    if (fax_number) {
      return res.status(200).json({ success: true });
    }

    // Turnstile
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken, ip))) {
      return res.status(403).json({ error: 'Spam check failed. Please try again.' });
    }

    // Rate limit
    if (!(await checkRateLimit(ip))) {
      return res.status(429).json({ error: 'Too many attempts. Please try again later.' });
    }

    // Validate
    const cleanEmail = sanitize(email || '').slice(0, 320);
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Subscribe to Mailchimp
    const result = await subscribeToMailchimp(cleanEmail);

    // Log to Supabase
    const { error: dbError } = await supabase.from('form_submissions').insert({
      form_type: 'newsletter',
      data: { email: cleanEmail, mailchimp_success: result.success, source: 'coming-soon' },
      ip_address: ip,
    });

    if (dbError) {
      console.error('Supabase insert error:', dbError.message);
    }

    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Subscription failed. Please try again.' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Newsletter error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
