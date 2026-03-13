// Vercel Serverless Function — /api/contact
// Sends investor pack requests via Resend to info@chargedventures.io

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, message } = req.body || {};

  if (!name && !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  // Build the email HTML
  const htmlBody = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fafaf8; border: 1px solid #e8e8e8; border-radius: 12px;">
      <div style="margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid #e0e0e0;">
        <h2 style="margin: 0 0 4px; font-size: 20px; font-weight: 600; color: #191919;">New Investor Pack Request</h2>
        <p style="margin: 0; font-size: 13px; color: #888;">Siam Preferred Property Fund</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #333;">
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555; width: 100px; vertical-align: top;">Name</td>
          <td style="padding: 10px 0;">${escapeHtml(name || '—')}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555; vertical-align: top;">Email</td>
          <td style="padding: 10px 0;"><a href="mailto:${escapeHtml(email || '')}" style="color: #191919;">${escapeHtml(email || '—')}</a></td>
        </tr>
        ${phone ? `<tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555; vertical-align: top;">Phone</td>
          <td style="padding: 10px 0;">${escapeHtml(phone)}</td>
        </tr>` : ''}
        ${message ? `<tr>
          <td style="padding: 10px 0; font-weight: 600; color: #555; vertical-align: top;">Message</td>
          <td style="padding: 10px 0;">${escapeHtml(message)}</td>
        </tr>` : ''}
      </table>
      <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e0e0e0;">
        <p style="margin: 0; font-size: 11px; color: #aaa;">Sent from siam-real-estate-fund.vercel.app</p>
      </div>
    </div>
  `;

  const textBody = [
    'New Investor Pack Request — Siam Preferred Property Fund',
    '',
    `Name: ${name || '—'}`,
    `Email: ${email || '—'}`,
    phone ? `Phone: ${phone}` : null,
    message ? `Message: ${message}` : null,
    '',
    'Sent from siam-real-estate-fund.vercel.app'
  ].filter(Boolean).join('\n');

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Siam Preferred Property Fund <onboarding@resend.dev>',
        to: ['romanshp@gmail.com'],
        subject: `Investor Pack Request — ${name || 'Website visitor'}`,
        html: htmlBody,
        text: textBody,
        reply_to: email || undefined,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Resend API error:', data);
      return res.status(response.status).json({ 
        error: 'Failed to send email',
        details: data.message || data.name || 'Unknown error'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Investor pack request sent successfully',
      id: data.id 
    });

  } catch (err) {
    console.error('Email send error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
