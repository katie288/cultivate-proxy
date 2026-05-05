export const config = { 
  runtime: 'edge',
  maxDuration: 60
};

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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const resendKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 500, headers });
  }

  const body = await req.json();

  // If this is an email request
  if (body.type === 'send_email') {
    const { name, email, report } = body;

    const reportHtml = `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #80005a;">
        <div style="background: #ffa9f9; padding: 40px; text-align: center;">
          <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 0 0 8px;">Your CX Training Needs Report</h1>
          <p style="font-size: 14px; opacity: 0.8; margin: 0;">Prepared by CULTIVATE Customer Experience by Design</p>
        </div>
        <div style="background: #faf8f4; padding: 32px;">
          <div style="background: #fff; border: 0.5px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
            <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">In summary</p>
            <p style="font-size: 15px; line-height: 1.7; margin: 0;">${report.headline}</p>
          </div>
          <div style="background: #fff; border: 0.5px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
            <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Where you are now</p>
            <p style="font-size: 15px; line-height: 1.7; margin: 0; color: #6b6b6b;">${report.maturity_insight}</p>
          </div>
          <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 20px 0 12px;">Priority training areas</p>
          ${(report.priority_areas || []).map(pa => `
            <div style="background: #fff; border: 0.5px solid #e8e4de; border-left: 3px solid ${pa.priority === 'high' ? '#80005a' : pa.priority === 'medium' ? '#c9883a' : '#a0c878'}; border-radius: 0 8px 8px 0; padding: 16px 20px; margin-bottom: 10px;">
              <p style="font-size: 14px; font-weight: 500; margin: 0 0 4px;">${pa.area} <span style="font-size: 11px; background: #f5e6d3; color: #7a5a2a; padding: 2px 8px; border-radius: 10px;">${pa.priority}</span></p>
              <p style="font-size: 13px; color: #6b6b6b; margin: 0 0 4px; line-height: 1.6;">${pa.rationale}</p>
              <p style="font-size: 12px; color: #c9883a; font-style: italic; margin: 0;">${pa.cultivate_angle}</p>
            </div>
          `).join('')}
          <div style="background: #fff; border: 0.5px solid #e8e4de; border-radius: 8px; padding: 24px; margin: 16px 0;">
            <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Recommended approach</p>
            <p style="font-size: 15px; font-style: italic; color: #6b6b6b; line-height: 1.7; margin: 0;">${report.recommended_approach}</p>
          </div>
          <div style="background: #fff; border: 0.5px solid #e8e4de; border-radius: 8px; padding: 24px; margin-bottom: 16px;">
            <p style="font-size: 11px; color: #c9883a; text-transform: uppercase; letter-spacing: 1.2px; margin: 0 0 10px;">Questions worth exploring together</p>
            ${(report.discovery_questions || []).map(q => `<p style="font-size: 14px; color: #6b6b6b; padding: 8px 0; border-bottom: 0.5px solid #e8e4de; margin: 0; line-height: 1.6;">• ${q}</p>`).join('')}
          </div>
        </div>
        <div style="background: #ffa9f9; padding: 32px; text-align: center;">
          <p style="font-size: 15px; margin: 0 0 16px;">${report.next_step_copy}</p>
          <a href="mailto:katie@cultivatecustomerexperience.com" style="display: inline-block; background: #80005a; color: #fff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500;">Book a discovery conversation →</a>
          <p style="font-size: 12px; margin: 20px 0 0; opacity: 0.7;">Katie x</p>
        </div>
        <div style="background: #ffa9f9; padding: 16px; text-align: center; border-top: 0.5px solid rgba(128,0,90,0.12);">
          <p style="font-size: 11px; color: #80005a; opacity: 0.6; margin: 0;">© 2026 CULTIVATE Customer Experience by Design · www.cultivatecustomerexperience.com</p>
        </div>
      </div>
    `;

    // Send to client
    await fetch('https://api.resend.com/emails', {
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

    // Send copy to Katie
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + resendKey
      },
      body: JSON.stringify({
        from: 'CULTIVATE Diagnostic <katie@cultivatecustomerexperience.com>',
        to: ['katie@cultivatecustomerexperience.com'],
        subject: 'New diagnostic completed — ' + name + ' (' + email + ')',
        html: '<p><strong>Name:</strong> ' + name + '</p><p><strong>Email:</strong> ' + email + '</p>' + reportHtml
      })
    });

    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
  }

  // Otherwise proxy to Anthropic
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(body)
  });

  const data = await response.text();
  return new Response(data, { status: response.status, headers });
}
