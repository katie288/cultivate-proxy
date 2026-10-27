/* CX-EX Connection findings report (Strategic Advisory Service)
 * Builds a 13-page PDF from the facilitator view's group results. Every chart is drawn
 * as vector shapes, so nothing depends on a viewer's chart support.
 * Browser: window.buildRoxReport(ctx) -> jsPDF document (call .save(fileName)).
 * ctx = { org, date, example, groups:['C','B',...], counts:{C:n,...}, means:{C:[15],...}, overall:[15],
 *         focus:[question index x3] (optional), notes:{ov:'', 'q<n>m':'', 'q<n>c':''} (optional) }
 */
(function (root) {
  'use strict';

  const LENSES = {
    cx: { name: 'CX connection', short: 'CX', what: 'How work lands with customers' },
    rox: { name: 'Return on Experience', short: 'RoX', what: 'Where CX and EX pay back' },
    ex: { name: 'EX connection', short: 'EX', what: 'What the work means to people' }
  };
  const LINES = [
    ['What drives behaviour?', [[1, 'cx', 'Expectations', 'Would customers say they know exactly what to expect from us, every time they deal with us?'], [2, 'rox', 'Value', 'Do people understand how their work creates value for customers and for colleagues?'], [3, 'ex', 'Identity', 'Do people feel they can bring their best self to work, rather than the version they think is expected?']]],
    ['How do we lead?', [[4, 'cx', 'Direction', 'Do people know how their role shapes the customer experience, even if they never speak to a customer?'], [5, 'rox', 'Alignment', 'Do leaders bring commercial, customer and employee goals together into one story people can follow?'], [6, 'ex', 'Meaning', 'Do people understand why their work matters, beyond what their job title says?']]],
    ['What does good look like?', [[7, 'cx', 'Compliance', 'Do people follow the customer process properly, even when no one is watching?'], [8, 'rox', 'Consistency', 'Do customers get a consistently great experience, whoever they deal with and however they contact us?'], [9, 'ex', 'Ownership', 'Do people take the initiative to fix things without waiting to be told?']]],
    ['How do we measure it?', [[10, 'cx', 'Metrics', 'Do leaders track what matters to customers, rather than what is easiest to measure?'], [11, 'rox', 'Impact', 'Do leaders track how customer and employee experience together move the results that matter?'], [12, 'ex', 'Discretionary effort', 'Do people go beyond what is required because they want to, rather than because they are asked?']]],
    ['Are we serious?', [[13, 'cx', 'Accountability', 'When customer standards are not met, do leaders follow through consistently?'], [14, 'rox', 'Investment', 'Do leaders invest in customer and employee experience equally, rather than favouring one?'], [15, 'ex', 'Trust', 'Do leaders give people the autonomy to do their job well, without checking every step?']]]
  ];
  const QS = [];
  LINES.forEach(l => l[1].forEach(q => QS.push({ n: q[0], lens: q[1], theme: q[2], text: q[3], line: l[0] })));
  const LENS_QS = { cx: [1, 4, 7, 10, 13], rox: [2, 5, 8, 11, 14], ex: [3, 6, 9, 12, 15] };
  const SCALE = ['Not a chance', 'On a good day', 'Sometimes', 'Pretty often', 'Most days', "It's just what we do"];
  const GROUP = {
    C: { name: 'Customer-facing', color: 'FFCC00', text: 'A67C00' },
    B: { name: 'Back office', color: 'A67C00', text: 'A67C00' },
    T: { name: 'Team leaders', color: 'A6A6A6', text: '7F7F7F' },
    S: { name: 'Senior leaders', color: '1A1A1A', text: '1A1A1A' }
  };
  const C = { black: '0B0B0B', panel: '1A1A1A', panel2: '262626', line: '3A3A3A', yellow: 'FFCC00', gold: 'A67C00', white: 'FFFFFF', paper: 'F3F3F3', rule: 'D9D9D9', ink: '1C1C1C', body: '404040', mute: '7F7F7F', soft: 'A6A6A6', grid: 'E6E6E6' };
  const W = 13.333, H = 7.5, M = 0.6;

  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const r1 = v => Math.round(v * 10) / 10;
  const f1 = v => isFinite(v) ? r1(v).toFixed(1) : '-';
  const word = v => SCALE[Math.min(5, Math.max(0, Math.round(v) - 1))];
  const lensOf = (vals, l) => mean(LENS_QS[l].map(n => vals[n - 1]));
  // The built-in PDF fonts only cover Latin-1, so swap typographic characters for safe ones.
  const clean = s => String(s == null ? '' : s)
    .replace(/[‘’‛′]/g, "'").replace(/[“”‟″]/g, '"')
    .replace(/[–—−]/g, '-').replace(/…/g, '...').replace(/[   ]/g, ' ')
    .replace(/[•]/g, '·').replace(/[^\x09\x0A\x0D\x20-\x7E -ÿ]/g, '');

  function buildRoxReport(ctx, Ctor) {
    const JsPDF = Ctor || (root.jspdf && root.jspdf.jsPDF) || root.jsPDF;
    const doc = new JsPDF({ orientation: 'landscape', unit: 'in', format: [W, H], compress: true });
    const org = clean(ctx.org || 'Your organisation');
    doc.setProperties({ title: `CX-EX Connection findings: ${org}`, author: 'Strategic Advisory Service', creator: 'Strategic Advisory Service' });

    const groups = ctx.groups, means = ctx.means, overall = ctx.overall;
    const notes = ctx.notes || {};
    const total = groups.reduce((s, g) => s + (ctx.counts[g] || 0), 0);
    const multi = groups.length > 1;
    let page = 0;

    /* ---------- drawing primitives ---------- */
    const col = h => '#' + h;
    function rect(x, y, w, h, fill, stroke, lw, dash) {
      if (fill) doc.setFillColor(col(fill));
      if (stroke) { doc.setDrawColor(col(stroke)); doc.setLineWidth(lw || 0.01); }
      if (dash) doc.setLineDashPattern(dash, 0);
      doc.rect(x, y, w, h, fill && stroke ? 'FD' : fill ? 'F' : 'S');
      if (dash) doc.setLineDashPattern([], 0);
    }
    function line(x1, y1, x2, y2, color, lw, dash) {
      doc.setDrawColor(col(color)); doc.setLineWidth(lw || 0.01);
      if (dash) doc.setLineDashPattern(dash, 0);
      doc.line(x1, y1, x2, y2);
      if (dash) doc.setLineDashPattern([], 0);
    }
    function poly(pts, fill, stroke, lw, opacity) {
      const d = pts.slice(1).map((p, i) => [p[0] - pts[i][0], p[1] - pts[i][1]]);
      if (fill && opacity != null) {
        doc.saveGraphicsState(); doc.setGState(new doc.GState({ opacity }));
        doc.setFillColor(col(fill)); doc.lines(d, pts[0][0], pts[0][1], [1, 1], 'F', true);
        doc.restoreGraphicsState();
        fill = null;
      }
      if (fill) doc.setFillColor(col(fill));
      if (stroke) { doc.setDrawColor(col(stroke)); doc.setLineWidth(lw || 0.01); }
      doc.lines(d, pts[0][0], pts[0][1], [1, 1], fill && stroke ? 'FD' : fill ? 'F' : 'S', true);
    }
    // text: y is the top of the text block; returns the block height (inches)
    function text(str, x, y, o) {
      o = o || {};
      const size = o.size || 12, lh = o.lh || 1.3;
      doc.setFont('helvetica', o.bold ? 'bold' : o.italic ? 'italic' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(col(o.color || C.ink));
      let lines = o.w ? doc.splitTextToSize(clean(str), o.w) : [clean(str)];
      if (o.maxLines && lines.length > o.maxLines) { lines = lines.slice(0, o.maxLines); lines[lines.length - 1] = lines[lines.length - 1].replace(/\s*\S*$/, '...'); }
      const opts = { baseline: 'top', lineHeightFactor: lh };
      if (o.align) opts.align = o.align;
      if (o.space) opts.charSpace = o.space;
      doc.text(lines, x, y, opts);
      return lines.length * size / 72 * lh;
    }
    const textH = (str, w, size, lh, bold) => { doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); return doc.splitTextToSize(clean(str), w).length * size / 72 * (lh || 1.3); };

    /* ---------- shared furniture ---------- */
    function slide(dark) {
      if (page) doc.addPage([W, H], 'landscape');
      page++;
      rect(0, 0, W, H, dark ? C.black : C.white);
      [[C.panel2, C.line], [C.yellow, C.yellow], [dark ? C.white : C.rule, dark ? C.white : C.soft]].forEach((c, i) => rect(M + i * 0.17, 0.36, 0.11, 0.11, c[0], c[1], 0.007));
      text('STRATEGIC ADVISORY SERVICE', M + 0.6, 0.335, { size: 9, bold: true, color: dark ? C.yellow : C.gold, space: 0.02 });
      if (ctx.example) { rect(W - M - 2.0, 0.27, 2.0, 0.3, C.yellow); text('Illustrative example', W - M - 1.0, 0.335, { size: 10, bold: true, align: 'center' }); }
      if (page > 1) {
        text(`${org}  ·  CX-EX Connection findings`, M, H - 0.45, { size: 9, color: dark ? C.soft : C.mute });
        text(String(page), W - M, H - 0.45, { size: 9, color: dark ? C.soft : C.mute, align: 'right' });
      }
      return { dark };
    }
    function title(s, t, sub) {
      let size = 28;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(size);
      while (size > 20 && doc.getTextWidth(clean(t)) > W - 2 * M) { size -= 1; doc.setFontSize(size); }
      text(t, M, 0.78, { size, bold: true, color: s.dark ? C.white : C.ink, w: W - 2 * M, maxLines: 1 });
      if (sub) text(sub, M, 1.38, { size: 14, color: s.dark ? 'BFBFBF' : '595959', w: W - 2 * M, maxLines: 2 });
    }
    function noteBox(x, y, w, h, label, body) {
      rect(x, y, w, h, C.paper);
      rect(x, y, 0.06, h, C.yellow);
      text(label, x + 0.25, y + 0.18, { size: 12, bold: true });
      text(body, x + 0.25, y + 0.5, { size: 12, color: C.body, w: w - 0.45, lh: 1.35, maxLines: Math.max(1, Math.floor((h - 0.62) / (12 / 72 * 1.35))) });
    }
    function legend(x, y, withOverall) {
      let cx = x;
      groups.forEach(g => {
        rect(cx, y + 0.06, 0.3, 0.09, GROUP[g].color);
        text(`${GROUP[g].name} (${ctx.counts[g] || 0})`, cx + 0.38, y, { size: 10, color: C.body });
        cx += 2.3;
      });
      if (withOverall) { line(cx, y + 0.105, cx + 0.3, y + 0.105, 'BDBDBD', 0.025, [0.05, 0.04]); text('Overall', cx + 0.38, y, { size: 10, color: C.body }); }
    }
    function spider(cx, cy, R, labels, series, ringCol, labCol) {
      const pt = (i, v) => { const a = -Math.PI / 2 + i * 2 * Math.PI / 5; const r = R * v / 6; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
      for (let k = 1; k <= 6; k++) poly([0, 1, 2, 3, 4].map(i => pt(i, k)), null, k === 6 ? '9A9A9A' : ringCol, k === 6 ? 0.012 : 0.007);
      for (let i = 0; i < 5; i++) { const p = pt(i, 6); line(cx, cy, p[0], p[1], ringCol, 0.007); }
      [2, 4, 6].forEach(k => text(String(k), cx + 0.05, cy - R * k / 6 - 0.02, { size: 7, color: C.soft }));
      series.forEach(s => {
        const pts = s.vals.map((v, i) => pt(i, isFinite(v) ? v : 0));
        if (s.fill) poly(pts, s.color, null, 0, 0.14);
        if (s.dash) { doc.setLineDashPattern(s.dash, 0); poly(pts, null, s.color, s.lw); doc.setLineDashPattern([], 0); }
        else poly(pts, null, s.color, s.lw);
        pts.forEach(p => { doc.setFillColor(col(s.color)); doc.circle(p[0], p[1], s.dash ? 0.025 : 0.04, 'F'); });
      });
      labels.forEach((l, i) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        const lx = cx + (R + 0.14) * Math.cos(a), ly = cy + (R + 0.14) * Math.sin(a);
        const cosA = Math.cos(a);
        const align = Math.abs(cosA) < 0.2 ? 'center' : cosA > 0 ? 'left' : 'right';
        const yy = i === 0 ? ly - 0.2 : Math.sin(a) > 0.5 ? ly - 0.02 : ly - 0.08;
        text(l, lx, yy, { size: 9, color: labCol, align: align === 'left' ? undefined : align });
      });
    }
    // horizontal 0-6 bar
    function hbar(x, y, w, h, v, color, track) {
      rect(x, y, w, h, track || 'EEEEEE');
      if (isFinite(v) && v > 0) rect(x, y, Math.max(0.02, w * v / 6), h, color);
    }

    /* ---------- findings maths ---------- */
    const lensAvg = {};
    groups.forEach(g => { lensAvg[g] = { cx: lensOf(means[g], 'cx'), rox: lensOf(means[g], 'rox'), ex: lensOf(means[g], 'ex') }; });
    const overallLens = { cx: lensOf(overall, 'cx'), rox: lensOf(overall, 'rox'), ex: lensOf(overall, 'ex') };
    const weakest = g => ['cx', 'rox', 'ex'].slice().sort((a, b) => lensAvg[g][a] - lensAvg[g][b])[0];
    const allSameWeak = groups.every(g => weakest(g) === weakest(groups[0]));
    const groupAll = g => mean(means[g]);
    const byGroupAll = groups.slice().sort((a, b) => groupAll(b) - groupAll(a));
    const spreadOf = i => { const v = groups.map(g => means[g][i]); const hiV = Math.max(...v), loV = Math.min(...v); return { i, q: QS[i], spread: hiV - loV, hiG: groups[v.indexOf(hiV)], loG: groups[v.indexOf(loV)], hiV, loV }; };
    const ranked = QS.map((q, i) => ({ q, i, v: overall[i] })).sort((a, b) => b.v - a.v);
    const focusIdx = Array.isArray(ctx.focus) && ctx.focus.length ? ctx.focus
      : multi ? QS.map((q, i) => spreadOf(i)).sort((a, b) => b.spread - a.spread).slice(0, 3).map(s => s.i)
      : ranked.slice(-3).reverse().map(r => r.i);

    let headline;
    if (!multi) headline = `${LENSES[weakest(groups[0])].name} is the weakest of the three lenses`;
    else if (allSameWeak) headline = `${LENSES[weakest(groups[0])].name} is the weakest lens for every group`;
    else headline = `${GROUP[byGroupAll[0]].name} see the strongest connection, ${GROUP[byGroupAll[byGroupAll.length - 1]].name.toLowerCase()} the weakest`;

    /* ---------- 1. cover ---------- */
    {
      slide(true);
      rect(0, H - 0.12, W, 0.12, C.yellow);
      text('FINDINGS REPORT', M, 1.75, { size: 12, bold: true, color: C.yellow, space: 0.03 });
      text('CX-EX Connection', M, 2.15, { size: 54, bold: true, color: C.white });
      text('Return on Experience', M, 3.15, { size: 26, color: C.yellow });
      text(org, M, 4.2, { size: 26, bold: true, color: C.white, w: 11.5, maxLines: 1 });
      text(`${total} response${total === 1 ? '' : 's'} across ${groups.length} group${groups.length === 1 ? '' : 's'}  ·  ${clean(ctx.date)}`, M, 4.8, { size: 14, color: 'BFBFBF' });
      text('Prepared by the Strategic Advisory Service: Awards International, Cultivate Customer Experience by Design and Nathan Dring & Associates.', M, 6.6, { size: 10, color: C.soft });
    }

    /* ---------- 2. why it matters ---------- */
    {
      const s = slide(true);
      title(s, 'CX and EX pay back when they connect');
      text('Most organisations run customer experience and employee experience as separate agendas, with separate owners and budgets. Customers feel the join. The return on experience comes from connecting the two, so that how people feel about their work shows up in what customers receive.', M, 1.5, { size: 14, color: 'D9D9D9', w: 11.8, lh: 1.4 });
      const boxes = [
        ['CX connection', 'Doing the right thing for customers', 'People know the customer standard and deliver it. Necessary, but without engaged people it tends to hold only while someone is checking.', C.panel, C.yellow, C.yellow, 'D9D9D9', C.line],
        ['Return on Experience', 'Driving the outcomes that matter', 'Customer and employee experience reinforce each other, and leaders can see what that connection returns in results.', C.yellow, C.ink, C.ink, C.ink, C.yellow],
        ['EX connection', 'Doing what they love', 'People care about the work and bring themselves to it. Energy is high, but it does not reach customers by itself.', C.white, C.ink, C.ink, C.body, C.white]
      ];
      boxes.forEach((b, i) => {
        const x = M + i * 4.1;
        rect(x, 2.85, 3.85, 3.1, b[3], b[7], 0.01);
        text(b[0], x + 0.28, 3.1, { size: 17, bold: true, color: b[4] });
        text(b[1], x + 0.28, 3.55, { size: 13, color: b[5], w: 3.3 });
        text(b[2], x + 0.28, 4.15, { size: 12, color: b[6], w: 3.3, lh: 1.4 });
      });
    }

    /* ---------- 3. framework ---------- */
    {
      const s = slide(true);
      title(s, 'The framework: five lines of enquiry, three lenses');
      const x0 = M, colW = 3.35, rowH = 0.7, y0 = 1.65, lab = 2.1;
      const heads = [['CX connection', LENSES.cx.what, C.panel, C.white, C.line, C.yellow], ['Return on Experience', LENSES.rox.what, C.yellow, C.ink, C.yellow, C.ink], ['EX connection', LENSES.ex.what, C.white, C.ink, C.white, C.ink]];
      heads.forEach((h, j) => {
        const x = x0 + lab + 0.15 + j * (colW + 0.12);
        rect(x, y0, colW, 0.66, h[2], h[4], 0.01);
        text(h[0], x + colW / 2, y0 + 0.12, { size: 13, bold: true, color: h[3], align: 'center' });
        text(h[1], x + colW / 2, y0 + 0.38, { size: 10, color: h[3], align: 'center' });
      });
      LINES.forEach((l, i) => {
        const y = y0 + 0.8 + i * (rowH + 0.08);
        text(l[0], x0, y + rowH / 2 - 0.09, { size: 12, bold: true, color: 'BFBFBF' });
        l[1].forEach((q, j) => {
          const x = x0 + lab + 0.15 + j * (colW + 0.12), h = heads[j];
          rect(x, y, colW, rowH, h[2], h[4], 0.01);
          text(`Q${q[0]}  ${q[2]}`, x + colW / 2, y + rowH / 2 - 0.1, { size: 13, color: h[5], align: 'center' });
        });
      });
      text('Each column is one lens, with five questions. Every question uses the same six-point scale, where 6 always means a stronger connection.', M, 6.55, { size: 10, color: C.soft });
    }

    /* ---------- 4. who took part ---------- */
    {
      const s = slide(true);
      title(s, 'Who took part', `${total} ${total === 1 ? 'person' : 'people'} from ${org} answered fifteen questions about what normally happens there today.`);
      ['C', 'B', 'T', 'S'].forEach((g, i) => {
        const x = M + i * 3.07, n = ctx.counts[g] || 0;
        rect(x, 2.2, 2.9, 1.6, C.panel, C.line, 0.01);
        rect(x, 2.2, 2.9, 0.08, g === 'S' ? C.white : GROUP[g].color);
        text(String(n), x + 0.28, 2.45, { size: 40, bold: true, color: n ? C.white : C.line });
        text(GROUP[g].name, x + 0.28, 3.3, { size: 13, color: 'D9D9D9' });
      });
      text('HOW TO READ THE SCORES', M, 4.25, { size: 10, bold: true, color: C.yellow, space: 0.02 });
      SCALE.forEach((lbl, i) => {
        const x = M + i * 2.04, last = i === 5;
        rect(x, 4.6, 1.9, 1.1, last ? C.yellow : C.panel2);
        text(String(i + 1), x + 0.95, 4.72, { size: 24, bold: true, color: last ? C.ink : C.white, align: 'center' });
        text(lbl, x + 0.95, 5.3, { size: 11, bold: true, color: last ? C.ink : C.white, align: 'center' });
      });
      const small = groups.filter(g => (ctx.counts[g] || 0) > 0 && ctx.counts[g] < 3);
      text(`Scores are group averages on this scale. No question is reversed. Overall figures are the mean of the groups, so a large group does not drown out a small one.${small.length ? ` ${small.map(g => GROUP[g].name).join(' and ')} had fewer than three responses, so read ${small.length === 1 ? 'that group' : 'those groups'} with care.` : ''}`, M, 5.95, { size: 11, color: 'BFBFBF', w: 12.1, lh: 1.4 });
    }

    /* ---------- 5. headline: spider by lens ---------- */
    {
      const s = slide(false);
      title(s, headline, multi ? 'Average score for each question, by group. Bigger shapes mean a stronger connection.' : 'Average score for each question. Bigger shapes mean a stronger connection.');
      ['cx', 'rox', 'ex'].forEach((l, j) => {
        const cxp = M + 1.95 + j * 4.08;
        text(LENSES[l].name, cxp, 2.0, { size: 14, bold: true, align: 'center' });
        // group averages under the heading
        const parts = groups.map(g => ({ t: f1(lensAvg[g][l]), c: GROUP[g].text }));
        doc.setFont('helvetica', 'bold'); doc.setFontSize(12);
        const sep = '   ·   ';
        const widths = parts.map(p => doc.getTextWidth(p.t)), sepW = doc.getTextWidth(sep);
        let x = cxp - (widths.reduce((a, b) => a + b, 0) + sepW * (parts.length - 1)) / 2;
        parts.forEach((p, k) => {
          if (k) { text(sep, x, 2.3, { size: 12, color: C.soft }); x += sepW; }
          text(p.t, x, 2.3, { size: 12, bold: true, color: p.c }); x += widths[k];
        });
        const series = groups.map(g => ({ vals: LENS_QS[l].map(n => means[g][n - 1]), color: GROUP[g].color, lw: 0.025, fill: !multi }));
        if (multi) series.push({ vals: LENS_QS[l].map(n => overall[n - 1]), color: 'BDBDBD', lw: 0.015, dash: [0.05, 0.04] });
        spider(cxp, 4.25, 1.3, LENS_QS[l].map(n => QS[n - 1].theme), series, 'E3E3E3', '595959');
      });
      legend(M, 6.15, multi);
      const facts = groups.map(g => `${GROUP[g].name}: ${LENSES[weakest(g)].name} ${f1(lensAvg[g][weakest(g)])} is the lowest lens.`);
      text(facts.join('   '), M, 6.5, { size: 10, color: '595959', w: 12.1 });
    }

    /* ---------- 6. lens averages ---------- */
    {
      const s = slide(false);
      const lo = ['cx', 'rox', 'ex'].slice().sort((a, b) => overallLens[a] - overallLens[b])[0];
      title(s, multi ? 'An overall average would hide the real story' : 'Lens averages', multi ? 'The combined score shows the level. The group scores show where the connection breaks.' : 'The average of the five questions in each lens, out of 6.');
      // clustered column chart, 0-6
      const cx0 = M + 0.45, cy0 = 2.15, cw = 7.2, ch = 3.55, base = cy0 + ch;
      for (let k = 0; k <= 6; k++) {
        const y = base - ch * k / 6;
        line(cx0, y, cx0 + cw, y, k === 0 ? C.soft : C.grid, k === 0 ? 0.012 : 0.007);
        text(String(k), cx0 - 0.12, y - 0.07, { size: 9, color: C.mute, align: 'right' });
      }
      const sers = groups.map(g => ({ name: GROUP[g].name, color: GROUP[g].color, vals: ['cx', 'rox', 'ex'].map(l => lensAvg[g][l]) }));
      if (multi) sers.push({ name: 'Overall', color: 'D0D0D0', vals: ['cx', 'rox', 'ex'].map(l => overallLens[l]) });
      const slotW = cw / 3, inner = slotW * (sers.length === 1 ? 0.42 : 0.78), bw = inner / sers.length;
      ['CX connection', 'Return on Experience', 'EX connection'].forEach((lab, j) => {
        const sx = cx0 + j * slotW + (slotW - inner) / 2;
        sers.forEach((sr, k) => {
          const v = sr.vals[j], h = isFinite(v) ? ch * v / 6 : 0, x = sx + k * bw;
          rect(x + bw * 0.08, base - h, bw * 0.84, h, sr.color, sr.color === 'FFCC00' ? 'E0B400' : null, 0.006);
          text(f1(v), x + bw / 2, base - h - 0.2, { size: sers.length > 3 ? 8 : 10, bold: true, color: C.body, align: 'center' });
        });
        text(lab, cx0 + j * slotW + slotW / 2, base + 0.1, { size: 11, bold: true, color: C.body, align: 'center' });
      });
      if (multi) {
        let lx = cx0;
        sers.forEach(sr => { rect(lx, 6.2, 0.22, 0.12, sr.color); text(sr.name, lx + 0.3, 6.17, { size: 9.5, color: C.body }); lx += 0.42 + doc.getTextWidth(sr.name); });
      }
      const rx = 8.75, rw = 4.0;
      let y = 2.15;
      text('What the numbers say', rx, y, { size: 14, bold: true }); y += 0.38;
      y += text(`Overall, the three lenses average ${f1(overallLens.cx)}, ${f1(overallLens.rox)} and ${f1(overallLens.ex)}: CX connection reads as "${word(overallLens.cx).toLowerCase()}", Return on Experience as "${word(overallLens.rox).toLowerCase()}" and EX connection as "${word(overallLens.ex).toLowerCase()}". ${LENSES[lo].name} is the lowest.`, rx, y, { size: 12, color: C.body, w: rw, lh: 1.4 }) + 0.15;
      if (multi) {
        const hiG = byGroupAll[0], loG = byGroupAll[byGroupAll.length - 1];
        const rng = g => { const v = ['cx', 'rox', 'ex'].map(l => lensAvg[g][l]); return `${f1(Math.min(...v))} to ${f1(Math.max(...v))}`; };
        y += text(`Split by group, ${GROUP[loG].name.toLowerCase()} sit between ${rng(loG)} while ${GROUP[hiG].name.toLowerCase()} sit between ${rng(hiG)}.`, rx, y, { size: 12, color: C.body, w: rw, lh: 1.4 });
      }
      if (clean(notes.ov).trim()) noteBox(rx, 4.75, rw, 1.75, 'Your challenge', notes.ov);
    }

    /* ---------- 7-9. widest gaps, or lowest scores for a single group ---------- */
    const ordinal = ['', 'second ', 'third '];
    focusIdx.forEach((i, k) => {
      const s = slide(false), q = QS[i];
      if (multi) { const f = spreadOf(i); title(s, `${q.theme}: the ${ordinal[k]}widest gap between groups`, `${GROUP[f.hiG].name} score ${f1(f.hiV)}, ${GROUP[f.loG].name.toLowerCase()} score ${f1(f.loV)}: a gap of ${f1(f.spread)} on the six-point scale.`); }
      else title(s, `${q.theme}: the ${ordinal[k]}lowest score`, `An average of ${f1(overall[i])}, which reads as "${word(overall[i]).toLowerCase()}".`);
      const lensCol = q.lens === 'cx' ? C.panel : q.lens === 'rox' ? C.yellow : C.white;
      rect(M, 2.1, 3.2, 0.36, lensCol, q.lens === 'ex' ? C.rule : null, 0.01);
      text(`Q${q.n}  ${LENSES[q.lens].name}`, M + 1.6, 2.18, { size: 11, bold: true, color: q.lens === 'cx' ? C.yellow : C.ink, align: 'center' });
      text(q.text, M, 2.65, { size: 17, w: 5.6, lh: 1.3 });
      const nm = clean(notes['q' + q.n + 'm']).trim(), nc = clean(notes['q' + q.n + 'c']).trim();
      let ny = 3.95;
      if (nm) { const h = Math.min(1.6, 0.75 + textH(nm, 5.15, 12, 1.35)); noteBox(M, ny, 5.6, h, 'What this may mean', nm); ny += h + 0.18; }
      if (nc) { const h = Math.min(6.5 - ny, 0.75 + textH(nc, 5.15, 12, 1.35)); noteBox(M, ny, 5.6, h, 'Your challenge', nc); }

      // right: one bar per group on a 0-6 scale
      const bx = 7.0, bw = 5.7, top = 2.2;
      const rows = groups.map(g => ({ g, v: means[g][i] }));
      if (multi) rows.push({ g: null, v: overall[i] });
      const rowH = Math.min(0.95, 3.6 / rows.length);
      for (let t = 0; t <= 6; t++) {
        const x = bx + bw * t / 6;
        text(String(t), x, top + 0.45 + rows.length * rowH, { size: 9, color: C.mute, align: 'center' });
      }
      rows.forEach((r, k2) => {
        const y = top + 0.35 + k2 * rowH;
        text(r.g ? `${GROUP[r.g].name} (${ctx.counts[r.g] || 0})` : 'Overall', bx, y, { size: 10, bold: !r.g, color: C.body });
        const bh = Math.min(0.36, rowH - 0.38);
        hbar(bx, y + 0.22, bw, bh, r.v, r.g ? GROUP[r.g].color : 'BDBDBD', 'F1F1F1');
        for (let t = 1; t <= 6; t++) line(bx + bw * t / 6, y + 0.22, bx + bw * t / 6, y + 0.22 + bh, 'FFFFFF', 0.01);
        text(f1(r.v), bx + Math.max(0.02, bw * r.v / 6) + 0.1, y + 0.24, { size: 12, bold: true });
      });
      text(SCALE.map((w2, k3) => `${k3 + 1} ${w2}`).join('  ·  '), bx, top + 0.72 + rows.length * rowH, { size: 8, color: C.mute });
    });

    /* ---------- 10. strongest and weakest ---------- */
    {
      const s = slide(false);
      title(s, 'Where the connection is strongest, and where it is weakest', multi ? 'The three highest and three lowest questions, averaged across groups.' : 'The three highest and three lowest questions.');
      const column = (items, x, head, accent) => {
        text(head, x, 2.05, { size: 13, bold: true });
        items.forEach((it, k) => {
          const y = 2.5 + k * 1.3;
          rect(x, y, 5.85, 1.15, C.paper);
          text(`Q${it.q.n} ${it.q.theme}`, x + 0.22, y + 0.17, { size: 13, bold: true });
          doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
          text(LENSES[it.q.lens].name, x + 0.22 + doc.getTextWidth(`Q${it.q.n} ${it.q.theme}`) + 0.15, y + 0.2, { size: 10, color: C.mute });
          text(f1(it.v), x + 5.63, y + 0.1, { size: 22, bold: true, align: 'right' });
          hbar(x + 0.22, y + 0.62, 5.41, 0.12, it.v, accent, C.rule);
          text(word(it.v), x + 0.22, y + 0.82, { size: 10, color: C.mute });
        });
      };
      column(ranked.slice(0, 3), M, 'Strongest', C.yellow);
      column(ranked.slice(-3).reverse(), M + 6.3, 'Weakest', C.gold);
    }

    /* ---------- 11. what the scores tell us ---------- */
    {
      const s = slide(false);
      title(s, 'What the scores tell us, and what they do not', 'The results open a conversation. They do not close one.');
      const pts = [
        ['Bigger shapes mean stronger connection', 'Every question is scored so that 6 indicates stronger connection. A larger spider graph points to a stronger connection in that lens.', false],
        ['Differences between groups matter most', 'Where customer-facing, back-office, team leader and senior leader views pull apart, that gap is often the most useful finding. An overall average can hide it.', false],
        ['The reason needs discussion', 'A low score shows a gap worth exploring. It does not tell you why. Test each finding against real customer and colleague moments.', false],
        ['Connection is not a guarantee', 'Strong scores suggest customer and employee experience are connected today. They do not prove the return will follow. That is what the debrief is for.', true]
      ];
      pts.forEach((p, i) => {
        const x = M + (i % 2) * 6.15, y = 2.1 + Math.floor(i / 2) * 2.2, dark = p[2];
        rect(x, y, 5.95, 2.0, dark ? C.black : C.paper);
        rect(x + 0.25, y + 0.25, 0.42, 0.42, C.yellow);
        text(String(i + 1), x + 0.46, y + 0.34, { size: 14, bold: true, align: 'center' });
        text(p[0], x + 0.85, y + 0.34, { size: 14, bold: true, color: dark ? C.yellow : C.ink });
        text(p[1], x + 0.25, y + 0.88, { size: 12, color: dark ? 'D9D9D9' : C.body, w: 5.45, lh: 1.4 });
      });
    }

    /* ---------- 12. next conversation ---------- */
    {
      const s = slide(true);
      title(s, 'A useful next conversation');
      text('Bring one recent customer moment, whether it went well or not.', M, 1.5, { size: 20, color: C.yellow });
      text('In the debrief, we will explore:', M, 2.4, { size: 13, color: 'D9D9D9' });
      const b = [['What helped', 'Where the people behind the moment knew what mattered and were free to act.', C.panel, C.white, C.line], ['What got in the way', 'Where hand-offs, measures, budgets or trust pulled the experience apart.', C.yellow, C.ink, C.yellow], ['What changes next time', 'The one or two connections that would make the next customer moment land.', C.white, C.ink, C.white]];
      b.forEach((x, i) => {
        const bx = M + i * 4.1;
        rect(bx, 2.9, 3.85, 2.3, x[2], x[4], 0.01);
        text(String(i + 1), bx + 0.28, 3.08, { size: 24, bold: true, color: x[3] });
        text(x[0], bx + 0.28, 3.65, { size: 15, bold: true, color: x[3] });
        text(x[1], bx + 0.28, 4.1, { size: 12, color: i === 0 ? 'D9D9D9' : C.body, w: 3.3, lh: 1.4 });
      });
      text('Start with a real example and agree one practical change before the next review.', M, 5.65, { size: 14, bold: true, color: C.white });
    }

    /* ---------- 13. appendix ---------- */
    {
      const s = slide(false);
      title(s, 'Appendix: scores by question', 'Group averages on the six-point scale.');
      const hdr = ['Q', 'Lens', 'Theme'].concat(groups.map(g => GROUP[g].name)).concat(multi ? ['Overall'] : []);
      const fixed = [0.4, 0.6, 1.8], tw = 8.9, rest = (tw - 2.8) / (hdr.length - 3);
      const widths = fixed.concat(Array(hdr.length - 3).fill(rest));
      const xs = widths.reduce((a, w, k) => (a.push(a[k] + w), a), [M]);
      const rh = 0.235;
      let y = 1.95;
      rect(M, y, tw, rh, C.ink);
      hdr.forEach((h, k) => text(h, k < 3 ? xs[k] + 0.06 : xs[k + 1] - 0.06, y + 0.06, { size: 8.5, bold: true, color: C.white, align: k < 3 ? undefined : 'right' }));
      y += rh;
      QS.forEach((q, i) => {
        const vals = groups.map(g => means[g][i]), minV = Math.min(...vals);
        if (i % 2) rect(M, y, tw, rh, 'FAFAFA');
        line(M, y + rh, M + tw, y + rh, C.grid, 0.006);
        [String(q.n), LENSES[q.lens].short, q.theme].forEach((t, k) => text(t, xs[k] + 0.06, y + 0.06, { size: 9, color: C.body }));
        vals.forEach((v, k) => text(f1(v), xs[k + 4] - 0.06, y + 0.06, { size: 9, bold: multi && v === minV, color: multi && v === minV ? 'B03A2E' : C.body, align: 'right' }));
        if (multi) text(f1(overall[i]), xs[xs.length - 1] - 0.06, y + 0.06, { size: 9, bold: true, align: 'right' });
        y += rh;
      });
      ['cx', 'rox', 'ex'].forEach(l => {
        rect(M, y, tw, rh, C.paper);
        text(LENSES[l].short, xs[1] + 0.06, y + 0.06, { size: 9, bold: true });
        text('Lens average', xs[2] + 0.06, y + 0.06, { size: 9, bold: true });
        groups.forEach((g, k) => text(f1(lensAvg[g][l]), xs[k + 4] - 0.06, y + 0.06, { size: 9, bold: true, align: 'right' }));
        if (multi) text(f1(overallLens[l]), xs[xs.length - 1] - 0.06, y + 0.06, { size: 9, bold: true, align: 'right' });
        y += rh;
      });
      const rx = 9.85, rw = 2.9;
      let ty = 1.95;
      text('How the numbers work', rx, ty, { size: 12, bold: true }); ty += 0.32;
      ty += text('CX uses Q1, Q4, Q7, Q10 and Q13. RoX uses Q2, Q5, Q8, Q11 and Q14. EX uses Q3, Q6, Q9, Q12 and Q15.', rx, ty, { size: 10, color: C.body, w: rw, lh: 1.4 }) + 0.15;
      ty += text('A lens average is the mean of its five questions, out of 6, rounded to one decimal. Overall is the mean of the groups. Nothing is reverse-scored.', rx, ty, { size: 10, color: C.body, w: rw, lh: 1.4 }) + 0.15;
      if (multi) ty += text('The lowest group score on each question is shown in red.', rx, ty, { size: 10, color: C.body, w: rw, lh: 1.4 }) + 0.15;
      text(`Responses: ${['C', 'B', 'T', 'S'].map(g => `${GROUP[g].name} ${ctx.counts[g] || 0}`).join(', ')}.`, rx, ty, { size: 10, color: C.body, w: rw, lh: 1.4 });
    }

    return doc;
  }

  root.buildRoxReport = buildRoxReport;
  root.roxReportFocus = function (groups, means, overall) {
    if (groups.length > 1) return QS.map((q, i) => { const v = groups.map(g => means[g][i]); return { i, s: Math.max(...v) - Math.min(...v) }; }).sort((a, b) => b.s - a.s).slice(0, 3).map(x => x.i);
    return QS.map((q, i) => ({ i, v: overall[i] })).sort((a, b) => b.v - a.v).slice(-3).reverse().map(x => x.i);
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildRoxReport, roxReportFocus: root.roxReportFocus };
})(typeof window !== 'undefined' ? window : globalThis);
