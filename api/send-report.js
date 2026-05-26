export const config = { runtime: 'edge' };

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return new Response(JSON.stringify({ error: 'Resend key not configured' }), { status: 500, headers });
  }

  const body = await req.json();
  const { to, cc, subject, name, organisation, report } = body;

  // Convert plain text report to readable HTML
  const reportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; color: #111111;">
      <div style="background: #ffa9f9; padding: 40px; text-align: center;">
        <h1 style="font-family: Georgia, serif; font-size: 26px; margin: 0 0 8px; color: #111111;">CX-ISM Leadership Awareness Report</h1>
        <p style="font-size: 14px; color: #111111; opacity: 0.7; margin: 0;">The CX-ISM Method™ · Cultivate Customer Experience</p>
      </div>
      <div style="background: #faf8f4; padding: 32px;">
        <div style="background: #ffffff; border: 1px solid #e8e4de; border-radius: 8px; padding: 20px 24px; margin-bottom: 16px;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 8px;">Participant</p>
          <p style="font-size: 15px; font-weight: bold; margin: 0 0 4px;">${name || 'Not provided'}</p>
          <p style="font-size: 14px; color: #6b6b6b; margin: 0;">${organisation || 'Not provided'}</p>
        </div>
        <div style="background: #ffffff; border: 1px solid #e8e4de; border-radius: 8px; padding: 24px;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 16px;">Full Report</p>
          <div style="font-size: 15px; line-height: 1.8; color: #2a2a2a; white-space: pre-wrap;">${(report || '').replace(/## /g, '<br><strong style="font-size:16px;color:#111111;">').replace(/\n\n/g, '</strong><br><br>').replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</div>
        </div>
      </div>
      <div style="background: #111111; padding: 24px; text-align: center;">
        <p style="font-size: 12px; color: rgba(255,255,255,0.4); margin: 0;">CX-ISM Method™ · Cultivate Customer Experience · katie@cultivatecustomerexperience.com</p>
      </div>
    </div>
  `;

  try {
    const toAddresses = [to];
    if (cc) toAddresses.push(cc);

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + resendKey
      },
      body: JSON.stringify({
        from: 'CULTIVATE <katie@cultivatecustomerexperience.com>',
        to: toAddresses,
        subject: subject || 'CX-ISM Assessment Report — ' + (name || ''),
        html: reportHtml
      })
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
