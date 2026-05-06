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

  const { name, email, report } = await req.json();

  const reportHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #80005a;">
      <div style="background: #ffa9f9; padding: 40px; text-align: center;">
        <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 8px;">Your CX Training Needs Report</h1>
        <p style="font-size: 14px; opacity: 0.8; margin: 0;">Prepared by CULTIVATE Customer Experience by Design</p>
      </div>
      <div style="background: #faf8f4; padding: 32px;">
        <div style="background: #fff; border: 1px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">In summary</p>
          <p style="font-size: 15px; line-height: 1.7; margin: 0;">${report.headline}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Where you are now</p>
          <p style="font-size: 15px; line-height: 1.7; margin: 0; color: #6b6b6b;">${report.maturity_insight}</p>
        </div>
        <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 20px 0 12px;">Priority training areas</p>
        ${(report.priority_areas || []).map(pa => `
          <div style="background: #fff; border: 1px solid #e8e4de; border-left: 3px solid ${pa.priority === 'high' ? '#80005a' : pa.priority === 'medium' ? '#c9883a' : '#a0c878'}; padding: 16px 20px; margin-bottom: 10px;">
            <p style="font-size: 14px; font-weight: bold; margin: 0 0 6px;">${pa.area} (${pa.priority} priority)</p>
            <p style="font-size: 13px; color: #6b6b6b; margin: 0 0 4px;">${pa.rationale}</p>
            <p style="font-size: 12px; color: #c9883a; font-style: italic; margin: 0;">${pa.cultivate_angle}</p>
          </div>
        `).join('')}
        <div style="background: #fff; border: 1px solid #e8e4de; border-radius: 8px; padding: 24px; margin: 16px 0;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Recommended approach</p>
          <p style="font-size: 15px; font-style: italic; color: #6b6b6b; line-height: 1.7; margin: 0;">${report.recommended_approach}</p>
        </div>
        <div style="background: #fff; border: 1px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Questions worth exploring together</p>
          ${(report.discovery_questions || []).map(q => `<p style="font-size: 14px; color: #6b6b6b; padding: 6px 0; margin: 0;">• ${q}</p>`).join('')}
        </div>
      </div>
      <div style="background: #ffa9f9; padding: 32px; text-align: center;">
        <p style="font-size: 15px; margin: 0 0 16px;">${report.next_step_copy}</p>
        <a href="mailto:katie@cultivatecustomerexperience.com" style="display: inline-block; background: #80005a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: bold;">Book a discovery conversation</a>
        <p style="font-size: 12px; margin: 20px 0 0; opacity: 0.7;">Katie x</p>
      </div>
    </div>
  `;

  try {
    // Send to client
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + resendKey
      },
      body: JSON.stringify({
        from: 'CULTIVATE <katie@cultivatecustomerexperience.com>',
        to: [email],
        subject: 'Your CX Training Needs Report — CULTIVATE',
        html: reportHtml
      })
    });
    const clientData = await clientRes.text();
    console.log('Client email:', clientRes.status, clientData);

    // Send to Katie
    const katieRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + resendKey
      },
      body: JSON.stringify({
        from: 'CULTIVATE Diagnostic <katie@cultivatecustomerexperience.com>',
        to: ['katie@cultivatecustomerexperience.com'],
        subject: 'New diagnostic: ' + name + ' (' + email + ')',
        html: '<p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + email + '</p>' + reportHtml
      })
    });
    const katieData = await katieRes.text();
    console.log('Katie email:', katieRes.status, katieData);

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  } catch(err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
}
