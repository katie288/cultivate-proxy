/* CX-EX Connection findings report (Strategic Advisory Service)
 * Builds an editable PowerPoint from the facilitator view's group results.
 * Browser: window.buildRoxReport(ctx) -> PptxGenJS instance (call .writeFile()).
 * ctx = { org, date, example, groups:['C','B',...], counts:{C:n,...}, means:{C:[15 numbers],...}, overall:[15 numbers] }
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
    C: { name: 'Customer-facing', color: 'FFCC00' },
    B: { name: 'Back office', color: 'A67C00' },
    T: { name: 'Team leaders', color: 'A6A6A6' },
    S: { name: 'Senior leaders', color: '1A1A1A' }
  };

  // palette (from the framework deck)
  const C = { black: '0B0B0B', panel: '1A1A1A', panel2: '262626', line: '3A3A3A', yellow: 'FFCC00', gold: 'A67C00', white: 'FFFFFF', paper: 'F3F3F3', rule: 'D9D9D9', ink: '1C1C1C', body: '404040', mute: '7F7F7F', soft: 'A6A6A6' };
  const HEAD = 'Arial Black', BODY = 'Arial';
  const W = 13.333, H = 7.5, M = 0.55;

  const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN;
  const r1 = v => Math.round(v * 10) / 10;
  const f1 = v => isFinite(v) ? r1(v).toFixed(1) : '–';
  const word = v => SCALE[Math.min(5, Math.max(0, Math.round(v) - 1))];
  const lensOf = (vals, l) => mean(LENS_QS[l].map(n => vals[n - 1]));

  function buildRoxReport(ctx, Ctor) {
    const Pptx = Ctor || root.PptxGenJS;
    const pptx = new Pptx();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Strategic Advisory Service';
    pptx.company = 'Strategic Advisory Service';
    pptx.title = `CX-EX Connection findings: ${ctx.org || 'Your organisation'}`;

    const org = ctx.org || 'Your organisation';
    const groups = ctx.groups;
    const means = ctx.means;
    const overall = ctx.overall;
    const total = groups.reduce((s, g) => s + (ctx.counts[g] || 0), 0);
    const multi = groups.length > 1;
    let page = 0;

    /* ---------- shared furniture ---------- */
    function slide(dark) {
      const s = pptx.addSlide();
      page++;
      s.background = { color: dark ? C.black : C.white };
      s._dark = dark;
      // brand mark: three squares + label
      [[C.panel2, C.line], [C.yellow, C.yellow], [dark ? C.white : C.rule, dark ? C.white : C.soft]].forEach((c, i) => {
        s.addShape(pptx.ShapeType.rect, { x: M + i * 0.17, y: 0.36, w: 0.11, h: 0.11, fill: { color: c[0] }, line: { color: c[1], width: 0.5 } });
      });
      s.addText('STRATEGIC ADVISORY SERVICE', { x: M + 0.6, y: 0.28, w: 5, h: 0.28, fontFace: BODY, fontSize: 9, bold: true, charSpacing: 2, color: dark ? C.yellow : C.gold, margin: 0 });
      if (ctx.example) {
        s.addText('Illustrative example', { x: W - M - 2.0, y: 0.26, w: 2.0, h: 0.32, fontFace: BODY, fontSize: 10, bold: true, color: C.ink, fill: { color: C.yellow }, align: 'center', margin: 0 });
      }
      if (page > 1) {
        s.addText(`${org}  ·  CX-EX Connection findings`, { x: M, y: H - 0.45, w: 8, h: 0.25, fontFace: BODY, fontSize: 9, color: dark ? C.soft : C.mute, margin: 0 });
        s.addText(String(page), { x: W - M - 1, y: H - 0.45, w: 1, h: 0.25, fontFace: BODY, fontSize: 9, color: dark ? C.soft : C.mute, align: 'right', margin: 0 });
      }
      return s;
    }
    function title(s, t, sub) {
      s.addText(t, { x: M, y: 0.7, w: W - 2 * M, h: 0.75, fontFace: BODY, fontSize: 28, color: s._dark ? C.white : C.ink, margin: 0, valign: 'top', fit: 'shrink' });
      if (sub) s.addText(sub, { x: M, y: 1.42, w: W - 2 * M, h: 0.45, fontFace: BODY, fontSize: 14, color: s._dark ? 'BFBFBF' : '595959', margin: 0, valign: 'top' });
    }
    function placeholder(s, x, y, w, h, label, prompt) {
      s.addText([
        { text: label, options: { bold: true, color: C.ink, fontSize: 12, breakLine: true } },
        { text: prompt, options: { italic: true, color: C.mute, fontSize: 11 } }
      ], { x, y, w, h, fontFace: BODY, valign: 'top', margin: 8, paraSpaceAfter: 4, fill: { color: C.paper }, line: { color: C.soft, width: 0.75, dashType: 'dash' } });
    }
    function legend(s, x, y, withOverall) {
      let cx = x;
      groups.forEach(g => {
        s.addShape(pptx.ShapeType.rect, { x: cx, y: y + 0.09, w: 0.3, h: 0.08, fill: { color: GROUP[g].color }, line: { color: GROUP[g].color } });
        s.addText(`${GROUP[g].name} (${ctx.counts[g] || 0})`, { x: cx + 0.38, y, w: 2.1, h: 0.26, fontFace: BODY, fontSize: 10, color: C.body, margin: 0 });
        cx += 2.35;
      });
      if (withOverall) {
        s.addShape(pptx.ShapeType.rect, { x: cx, y: y + 0.09, w: 0.3, h: 0.08, fill: { color: 'D0D0D0' }, line: { color: 'D0D0D0' } });
        s.addText('Overall', { x: cx + 0.38, y, w: 1.2, h: 0.26, fontFace: BODY, fontSize: 10, color: C.body, margin: 0 });
      }
    }

    /* ---------- findings maths ---------- */
    const lensAvg = {};
    groups.forEach(g => { lensAvg[g] = { cx: lensOf(means[g], 'cx'), rox: lensOf(means[g], 'rox'), ex: lensOf(means[g], 'ex') }; });
    const overallLens = { cx: lensOf(overall, 'cx'), rox: lensOf(overall, 'rox'), ex: lensOf(overall, 'ex') };
    const weakest = g => ['cx', 'rox', 'ex'].sort((a, b) => lensAvg[g][a] - lensAvg[g][b])[0];
    const allSameWeak = groups.every(g => weakest(g) === weakest(groups[0]));
    const groupAll = g => mean(means[g]);
    const byGroupAll = groups.slice().sort((a, b) => groupAll(b) - groupAll(a));
    const spreads = QS.map((q, i) => {
      const v = groups.map(g => means[g][i]);
      const hiV = Math.max(...v), loV = Math.min(...v);
      return { q, i, spread: hiV - loV, hiG: groups[v.indexOf(hiV)], loG: groups[v.indexOf(loV)], hiV, loV };
    }).sort((a, b) => b.spread - a.spread);
    const ranked = QS.map((q, i) => ({ q, v: overall[i] })).sort((a, b) => b.v - a.v);

    let headline;
    if (!multi) headline = `${LENSES[weakest(groups[0])].name} is the weakest of the three lenses`;
    else if (allSameWeak) headline = `${LENSES[weakest(groups[0])].name} is the weakest lens for every group`;
    else headline = `${GROUP[byGroupAll[0]].name} see the strongest connection, ${GROUP[byGroupAll[byGroupAll.length - 1]].name.toLowerCase()} the weakest`;

    /* ---------- 1. cover ---------- */
    {
      const s = slide(true);
      s.addText('FINDINGS REPORT', { x: M, y: 1.7, w: 6, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, charSpacing: 3, color: C.yellow, margin: 0 });
      s.addText('CX-EX Connection', { x: M, y: 2.1, w: 11, h: 1.0, fontFace: HEAD, fontSize: 48, color: C.white, margin: 0 });
      s.addText('Return on Experience', { x: M, y: 3.1, w: 11, h: 0.6, fontFace: BODY, fontSize: 26, color: C.yellow, margin: 0 });
      s.addText(org, { x: M, y: 4.2, w: 11, h: 0.6, fontFace: BODY, fontSize: 24, bold: true, color: C.white, margin: 0 });
      s.addText(`${total} response${total === 1 ? '' : 's'} across ${groups.length} group${groups.length === 1 ? '' : 's'}  ·  ${ctx.date}`, { x: M, y: 4.85, w: 11, h: 0.4, fontFace: BODY, fontSize: 14, color: 'BFBFBF', margin: 0 });
      s.addText('Prepared by the Strategic Advisory Service: Awards International, Cultivate Customer Experience by Design and Nathan Dring & Associates.', { x: M, y: 6.55, w: 10, h: 0.4, fontFace: BODY, fontSize: 10, color: C.soft, margin: 0 });
    }

    /* ---------- 2. why it matters ---------- */
    {
      const s = slide(true);
      title(s, 'CX and EX pay back when they connect');
      s.addText('Most organisations run customer experience and employee experience as separate agendas, with separate owners and budgets. Customers feel the join. The return on experience comes from connecting the two, so that how people feel about their work shows up in what customers receive.', { x: M, y: 1.55, w: 11.6, h: 0.9, fontFace: BODY, fontSize: 14, color: 'D9D9D9', margin: 0, valign: 'top' });
      const boxes = [
        ['CX connection', 'Doing the right thing for customers', 'People know the customer standard and deliver it. Necessary, but without engaged people it tends to hold only while someone is checking.', C.panel, C.yellow, 'D9D9D9'],
        ['Return on Experience', 'Driving the outcomes that matter', 'Customer and employee experience reinforce each other, and leaders can see what that connection returns in results.', C.yellow, C.ink, C.ink],
        ['EX connection', 'Doing what they love', 'People care about the work and bring themselves to it. Energy is high, but it does not reach customers by itself.', C.white, C.ink, C.body]
      ];
      boxes.forEach((b, i) => {
        const x = M + i * 4.15;
        s.addShape(pptx.ShapeType.rect, { x, y: 2.85, w: 3.9, h: 3.1, fill: { color: b[3] }, line: { color: i === 0 ? C.line : b[3] } });
        s.addText(b[0], { x: x + 0.25, y: 3.05, w: 3.4, h: 0.4, fontFace: BODY, fontSize: 16, bold: true, color: b[4], margin: 0 });
        s.addText(b[1], { x: x + 0.25, y: 3.5, w: 3.4, h: 0.4, fontFace: BODY, fontSize: 13, color: i === 0 ? C.yellow : C.ink, margin: 0 });
        s.addText(b[2], { x: x + 0.25, y: 4.05, w: 3.4, h: 1.7, fontFace: BODY, fontSize: 12, color: b[5], margin: 0, valign: 'top' });
      });
    }

    /* ---------- 3. framework ---------- */
    {
      const s = slide(true);
      title(s, 'The framework: five lines of enquiry, three lenses');
      const x0 = M, colW = 3.38, rowH = 0.72, y0 = 1.65, lab = 2.0;
      const heads = [['CX connection', LENSES.cx.what, C.panel, C.white, C.line], ['Return on Experience', LENSES.rox.what, C.yellow, C.ink, C.yellow], ['EX connection', LENSES.ex.what, C.white, C.ink, C.white]];
      heads.forEach((h, j) => {
        const x = x0 + lab + 0.2 + j * (colW + 0.12);
        s.addText([{ text: h[0], options: { bold: true, fontSize: 12, breakLine: true, align: 'center' } }, { text: h[1], options: { fontSize: 9, align: 'center' } }], { x, y: y0, w: colW, h: 0.62, fontFace: BODY, color: h[3], fill: { color: h[2] }, line: { color: h[4] }, align: 'center', valign: 'middle', margin: 3 });
      });
      LINES.forEach((l, i) => {
        const y = y0 + 0.75 + i * (rowH + 0.08);
        s.addText(l[0], { x: x0, y, w: lab, h: rowH, fontFace: BODY, fontSize: 11, bold: true, color: 'BFBFBF', valign: 'middle', margin: 0 });
        l[1].forEach((q, j) => {
          const x = x0 + lab + 0.2 + j * (colW + 0.12);
          const h = heads[j];
          s.addText([{ text: `Q${q[0]}  `, options: { fontSize: 9, color: j === 0 ? C.yellow : C.ink } }, { text: q[2], options: { fontSize: 12, color: j === 0 ? C.yellow : C.ink } }], { x, y, w: colW, h: rowH, fontFace: BODY, fill: { color: h[2] }, line: { color: h[4] }, align: 'center', valign: 'middle', margin: 0 });
        });
      });
      s.addText('Each column is one lens, with five questions. Every question uses the same six-point scale, where 6 always means a stronger connection.', { x: M, y: 6.55, w: 12, h: 0.3, fontFace: BODY, fontSize: 10, color: C.soft, margin: 0 });
    }

    /* ---------- 4. who took part ---------- */
    {
      const s = slide(true);
      title(s, 'Who took part', `${total} people from ${org} answered fifteen questions about what normally happens there today.`);
      const tiles = ['C', 'B', 'T', 'S'];
      tiles.forEach((g, i) => {
        const x = M + i * 3.1, n = ctx.counts[g] || 0;
        s.addShape(pptx.ShapeType.rect, { x, y: 2.2, w: 2.9, h: 1.6, fill: { color: C.panel }, line: { color: C.line } });
        s.addShape(pptx.ShapeType.rect, { x, y: 2.2, w: 2.9, h: 0.08, fill: { color: g === 'S' ? C.white : GROUP[g].color }, line: { color: g === 'S' ? C.white : GROUP[g].color } });
        s.addText(String(n), { x: x + 0.25, y: 2.45, w: 2.4, h: 0.75, fontFace: HEAD, fontSize: 36, color: n ? C.white : C.line, margin: 0 });
        s.addText(GROUP[g].name, { x: x + 0.25, y: 3.2, w: 2.4, h: 0.4, fontFace: BODY, fontSize: 13, color: 'D9D9D9', margin: 0 });
      });
      s.addText('HOW TO READ THE SCORES', { x: M, y: 4.25, w: 6, h: 0.3, fontFace: BODY, fontSize: 10, bold: true, charSpacing: 2, color: C.yellow, margin: 0 });
      SCALE.forEach((lbl, i) => {
        const x = M + i * 2.06, last = i === 5;
        s.addText([{ text: String(i + 1), options: { fontFace: HEAD, fontSize: 22, breakLine: true, align: 'center' } }, { text: lbl, options: { fontSize: 11, bold: true, align: 'center' } }], { x, y: 4.65, w: 1.92, h: 1.05, fontFace: BODY, color: last ? C.ink : C.white, fill: { color: last ? C.yellow : C.panel2 }, align: 'center', valign: 'middle', margin: 3 });
      });
      const small = groups.filter(g => (ctx.counts[g] || 0) > 0 && ctx.counts[g] < 3);
      s.addText(`Scores are group averages on this scale. No question is reversed. Overall figures are the mean of the groups, so a large group does not drown out a small one.${small.length ? ` ${small.map(g => GROUP[g].name).join(' and ')} had fewer than three responses, so read ${small.length === 1 ? 'that group' : 'those groups'} with care.` : ''}`, { x: M, y: 5.95, w: 12.2, h: 0.6, fontFace: BODY, fontSize: 11, color: 'BFBFBF', margin: 0, valign: 'top' });
    }

    /* ---------- 5. headline: radar by lens ---------- */
    {
      const s = slide(false);
      title(s, headline, multi ? 'Average score for each question, by group. Bigger shapes mean a stronger connection.' : 'Average score for each question. Bigger shapes mean a stronger connection.');
      ['cx', 'rox', 'ex'].forEach((l, j) => {
        const x = M + j * 4.15;
        s.addText(LENSES[l].name, { x, y: 2.0, w: 3.9, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: C.ink, align: 'center', margin: 0 });
        const runs = [];
        groups.forEach((g, k) => {
          if (k) runs.push({ text: '  ·  ', options: { color: C.soft } });
          runs.push({ text: f1(lensAvg[g][l]), options: { color: g === 'C' ? C.gold : GROUP[g].color, bold: true } });
        });
        s.addText(runs, { x, y: 2.3, w: 3.9, h: 0.28, fontFace: BODY, fontSize: 12, align: 'center', margin: 0 });
        const data = groups.map(g => ({ name: GROUP[g].name, labels: LENS_QS[l].map(n => QS[n - 1].theme), values: LENS_QS[l].map(n => r1(means[g][n - 1])) }));
        s.addChart(pptx.ChartType.radar, data, {
          x, y: 2.55, w: 3.9, h: 3.35, radarStyle: 'standard', chartColors: groups.map(g => GROUP[g].color), lineSize: 2,
          lineDataSymbol: 'none', showLegend: false, valAxisMinVal: 0, valAxisMaxVal: 6, valAxisMajorUnit: 1, valAxisLabelFontSize: 7, valAxisLabelColor: C.soft,
          catAxisLabelFontSize: 9, catAxisLabelColor: '595959', catAxisLabelFontFace: BODY, valGridLine: { color: C.rule, size: 0.5 }
        });
      });
      legend(s, M, 6.05, false);
      const facts = [];
      groups.forEach(g => facts.push(`${GROUP[g].name}: ${LENSES[weakest(g)].name} ${f1(lensAvg[g][weakest(g)])} is the lowest lens.`));
      s.addText(facts.join('   '), { x: M, y: 6.4, w: 12.2, h: 0.5, fontFace: BODY, fontSize: 10, color: '595959', margin: 0, valign: 'top' });
    }

    /* ---------- 6. lens averages: overall vs groups ---------- */
    {
      const s = slide(false);
      const lo = ['cx', 'rox', 'ex'].sort((a, b) => overallLens[a] - overallLens[b])[0];
      title(s, multi ? 'An overall average would hide the real story' : 'Lens averages', multi ? 'The combined score shows the level. The group scores show where the connection breaks.' : 'The average of the five questions in each lens.');
      const data = groups.map(g => ({ name: GROUP[g].name, labels: ['CX connection', 'Return on Experience', 'EX connection'], values: ['cx', 'rox', 'ex'].map(l => r1(lensAvg[g][l])) }));
      if (multi) data.push({ name: 'Overall', labels: ['CX connection', 'Return on Experience', 'EX connection'], values: ['cx', 'rox', 'ex'].map(l => r1(overallLens[l])) });
      s.addChart(pptx.ChartType.bar, data, {
        x: M, y: 2.05, w: 7.6, h: 4.5, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 60,
        chartColors: groups.map(g => GROUP[g].color).concat(multi ? ['D0D0D0'] : []),
        valAxisMinVal: 0, valAxisMaxVal: 6, valAxisMajorUnit: 1, valAxisLabelFontSize: 9, valAxisLabelColor: C.mute,
        catAxisLabelFontSize: 11, catAxisLabelColor: C.body, valGridLine: { color: 'EEEEEE', size: 0.5 },
        showValue: true, dataLabelFormatCode: '0.0', dataLabelFontSize: 9, dataLabelColor: C.body, dataLabelPosition: 'outEnd',
        showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: C.body
      });
      const lines = [];
      lines.push({ text: 'What the numbers say\n', options: { bold: true, fontSize: 14, color: C.ink } });
      lines.push({ text: `Overall, the three lenses average ${f1(overallLens.cx)}, ${f1(overallLens.rox)} and ${f1(overallLens.ex)}: CX connection reads as "${word(overallLens.cx).toLowerCase()}", Return on Experience as "${word(overallLens.rox).toLowerCase()}" and EX connection as "${word(overallLens.ex).toLowerCase()}". ${LENSES[lo].name} is the lowest.\n\n`, options: { fontSize: 12, color: C.body } });
      if (multi) {
        const hiG = byGroupAll[0], loG = byGroupAll[byGroupAll.length - 1];
        const rng = g => { const v = ['cx', 'rox', 'ex'].map(l => lensAvg[g][l]); return `${f1(Math.min(...v))} to ${f1(Math.max(...v))}`; };
        lines.push({ text: `Split by group, ${GROUP[loG].name.toLowerCase()} sit between ${rng(loG)} while ${GROUP[hiG].name.toLowerCase()} sit between ${rng(hiG)}.`, options: { fontSize: 12, color: C.body } });
      }
      s.addText(lines, { x: 8.55, y: 2.1, w: 4.25, h: 2.6, fontFace: BODY, margin: 0, valign: 'top' });
      placeholder(s, 8.55, 4.85, 4.25, 1.65, 'Your challenge', 'Whose experience of the organisation shapes your CX plans?');
    }

    /* ---------- 7-9. widest gaps (or lowest questions) ---------- */
    const focus = multi ? spreads.slice(0, 3) : ranked.slice(-3).reverse().map(r => ({ q: r.q, i: r.q.n - 1 }));
    focus.forEach((f, k) => {
      const s = slide(false);
      const q = f.q;
      if (multi) title(s, `${q.theme}: ${k === 0 ? 'the widest gap' : k === 1 ? 'the second widest gap' : 'the third widest gap'} between groups`, `${GROUP[f.hiG].name} score ${f1(f.hiV)}, ${GROUP[f.loG].name.toLowerCase()} score ${f1(f.loV)}: a gap of ${f1(f.spread)} on the six-point scale.`);
      else title(s, `${q.theme}: ${k === 0 ? 'the lowest score' : k === 1 ? 'the second lowest score' : 'the third lowest score'}`, `An average of ${f1(overall[f.i])}, which reads as "${word(overall[f.i]).toLowerCase()}".`);
      const lensCol = q.lens === 'cx' ? C.panel : q.lens === 'rox' ? C.yellow : C.white;
      s.addText(`Q${q.n}  ${LENSES[q.lens].name}`, { x: M, y: 2.1, w: 3.2, h: 0.36, fontFace: BODY, fontSize: 11, bold: true, color: q.lens === 'cx' ? C.yellow : C.ink, fill: { color: lensCol }, line: { color: q.lens === 'ex' ? C.rule : lensCol }, align: 'center', margin: 0 });
      s.addText(q.text, { x: M, y: 2.6, w: 5.7, h: 1.0, fontFace: BODY, fontSize: 17, color: C.ink, margin: 0, valign: 'top' });
      placeholder(s, M, 3.75, 5.7, 1.3, 'What this may mean', `Add the Strategic Advisory Service's interpretation for ${org} before sending.`);
      placeholder(s, M, 5.2, 5.7, 1.3, 'Your challenge', 'Add one question for the leadership team to discuss.');
      const data = groups.map(g => ({ name: GROUP[g].name, labels: [`Q${q.n} ${q.theme}`], values: [r1(means[g][f.i])] }));
      s.addChart(pptx.ChartType.bar, data, {
        x: 6.75, y: 2.05, w: 6.0, h: 4.45, barDir: 'col', barGrouping: 'clustered', barGapWidthPct: 40,
        chartColors: groups.map(g => GROUP[g].color), valAxisMinVal: 0, valAxisMaxVal: 6, valAxisMajorUnit: 1,
        valAxisLabelFontSize: 9, valAxisLabelColor: C.mute, catAxisLabelFontSize: 11, catAxisLabelColor: C.body, valGridLine: { color: 'EEEEEE', size: 0.5 },
        showValue: true, dataLabelFormatCode: '0.0', dataLabelFontSize: 11, dataLabelColor: C.ink, dataLabelPosition: 'outEnd',
        showLegend: true, legendPos: 'b', legendFontSize: 10, legendColor: C.body
      });
    });

    /* ---------- 10. strongest and weakest questions ---------- */
    {
      const s = slide(false);
      title(s, 'Where the connection is strongest, and where it is weakest', multi ? 'The three highest and three lowest questions, averaged across groups.' : 'The three highest and three lowest questions.');
      const col = (items, x, head, accent) => {
        s.addText(head, { x, y: 2.05, w: 5.9, h: 0.35, fontFace: BODY, fontSize: 13, bold: true, color: C.ink, margin: 0 });
        items.forEach((it, k) => {
          const y = 2.55 + k * 1.3;
          s.addShape(pptx.ShapeType.rect, { x, y, w: 5.9, h: 1.15, fill: { color: C.paper }, line: { color: C.paper } });
          s.addText([{ text: `Q${it.q.n} ${it.q.theme}`, options: { bold: true, fontSize: 13, color: C.ink } }, { text: `   ${LENSES[it.q.lens].name}`, options: { fontSize: 10, color: C.mute } }], { x: x + 0.2, y: y + 0.12, w: 4.5, h: 0.3, fontFace: BODY, margin: 0 });
          s.addText(f1(it.v), { x: x + 4.8, y: y + 0.08, w: 0.9, h: 0.45, fontFace: HEAD, fontSize: 20, color: C.ink, align: 'right', margin: 0 });
          s.addShape(pptx.ShapeType.rect, { x: x + 0.2, y: y + 0.62, w: 5.5, h: 0.12, fill: { color: C.rule }, line: { color: C.rule } });
          s.addShape(pptx.ShapeType.rect, { x: x + 0.2, y: y + 0.62, w: Math.max(0.05, 5.5 * it.v / 6), h: 0.12, fill: { color: accent }, line: { color: accent } });
          s.addText(word(it.v), { x: x + 0.2, y: y + 0.8, w: 5.5, h: 0.25, fontFace: BODY, fontSize: 10, color: C.mute, margin: 0 });
        });
      };
      col(ranked.slice(0, 3), M, 'Strongest', C.yellow);
      col(ranked.slice(-3).reverse(), M + 6.35, 'Weakest', C.gold);
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
        const x = M + (i % 2) * 6.2, y = 2.1 + Math.floor(i / 2) * 2.2, dark = p[2];
        s.addShape(pptx.ShapeType.rect, { x, y, w: 6.0, h: 2.0, fill: { color: dark ? C.black : C.paper }, line: { color: dark ? C.black : C.paper } });
        s.addText(String(i + 1), { x: x + 0.25, y: y + 0.25, w: 0.42, h: 0.42, fontFace: BODY, fontSize: 14, bold: true, color: C.ink, fill: { color: C.yellow }, align: 'center', valign: 'middle', margin: 0 });
        s.addText(p[0], { x: x + 0.85, y: y + 0.25, w: 4.9, h: 0.42, fontFace: BODY, fontSize: 14, bold: true, color: dark ? C.yellow : C.ink, valign: 'middle', margin: 0 });
        s.addText(p[1], { x: x + 0.25, y: y + 0.85, w: 5.5, h: 1.0, fontFace: BODY, fontSize: 12, color: dark ? 'D9D9D9' : C.body, margin: 0, valign: 'top' });
      });
    }

    /* ---------- 12. next conversation ---------- */
    {
      const s = slide(true);
      title(s, 'A useful next conversation');
      s.addText('Bring one recent customer moment, whether it went well or not.', { x: M, y: 1.5, w: 12, h: 0.5, fontFace: BODY, fontSize: 20, color: C.yellow, margin: 0 });
      s.addText('In the debrief, we will explore:', { x: M, y: 2.4, w: 12, h: 0.35, fontFace: BODY, fontSize: 13, color: 'D9D9D9', margin: 0 });
      const b = [['What helped', 'Where the people behind the moment knew what mattered and were free to act.', C.panel, C.white], ['What got in the way', 'Where hand-offs, measures, budgets or trust pulled the experience apart.', C.yellow, C.ink], ['What changes next time', 'The one or two connections that would make the next customer moment land.', C.white, C.ink]];
      b.forEach((x, i) => {
        const bx = M + i * 4.15;
        s.addShape(pptx.ShapeType.rect, { x: bx, y: 2.9, w: 3.9, h: 2.3, fill: { color: x[2] }, line: { color: i === 0 ? C.line : x[2] } });
        s.addText(String(i + 1), { x: bx + 0.25, y: 3.05, w: 1, h: 0.5, fontFace: BODY, fontSize: 22, color: x[3], margin: 0 });
        s.addText(x[0], { x: bx + 0.25, y: 3.6, w: 3.4, h: 0.4, fontFace: BODY, fontSize: 15, bold: true, color: x[3], margin: 0 });
        s.addText(x[1], { x: bx + 0.25, y: 4.05, w: 3.4, h: 1.0, fontFace: BODY, fontSize: 12, color: i === 0 ? 'D9D9D9' : C.body, margin: 0, valign: 'top' });
      });
      s.addText('Start with a real example and agree one practical change before the next review.', { x: M, y: 5.6, w: 12, h: 0.4, fontFace: BODY, fontSize: 14, bold: true, color: C.white, margin: 0 });
    }

    /* ---------- 13. appendix ---------- */
    {
      const s = slide(false);
      title(s, 'Appendix: scores by question', 'Group averages on the six-point scale.');
      const hdr = ['Q', 'Lens', 'Theme'].concat(groups.map(g => GROUP[g].name)).concat(multi ? ['Overall'] : []);
      const hcell = t => ({ text: t, options: { bold: true, color: C.white, fill: { color: C.ink }, fontSize: 9 } });
      const rows = [hdr.map(hcell)];
      QS.forEach((q, i) => {
        const vals = groups.map(g => means[g][i]);
        const minV = Math.min(...vals);
        rows.push([String(q.n), LENSES[q.lens].short, q.theme].map(t => ({ text: t, options: { fontSize: 9, color: C.body } }))
          .concat(vals.map(v => ({ text: f1(v), options: { fontSize: 9, align: 'right', color: multi && v === minV ? 'B03A2E' : C.body, bold: multi && v === minV } })))
          .concat(multi ? [{ text: f1(overall[i]), options: { fontSize: 9, align: 'right', bold: true, color: C.ink } }] : []));
      });
      ['cx', 'rox', 'ex'].forEach(l => {
        rows.push([{ text: '', options: { fill: { color: C.paper } } }, { text: LENSES[l].short, options: { bold: true, fontSize: 9, fill: { color: C.paper } } }, { text: 'Lens average', options: { bold: true, fontSize: 9, fill: { color: C.paper } } }]
          .concat(groups.map(g => ({ text: f1(lensAvg[g][l]), options: { bold: true, fontSize: 9, align: 'right', fill: { color: C.paper } } })))
          .concat(multi ? [{ text: f1(overallLens[l]), options: { bold: true, fontSize: 9, align: 'right', fill: { color: C.paper } } }] : []));
      });
      const fixed = [0.4, 0.6, 1.8];
      const rest = (8.9 - 2.8) / (hdr.length - 3);
      s.addTable(rows, { x: M, y: 1.95, w: 8.9, colW: fixed.concat(Array(hdr.length - 3).fill(rest)), rowH: 0.24, fontFace: BODY, border: { type: 'solid', color: 'E6E6E6', pt: 0.5 }, margin: [0.02, 0.06, 0.02, 0.06] });
      s.addText([
        { text: 'How the numbers work\n', options: { bold: true, fontSize: 12, color: C.ink } },
        { text: 'CX uses Q1, Q4, Q7, Q10 and Q13. RoX uses Q2, Q5, Q8, Q11 and Q14. EX uses Q3, Q6, Q9, Q12 and Q15.\n\nA lens average is the mean of its five questions, out of 6, rounded to one decimal. Overall is the mean of the groups. Nothing is reverse-scored.' + (multi ? '\n\nThe lowest group score on each question is shown in red.' : '') + `\n\nResponses: ${groups.map(g => `${GROUP[g].name} ${ctx.counts[g] || 0}`).join(', ')}.`, options: { fontSize: 10, color: C.body } }
      ], { x: 9.75, y: 1.95, w: 3.05, h: 4.6, fontFace: BODY, margin: 0, valign: 'top' });
    }

    return pptx;
  }

  root.buildRoxReport = buildRoxReport;
  if (typeof module !== 'undefined' && module.exports) module.exports = buildRoxReport;
})(typeof window !== 'undefined' ? window : globalThis);
