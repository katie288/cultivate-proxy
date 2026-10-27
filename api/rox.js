// /api/rox — CX-EX Connection diagnostic (Strategic Advisory Service, framework by Nathan Dring & Associates)
// GET  /api/rox?code=XXXX  -> { ok, organisation }   (checks an access code)
// POST /api/rox            -> { ok }                 (emails one completed response)
//
// Environment variables (Vercel > Project > Settings > Environment Variables):
//   ROX_CODES  access codes as JSON, one per organisation, e.g. {"BENNETTHAY26":"Bennett Hay"}
//   ROX_TO     where responses go (optional; falls back to AGWT_TO)
//   ROX_FROM   sender on a domain verified in Resend (optional; falls back to AGWT_FROM)
//   RESEND_API_KEY  already set for the other diagnostics
//
// The access code PREVIEW always works and never sends anything.

const LENSES = { cx: 'CX connection', rox: 'Return on Experience', ex: 'EX connection' };
const LENS_QS = { cx: [1, 4, 7, 10, 13], rox: [2, 5, 8, 11, 14], ex: [3, 6, 9, 12, 15] };
const THEMES = ['Expectations', 'Value', 'Identity', 'Direction', 'Alignment', 'Meaning', 'Compliance', 'Consistency', 'Ownership', 'Metrics', 'Impact', 'Discretionary effort', 'Accountability', 'Investment', 'Trust'];
const LENS_OF = ['cx', 'rox', 'ex'];
const SCALE = ['Not a chance', 'On a good day', 'Sometimes', 'Pretty often', 'Most days', "It's just what we do"];
const GROUPS = { C: 'Customer-facing', B: 'Back office', T: 'Team leader', S: 'Senior leader' };
const SITE = 'https://cultivate-proxy.vercel.app/connection';

function codes() {
  let list = {};
  try { list = JSON.parse(process.env.ROX_CODES || '{}'); } catch (e) { list = {}; }
  const out = {};
  for (const k of Object.keys(list)) out[k.trim().toUpperCase()] = list[k];
  return out;
}
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const avg = (a, l) => (LENS_QS[l].reduce((s, n) => s + a[n - 1], 0) / 5).toFixed(1);

function html(org, group, answers, roxCode) {
  const rows = answers.map((v, i) => `<tr>
    <td style="padding:6px 10px 6px 0;color:#A67C00;white-space:nowrap">Q${i + 1}</td>
    <td style="padding:6px 10px 6px 0;color:#595959;white-space:nowrap">${LENSES[LENS_OF[i % 3]]}</td>
    <td style="padding:6px 10px 6px 0">${THEMES[i]}</td>
    <td style="padding:6px 0;text-align:right;white-space:nowrap"><b>${v}</b> · ${esc(SCALE[v - 1])}</td></tr>`).join('');
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1C1C1C;max-width:680px">
  <div style="background:#0B0B0B;color:#fff;padding:18px 20px;border-bottom:4px solid #FFCC00">
    <div style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#FFCC00;font-weight:bold">Strategic Advisory Service</div>
    <div style="font-family:'Arial Black',Arial,sans-serif;font-size:22px;margin-top:6px">CX-EX Connection: new response</div>
  </div>
  <p style="margin:18px 0 6px"><b>${esc(org)}</b> · ${esc(GROUPS[group])}</p>
  <p style="margin:0 0 16px">CX connection <b>${avg(answers, 'cx')}</b> · Return on Experience <b>${avg(answers, 'rox')}</b> · EX connection <b>${avg(answers, 'ex')}</b> <span style="color:#7F7F7F">(out of 6)</span></p>
  <p style="margin:0 0 6px">Response code for the facilitator view:</p>
  <p style="font-family:Consolas,Menlo,monospace;background:#F3F3F3;border:1px dashed #A67C00;padding:10px 12px;margin:0 0 6px">${esc(roxCode)}</p>
  <p style="margin:0 0 18px;color:#595959">Paste the codes from every response into <a href="${SITE}#team">the facilitator view</a> to see group spider graphs and gaps.</p>
  <table style="border-collapse:collapse;width:100%;font-size:13px">${rows}</table>
  <p style="color:#7F7F7F;font-size:12px;margin-top:18px">Responses are anonymous: only the respondent's group is recorded.</p>
</div>`;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  const list = codes();

  if (req.method === 'GET') {
    const code = String((req.query && req.query.code) || '').trim().toUpperCase();
    if (code === 'PREVIEW') return res.status(200).json({ ok: true, organisation: '', preview: true });
    if (code && list[code]) return res.status(200).json({ ok: true, organisation: list[code] });
    return res.status(200).json({ ok: false });
  }

  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method' });

  let p = req.body;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { p = null; } }
  if (!p) return res.status(400).json({ ok: false, error: 'bad payload' });
  const code = String(p.code || '').trim().toUpperCase();
  const group = String(p.group || '');
  const answers = Array.isArray(p.answers) ? p.answers.map(Number) : [];
  if (code === 'PREVIEW') return res.status(200).json({ ok: true, preview: true });
  if (!list[code]) return res.status(403).json({ ok: false, error: 'code' });
  if (!GROUPS[group] || answers.length !== 15 || !answers.every(v => Number.isInteger(v) && v >= 1 && v <= 6)) {
    return res.status(400).json({ ok: false, error: 'bad payload' });
  }

  const org = list[code];
  const orgSlug = org.trim().replace(/\s+/g, '+').replace(/[^A-Za-z0-9+&'-]/g, '');
  const roxCode = `ROX1.${group}.${answers.join('')}${orgSlug ? '.' + orgSlug : ''}`;

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.ROX_FROM || process.env.AGWT_FROM,
      to: [process.env.ROX_TO || process.env.AGWT_TO],
      subject: `CX-EX Connection: ${org} · ${GROUPS[group]}`,
      html: html(org, group, answers, roxCode),
      text: `CX-EX Connection response\n${org} · ${GROUPS[group]}\n\n${roxCode}\n\nPaste into ${SITE}#team`
    })
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    console.error('Resend error', r.status, t);
    return res.status(502).json({ ok: false, error: 'email' });
  }
  return res.status(200).json({ ok: true });
}
