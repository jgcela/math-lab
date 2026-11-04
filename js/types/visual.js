/* Picture-first mission types for the early grades: every exercise is an illustrated scene the child
 * acts on (drag, tap, turn, program), with as little reading as possible. All artwork is original SVG.
 *   pattern        Pattern Train        K.V.2
 *   shapes         Shape Hunt           K.III.1
 *   numberHop      Hop to the Number    K.I.A.6
 *   compareGroups  Which Has More?      K.I.A.10
 *   clock          What Time Is It?     K.II.B.4
 *   robot          Robot Path           K.III.2
 */
(function (CM) {
  'use strict';
  const { plural, esc } = CM.h, T = CM.TYPES;
  const ART = CM.art = CM.art || {};

  /* ---------- shared artwork ---------- */
  const OUT = 'stroke="var(--ink)" stroke-opacity=".22" stroke-width="1.5"';
  ART.apple = '<path d="M20 12c-4-3-14-3-14 9 0 9 7 15 10 15 2 0 3-1 4-1s2 1 4 1c3 0 10-6 10-15 0-12-10-12-14-9z" fill="var(--t1)"/><path d="M20 12c0-4 2-7 5-8" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 9c3-3 7-3 9-1-3 3-6 3-9 1z" fill="var(--t3)"/>';
  ART.flower = '<path d="M20 36V22" stroke="var(--t3)" stroke-width="3" stroke-linecap="round"/><g fill="var(--t6)"><circle cx="20" cy="9" r="5.5"/><circle cx="28" cy="15" r="5.5"/><circle cx="25" cy="24" r="5.5"/><circle cx="15" cy="24" r="5.5"/><circle cx="12" cy="15" r="5.5"/></g><circle cx="20" cy="17" r="4.5" fill="var(--t2)"/>';
  ART.star = '<path d="M20 4l4.7 10.6 11.5 1.1-8.7 7.7 2.6 11.3L20 28.8 9.9 34.7l2.6-11.3-8.7-7.7 11.5-1.1z" fill="var(--t2)" ' + OUT + ' stroke-linejoin="round"/>';
  ART.fish = '<path d="M6 20c6-9 17-10 24 0-7 10-18 9-24 0z" fill="var(--t4)"/><path d="M29 20l8-7v14z" fill="var(--t4)"/><circle cx="13" cy="18" r="2" fill="var(--ink)"/>';
  ART.robot = '<line x1="20" y1="4" x2="20" y2="10" stroke="var(--ink)" stroke-width="2"/><circle cx="20" cy="4" r="2.5" fill="var(--t1)"/><rect x="7" y="10" width="26" height="20" rx="6" fill="var(--t4)"/><rect x="11" y="14" width="18" height="9" rx="4" fill="var(--surface)"/><circle cx="16" cy="18.5" r="2.2" fill="var(--ink)"/><circle cx="24" cy="18.5" r="2.2" fill="var(--ink)"/><rect x="11" y="30" width="5" height="6" rx="2" fill="var(--ink)"/><rect x="24" y="30" width="5" height="6" rx="2" fill="var(--ink)"/>';
  ART.rock = '<path d="M6 30c-2-7 3-14 9-16 3-6 12-7 16-1 6 2 7 10 4 17z" fill="var(--rock)" ' + OUT + '/><path d="M15 18c3-1 6 0 8 2" stroke="var(--surface)" stroke-opacity=".5" stroke-width="2" fill="none" stroke-linecap="round"/>';
  ART.rabbit = '<ellipse cx="22" cy="31" rx="11" ry="8" fill="var(--bunny)" ' + OUT + '/><circle cx="31" cy="23" r="6.5" fill="var(--bunny)" ' + OUT + '/><ellipse cx="29" cy="11" rx="2.6" ry="8" fill="var(--bunny)" ' + OUT + ' transform="rotate(-12 29 11)"/><ellipse cx="34" cy="11" rx="2.6" ry="8" fill="var(--bunny)" ' + OUT + ' transform="rotate(10 34 11)"/><circle cx="33.5" cy="22" r="1.4" fill="var(--ink)"/><circle cx="11" cy="29" r="3" fill="var(--surface)" ' + OUT + '/>';
  const svg = (inner, vb, cls, extra) => `<svg viewBox="${vb || '0 0 40 40'}"${cls ? ` class="${cls}"` : ''} aria-hidden="true"${extra || ''}>${inner}</svg>`;

  /* ======================================================================
   * Pattern Train (K.V.2)
   * ====================================================================== */
  const PIECES = {
    rc: { name: 'red circle', art: `<circle cx="20" cy="20" r="14" fill="var(--t1)" ${OUT}/>` },
    bt: { name: 'blue triangle', art: `<polygon points="20,5 35,33 5,33" fill="var(--t4)" ${OUT} stroke-linejoin="round"/>` },
    os: { name: 'orange square', art: `<rect x="7" y="7" width="26" height="26" rx="2" fill="var(--t2)" ${OUT}/>` },
    gs: { name: 'green star', art: `<path d="M20 4l4.7 10.6 11.5 1.1-8.7 7.7 2.6 11.3L20 28.8 9.9 34.7l2.6-11.3-8.7-7.7 11.5-1.1z" fill="var(--t3)" ${OUT} stroke-linejoin="round"/>` },
    ph: { name: 'pink heart', art: `<path d="M20 34C6 24 4 16 8 11c4-5 10-4 12 1 2-5 8-6 12-1 4 5 2 13-12 23z" fill="var(--t6)" ${OUT}/>` },
    pd: { name: 'purple diamond', art: `<polygon points="20,4 34,20 20,36 6,20" fill="var(--t5)" ${OUT} stroke-linejoin="round"/>` }
  };
  CM.PIECES = PIECES;
  const seqOf = it => Array.from({ length: it.shown + it.blanks }, (_, i) => it.unit[i % it.unit.length]);
  const LOCO = '<rect x="6" y="20" width="44" height="24" rx="4" fill="var(--t1)"/><rect x="30" y="8" width="20" height="16" rx="3" fill="var(--t1)"/><rect x="34" y="12" width="12" height="8" rx="2" fill="var(--surface)"/><rect x="10" y="10" width="8" height="12" fill="var(--ink)"/><circle cx="16" cy="48" r="6" fill="var(--ink)"/><circle cx="40" cy="48" r="6" fill="var(--ink)"/><circle cx="16" cy="48" r="2" fill="var(--surface)"/><circle cx="40" cy="48" r="2" fill="var(--surface)"/>';

  T.pattern = {
    init(r) { r.fill = {}; r.sel = null; },
    text(r) { return 'Pattern ' + r.item.unit.map(k => PIECES[k].name).join(', '); },
    palette(r) {
      const it = r.item, set = [...new Set(it.unit)];
      (it.extra || []).forEach(k => { if (!set.includes(k)) set.push(k); });
      return set.sort();
    },
    view(r) {
      const it = r.item, seq = seqOf(it), U = it.unit.length, marks = r.hint >= 2 || r.solved;
      const cars = seq.map((k, i) => {
        const cls = `car${marks && i % U === 0 ? ' u-start' : ''}`;
        if (i < it.shown) return `<div class="${cls}">${svg(PIECES[k].art)}</div>`;
        const j = i - it.shown, f = r.fill[j];
        return `<button type="button" class="${cls} slot${f ? ' filled' : ''}" data-act="place" data-slot="${j}" data-drop="${j}" aria-label="Empty car ${j + 1}${f ? ', has ' + PIECES[f].name : ''}"${r.solved ? ' disabled' : ''}>${f ? svg(PIECES[f].art) : '<span class="q" aria-hidden="true">?</span>'}</button>`;
      }).join('');
      const pal = this.palette(r).map(k => `<button type="button" class="piece${r.sel === k ? ' picked' : ''}" data-act="pick" data-v="${k}" data-drag="${k}" aria-pressed="${r.sel === k}" aria-label="${PIECES[k].name}"${r.solved ? ' disabled' : ''}>${svg(PIECES[k].art)}</button>`).join('');
      return `<p class="prompt">What comes next on the train?</p>
        <p class="sub">Drag a shape into each empty car, or tap a shape and then a car.</p>
        <div class="train" role="group" aria-label="Pattern train"><div class="loco">${svg(LOCO, '0 0 56 56')}</div>${cars}</div>
        <div class="tray" role="group" aria-label="Shapes">${pal}</div>`;
    },
    handle(r, act, el) {
      const d = el.dataset;
      if (act === 'pick') { r.sel = r.sel === d.v ? null : d.v; return { focus: `[data-act="pick"][data-v="${d.v}"]` }; }
      if (act === 'place') {
        const j = +d.slot;
        if (r.sel) r.fill[j] = r.sel;
        else if (r.fill[j]) delete r.fill[j];
        else return { msg: 'First tap a shape at the bottom, then tap the car.', tone: 'info' };
        return { focus: `[data-act="place"][data-slot="${j}"]` };
      }
      if (act === 'drop') { r.fill[+d.drop] = d.drag; return {}; }
    },
    check(r) {
      const it = r.item, seq = seqOf(it).slice(it.shown);
      if (seq.some((_, j) => !r.fill[j])) return { nudge: 'Fill every empty car first.' };
      if (seq.every((k, j) => r.fill[j] === k)) return { ok: true };
      const last = seqOf(it)[it.shown - 1];
      if (r.fill[0] === last && seq[0] !== last) return { err: 'copylast', tag: 'Copied the last shape instead of continuing the pattern' };
      return { err: 'pattern', tag: 'Continued a pattern incorrectly' };
    },
    hint(r, lv) {
      const it = r.item;
      if (lv >= 2) return `The dashed lines show where the pattern starts again. Each part is: ${it.unit.map(k => PIECES[k].name).join(', ')}.`;
      if (r.err === 'copylast') return 'The next car is not always the same as the last one. Say the pattern out loud from the start.';
      return `Say the pattern out loud from the start: ${seqOf(it).slice(0, Math.min(it.shown, it.unit.length + 1)).map(k => PIECES[k].name).join(', ')}\u2026 What part repeats?`;
    },
    show(r) { const it = r.item; seqOf(it).slice(it.shown).forEach((k, j) => { r.fill[j] = k; }); },
    explain(r) {
      const it = r.item;
      return `The part that repeats is <b>${it.unit.map(k => PIECES[k].name).join(', ')}</b>. It has ${plural(it.unit.length, 'shape')}. The pattern keeps repeating that part in the same order, so you can always tell what comes next.`;
    },
    thumb: svg(`<rect x="2" y="26" width="76" height="3" fill="var(--ink)" opacity=".3"/><g transform="translate(4 6) scale(.45)">${PIECES.rc.art}</g><g transform="translate(24 6) scale(.45)">${PIECES.bt.art}</g><g transform="translate(44 6) scale(.45)">${PIECES.rc.art}</g><rect x="62" y="6" width="16" height="18" rx="3" fill="none" stroke="var(--muted)" stroke-dasharray="3 2"/>`, '0 0 80 32')
  };

  /* ======================================================================
   * Shape Hunt (K.III.1)
   * Every tappable part has a kind. Rectangles are never asked for, because a square is also a rectangle.
   * ====================================================================== */
  const sq = (x, y, s, fill, rot) => `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fill}" ${OUT}${rot ? ` transform="rotate(${rot} ${x + s / 2} ${y + s / 2})"` : ''}/>`;
  const rc = (x, y, w, h, fill) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${OUT}/>`;
  const tri = (pts, fill) => `<polygon points="${pts}" fill="${fill}" ${OUT} stroke-linejoin="round"/>`;
  const ci = (cx, cy, rr, fill) => `<circle cx="${cx}" cy="${cy}" r="${rr}" fill="${fill}" ${OUT}/>`;
  const ov = (cx, cy, rx, ry, fill) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" ${OUT}/>`;
  const SKY = '<rect width="400" height="260" fill="var(--sky)"/><rect y="215" width="400" height="45" fill="var(--grass)"/>';

  const SCENES = {
    street: {
      name: 'a street',
      bg: SKY + '<line x1="150" y1="58" x2="212" y2="58" stroke="var(--ink)" stroke-width="1.5"/>',
      parts: [
        { k: 'circle', d: ci(345, 45, 24, 'var(--t2)') },
        { k: 'oval', d: ov(90, 40, 34, 15, 'var(--surface)') },
        { k: 'square', d: sq(40, 130, 100, 'var(--wall)') },
        { k: 'triangle', d: tri('30,130 150,130 90,80', 'var(--t1)') },
        { k: 'rectangle', d: rc(75, 175, 30, 55, 'var(--door)') },
        { k: 'square', d: sq(50, 145, 20, 'var(--glass)') },
        { k: 'square', d: sq(110, 145, 20, 'var(--glass)') },
        { k: 'rectangle', d: rc(185, 150, 150, 80, 'var(--wall2)') },
        { k: 'triangle', d: tri('175,150 345,150 260,105', 'var(--t5)') },
        { k: 'circle', d: ci(220, 180, 12, 'var(--glass)') },
        { k: 'square', d: sq(285, 168, 22, 'var(--glass)', 45), turned: true },
        { k: 'rectangle', d: rc(245, 185, 28, 45, 'var(--door)') },
        { k: 'triangle', d: tri('158,58 176,58 167,76', 'var(--t6)'), turned: true },
        { k: 'triangle', d: tri('186,58 204,58 195,76', 'var(--t4)'), turned: true },
        { k: 'oval', d: ov(362, 222, 28, 13, 'var(--t3)') }
      ]
    },
    church: {
      name: 'a church',
      bg: SKY + '<line x1="70" y1="10" x2="70" y2="32" stroke="var(--ink)" stroke-width="3"/><line x1="62" y1="17" x2="78" y2="17" stroke="var(--ink)" stroke-width="3"/><rect x="363" y="160" width="10" height="55" fill="var(--door)"/>',
      parts: [
        { k: 'circle', d: ci(330, 45, 20, 'var(--t2)') },
        { k: 'rectangle', d: rc(40, 90, 60, 125, 'var(--wall)') },
        { k: 'triangle', d: tri('35,90 105,90 70,32', 'var(--t4)') },
        { k: 'circle', d: ci(70, 118, 11, 'var(--t2)') },
        { k: 'square', d: sq(59, 160, 22, 'var(--glass)', 45), turned: true },
        { k: 'rectangle', d: rc(120, 140, 170, 75, 'var(--wall)') },
        { k: 'triangle', d: tri('110,140 300,140 205,92', 'var(--t1)') },
        { k: 'circle', d: ci(205, 121, 13, 'var(--t6)') },
        { k: 'rectangle', d: rc(188, 168, 34, 47, 'var(--door)') },
        { k: 'rectangle', d: rc(140, 158, 18, 32, 'var(--glass)') },
        { k: 'rectangle', d: rc(252, 158, 18, 32, 'var(--glass)') },
        { k: 'square', d: sq(312, 178, 34, 'var(--t5)') },
        { k: 'oval', d: ov(368, 140, 24, 36, 'var(--t3)') },
        { k: 'oval', d: ov(205, 232, 16, 6, 'var(--rock)') },
        { k: 'oval', d: ov(232, 246, 16, 6, 'var(--rock)') }
      ]
    },
    park: {
      name: 'a park',
      bg: SKY + '<line x1="37" y1="142" x2="37" y2="215" stroke="var(--ink)" stroke-width="3"/><polyline points="207,96 199,112 213,124 203,140" fill="none" stroke="var(--ink)" stroke-width="1.5"/><line x1="372" y1="140" x2="372" y2="215" stroke="var(--ink)" stroke-width="3"/><line x1="150" y1="160" x2="150" y2="215" stroke="var(--ink)" stroke-width="3"/><line x1="160" y1="160" x2="160" y2="215" stroke="var(--ink)" stroke-width="3"/>',
      parts: [
        { k: 'circle', d: ci(50, 45, 22, 'var(--t2)') },
        { k: 'oval', d: ov(130, 40, 30, 13, 'var(--surface)') },
        { k: 'square', d: sq(190, 54, 34, 'var(--t1)', 45), turned: true },
        { k: 'triangle', d: tri('60,215 150,215 150,160', 'var(--t4)'), turned: true },
        { k: 'circle', d: ci(85, 238, 14, 'var(--t6)') },
        { k: 'oval', d: ov(205, 238, 44, 14, 'var(--water)') },
        { k: 'rectangle', d: rc(250, 200, 100, 34, 'var(--sand)') },
        { k: 'rectangle', d: rc(178, 165, 64, 12, 'var(--door)') },
        { k: 'square', d: sq(290, 130, 46, 'var(--t5)') },
        { k: 'triangle', d: tri('374,140 374,166 398,153', 'var(--t3)'), turned: true },
        { k: 'square', d: sq(26, 120, 22, 'var(--t3)') }
      ]
    }
  };
  CM.SCENES = SCENES;
  const SHAPE_ICON = {
    circle: ci(20, 20, 14, 'var(--accent)'), oval: ov(20, 20, 16, 10, 'var(--accent)'),
    square: sq(7, 7, 26, 'var(--accent)'), triangle: tri('20,5 35,33 5,33', 'var(--accent)')
  };
  const SHAPE_PL = { circle: 'circles', oval: 'ovals', square: 'squares', triangle: 'triangles' };

  T.shapes = {
    init(r) { r.sel = new Set(); },
    text(r) { return `Find ${SHAPE_PL[r.item.target]} in ${SCENES[r.item.scene].name}`; },
    targets(r) { return SCENES[r.item.scene].parts.map((p, i) => p.k === r.item.target ? i : -1).filter(i => i > -1); },
    view(r) {
      const sc = SCENES[r.item.scene], tgt = r.item.target, hintAll = r.hint >= 2 || r.solved;
      const parts = sc.parts.map((p, i) => {
        const on = r.sel.has(i), miss = hintAll && p.k === tgt && !on;
        return `<g class="sh${on ? ' sel' : ''}${miss ? ' hintme' : ''}" data-act="shape" data-i="${i}" role="button" tabindex="0" aria-pressed="${on}" aria-label="Part ${i + 1} of the picture">${p.d}</g>`;
      }).join('');
      return `<div class="find"><p class="prompt">Find every ${tgt}.</p><span class="target-icon">${svg(SHAPE_ICON[tgt])}</span></div>
        <p class="sub">Tap each ${tgt} in the picture. Tap again to undo.</p>
        <div class="scene">${svg(sc.bg + parts, '0 0 400 260', 'scene-svg', ' role="group"').replace('aria-hidden="true"', '')}</div>
        <p class="tally" aria-live="polite">Picked: ${r.sel.size}</p>`;
    },
    handle(r, act, el) {
      if (act !== 'shape') return;
      const i = +el.dataset.i;
      r.sel.has(i) ? r.sel.delete(i) : r.sel.add(i);
      return { focus: `[data-act="shape"][data-i="${i}"]` };
    },
    check(r) {
      const sc = SCENES[r.item.scene], tgt = r.item.target, want = new Set(this.targets(r));
      if (!r.sel.size) return { nudge: `Tap the ${SHAPE_PL[tgt]} you can find.` };
      const wrong = [...r.sel].filter(i => !want.has(i)), missed = [...want].filter(i => !r.sel.has(i));
      if (!wrong.length && !missed.length) return { ok: true };
      r.missed = missed; r.wrong = wrong;
      const kinds = new Set(wrong.map(i => sc.parts[i].k));
      if (tgt === 'square' && kinds.has('rectangle')) return { err: 'rect', tag: 'Called a rectangle a square' };
      if ((tgt === 'circle' && kinds.has('oval')) || (tgt === 'oval' && kinds.has('circle'))) return { err: 'oval', tag: 'Mixed up circles and ovals' };
      if (!wrong.length && missed.length && missed.every(i => sc.parts[i].turned)) return { err: 'turned', tag: 'Did not recognize a shape that was turned' };
      if (!wrong.length) return { err: 'missed', tag: 'Missed some shapes' };
      return { err: 'wrong', tag: 'Picked shapes that do not match' };
    },
    hint(r, lv) {
      const tgt = r.item.target;
      if (lv >= 2) return `The ${SHAPE_PL[tgt]} you have not picked yet have a dashed outline.`;
      const def = { square: 'A square has 4 straight sides that are all the same length. It is still a square when it is turned.', triangle: 'A triangle has 3 straight sides and 3 corners. It can point up, down, or sideways.', circle: 'A circle is perfectly round. Every point on its edge is the same distance from the middle.', oval: 'An oval is round but stretched, longer one way than the other.' }[tgt];
      if (r.err === 'rect') return 'Some of your picks have two long sides and two short sides. Those are rectangles, not squares. ' + def;
      if (r.err === 'oval') return tgt === 'circle' ? 'One of your picks is stretched. That is an oval. ' + def : 'One of your picks is perfectly round. That is a circle. ' + def;
      if (r.err === 'turned') return `You found most of them. Look for ${SHAPE_PL[tgt]} that are turned or tipped. ` + def;
      return def;
    },
    show(r) { r.sel = new Set(this.targets(r)); },
    explain(r) {
      const tgt = r.item.target, n = this.targets(r).length, turned = this.targets(r).filter(i => SCENES[r.item.scene].parts[i].turned).length;
      const why = { square: '4 equal sides and 4 square corners', triangle: '3 straight sides and 3 corners', circle: 'one curved edge that is the same distance from the middle all the way around', oval: 'one curved edge, stretched longer one way' }[tgt];
      return `There ${n === 1 ? 'is 1 ' + tgt : 'are ' + n + ' ' + SHAPE_PL[tgt]} in this picture. Each one has ${why}.${turned ? ` ${turned === 1 ? 'One is' : turned + ' are'} turned. Turning a shape does not change what shape it is.` : ''}`;
    },
    thumb: svg(`<rect width="80" height="32" rx="4" fill="var(--sky)"/><rect y="24" width="80" height="8" fill="var(--grass)"/>${tri('8,20 30,20 19,6', 'var(--t1)')}${sq(10, 20, 18, 'var(--wall)')}${ci(66, 9, 6, 'var(--t2)')}${sq(44, 12, 12, 'var(--t5)', 45)}`, '0 0 80 32')
  };

  /* ======================================================================
   * Hop to the Number (K.I.A.6)
   * ====================================================================== */
  const hopTarget = it => it.mode === 'after' ? it.n + 1 : it.mode === 'before' ? it.n - 1 : it.mode === 'between' ? (it.a + it.b) / 2 : it.n;
  const labeled = (it, v, all) => all || it.labels === 'all' || v === 0 || v === it.max || (it.labels === 'ends' && v === it.max / 2) || (it.labels === 'fives' && v % 5 === 0) || (it.labels === 'tens' && v % 10 === 0);
  const hopAnchor = it => {
    if (it.mode === 'after' || it.mode === 'before') return it.n;
    if (it.mode === 'between') return it.a;
    const t = it.n; let best = 0;
    for (let v = 0; v <= it.max; v++) if (labeled(it, v) && Math.abs(v - t) < Math.abs(best - t)) best = v;
    return best;
  };
  const HU = 44, HP = 34;
  T.numberHop = {
    init(r) { r.pos = 0; r.touched = false; },
    text(r) { const it = r.item; return it.mode === 'to' ? `Hop to ${it.n} (0\u2013${it.max})` : it.mode === 'between' ? `Between ${it.a} and ${it.b}` : `Right ${it.mode} ${it.n}`; },
    view(r) {
      const it = r.item, W = HP * 2 + HU * it.max, all = r.hint >= 2 || r.solved, x = v => HP + HU * v;
      let ticks = '';
      for (let v = 0; v <= it.max; v++) {
        const lab = labeled(it, v, all), big = labeled(it, v);
        ticks += `<g class="tk${r.pos === v && r.touched ? ' on' : ''}" data-act="tick" data-v="${v}" data-drop="${v}" role="button" tabindex="0" aria-label="${lab ? v : 'Mark'}">
          <rect x="${x(v) - HU / 2}" y="40" width="${HU}" height="70" fill="transparent"/>
          <line x1="${x(v)}" y1="${big ? 62 : 68}" x2="${x(v)}" y2="${big ? 86 : 80}" stroke="var(--ink)" stroke-width="${big ? 3 : 2}"/>
          ${lab ? `<text x="${x(v)}" y="106" text-anchor="middle" class="tk-l${big ? '' : ' faint'}">${v}</text>` : ''}</g>`;
      }
      let arcs = '';
      if (r.solved || r.hint >= 2) {
        const a = hopAnchor(it), t = hopTarget(it), step = t >= a ? 1 : -1;
        for (let v = a; v !== t; v += step) arcs += `<path d="M${x(v)} 70 Q${x(v + step / 2)} 34 ${x(v + step)} 70" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="4 3"/>`;
      }
      const inner = `<line x1="${HP - 14}" y1="74" x2="${W - HP + 14}" y2="74" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>${arcs}${ticks}`;
      const pct = x(r.pos) / W * 100;
      const prompt = it.mode === 'to' ? `Help the rabbit hop to <b class="big-inline">${it.n}</b>.`
        : it.mode === 'between' ? `Hop to the number between <b>${it.a}</b> and <b>${it.b}</b>.`
          : `Hop to the number that comes right ${it.mode} <b>${it.n}</b>.`;
      return `<p class="prompt">${prompt}</p>
        <p class="sub">Drag the rabbit to a mark, or tap the mark.</p>
        <div class="hop"><div class="hop-in" style="min-width:${Math.min(it.max * 34 + 60, 1100)}px">
          <svg viewBox="0 0 ${W} 120" class="hop-svg">${inner}</svg>
          <button type="button" class="bunny${r.touched ? '' : ' idle'}" data-drag="rabbit" style="left:${pct}%" aria-label="Rabbit, on ${r.touched ? 'the mark you chose' : '0'}"${r.solved ? ' disabled' : ''}>${svg(ART.rabbit)}</button>
        </div></div>`;
    },
    handle(r, act, el) {
      if (act === 'tick') { r.pos = +el.dataset.v; r.touched = true; return { focus: `[data-act="tick"][data-v="${r.pos}"]` }; }
      if (act === 'drop') { r.pos = +el.dataset.drop; r.touched = true; return {}; }
    },
    check(r) {
      const it = r.item, t = hopTarget(it);
      if (!r.touched) return { nudge: 'Move the rabbit first: drag it, or tap a mark.' };
      if (r.pos === t) return { ok: true };
      if ((it.mode === 'after' || it.mode === 'before') && r.pos === it.n) return { err: 'same', tag: `Stopped on the given number instead of the one ${it.mode} it` };
      if (Math.abs(r.pos - t) === 1 && it.labels !== 'all') return { err: 'off1', tag: 'Landed one mark away (counted the marks instead of the jumps)' };
      return { err: 'miss', tag: 'Placed a number in the wrong spot on a number line' };
    },
    hint(r, lv) {
      const it = r.item, a = hopAnchor(it), t = hopTarget(it);
      if (lv >= 2) return `Now every mark has its number. Follow the hops from ${a}.`;
      if (r.err === 'same') return `You are on ${it.n}. The number right ${it.mode} it is one hop ${it.mode === 'after' ? 'to the right' : 'to the left'}.`;
      if (r.err === 'off1') return `Count the hops, not the marks. Start at ${a} and say \u201c${a}\u201d before you hop.`;
      if (it.mode === 'between') return `Find ${it.a} and ${it.b}. Which mark is in the middle?`;
      if (it.labels === 'all') return `Find the mark with ${t} under it.`;
      return `Find the closest number you can see, ${a}. Count ${t > a ? 'forward' : 'back'} one hop at a time.`;
    },
    show(r) { r.pos = hopTarget(r.item); r.touched = true; },
    explain(r) {
      const it = r.item, a = hopAnchor(it), t = hopTarget(it), k = Math.abs(t - a);
      if (it.mode === 'between') return `${it.a}, ${t}, ${it.b}: ${t} sits between ${it.a} and ${it.b}. Each number is one hop from the next.`;
      if (k === 0) return `${t} has its own label. Every number has one place on the number line.`;
      return `${t} is ${plural(k, 'hop')} ${t > a ? 'to the right of' : 'to the left of'} ${a}. Each hop is 1, so ${a} ${t > a ? '+' : '\u2212'} ${k} = ${t}. Numbers get bigger to the right.`;
    },
    thumb: svg(`<line x1="4" y1="24" x2="76" y2="24" stroke="var(--ink)" stroke-width="2"/>${[8, 22, 36, 50, 64].map(x => `<line x1="${x}" y1="20" x2="${x}" y2="28" stroke="var(--ink)" stroke-width="1.5"/>`).join('')}<path d="M22 20 Q29 6 36 20" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="3 2"/><g transform="translate(40 0) scale(.5)">${ART.rabbit}</g>`, '0 0 80 32')
  };

  /* ======================================================================
   * Which Has More? (K.I.A.10)
   * ====================================================================== */
  const THINGS = { apple: 'apples', flower: 'flowers', star: 'stars', fish: 'fish' };
  const rowX = (n, layout, isSpread, other) => {
    if (n === 1) return [40];
    if (layout !== 'even' && isSpread) return Array.from({ length: n }, (_, i) => 30 + i * (360 / (n - 1)));
    if (layout !== 'even' && !isSpread) { const s = Math.min(30, 290 / (n - 1)); return Array.from({ length: n }, (_, i) => 30 + i * s); }
    return Array.from({ length: n }, (_, i) => 30 + i * 40);
  };
  T.compareGroups = {
    choice: true,
    init(r) { r.choice = null; },
    text(r) { const it = r.item; return `${it.a} ${THINGS[it.ta]} vs ${it.b} ${THINGS[it.tb]}`; },
    correct(r) { const { a, b } = r.item; return a > b ? 'a' : a < b ? 'b' : 'same'; },
    pos(r) { const it = r.item; return { xa: rowX(it.a, it.layout, it.layout === 'spreadA', it.b), xb: rowX(it.b, it.layout, it.layout === 'spreadB', it.a) }; },
    view(r) {
      const it = r.item, { xa, xb } = this.pos(r);
      const size = xs => xs.length > 1 ? Math.min(36, xs[1] - xs[0] + 4) : 36;
      const icon = (k, x, y, S) => `<g transform="translate(${x - S / 2} ${y - S / 2}) scale(${S / 40})">${ART[k]}</g>`;
      let lines = '';
      if (r.hint >= 2 || r.solved) {
        const m = Math.min(it.a, it.b);
        for (let i = 0; i < m; i++) lines += `<line x1="${xa[i]}" y1="62" x2="${xb[i]}" y2="128" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4 3"/>`;
        (it.a > it.b ? xa.slice(m).map(x => [x, 45]) : xb.slice(m).map(x => [x, 145])).forEach(([x, y]) => { lines += `<circle cx="${x}" cy="${y}" r="18" fill="none" stroke="var(--warn)" stroke-width="2.5"/>`; });
      }
      const rowA = `<g class="row-hit${r.choice === 'a' ? ' picked' : ''}"><rect x="4" y="20" width="412" height="50" rx="12" class="row-bg"/>${xa.map(x => icon(it.ta, x, 45, size(xa))).join('')}</g>`;
      const rowB = `<g class="row-hit${r.choice === 'b' ? ' picked' : ''}"><rect x="4" y="120" width="412" height="50" rx="12" class="row-bg"/>${xb.map(x => icon(it.tb, x, 145, size(xb))).join('')}</g>`;
      const dis = r.solved ? ' disabled' : '', pk = k => r.choice === k ? ' picked' : '';
      return `<p class="prompt">Are there more ${THINGS[it.ta]} or more ${THINGS[it.tb]}?</p>
        <div class="scene">${svg(rowA + rowB + lines, '0 0 420 190', 'scene-svg')}</div>
        <div class="choices" role="group" aria-label="Your answer">
          <button type="button" class="choice${pk('a')}" data-act="choose" data-c="a"${dis}><span class="cico">${svg(ART[it.ta])}</span><span class="word">More ${THINGS[it.ta]}</span></button>
          <button type="button" class="choice${pk('same')}" data-act="choose" data-c="same"${dis}><span class="word">The same</span></button>
          <button type="button" class="choice${pk('b')}" data-act="choose" data-c="b"${dis}><span class="cico">${svg(ART[it.tb])}</span><span class="word">More ${THINGS[it.tb]}</span></button>
        </div>`;
    },
    handle(r, act, el) { if (act === 'choose') { r.choice = el.dataset.c; return { check: true }; } },
    check(r) {
      const it = r.item, c = this.correct(r);
      if (!r.choice) return { nudge: 'Tap your answer.' };
      if (r.choice === c) return { ok: true };
      const spreadRow = it.layout === 'spreadA' ? 'a' : it.layout === 'spreadB' ? 'b' : null;
      if (spreadRow && r.choice === spreadRow) return { err: 'spread', tag: 'Judged by how long a row looks instead of matching or counting' };
      return { err: 'other', tag: 'Compared two groups incorrectly' };
    },
    hint(r, lv) {
      const it = r.item;
      if (lv >= 2) return `Each dashed line matches one ${THINGS[it.ta].replace(/s$/, '')} with one ${THINGS[it.tb].replace(/s$/, '')}. Look for any left over with no partner.`;
      if (r.err === 'spread') return 'A row can look longer just because things are spread out. Match them one to one, or count each row.';
      return `Count the ${THINGS[it.ta]}. Then count the ${THINGS[it.tb]}.`;
    },
    show(r) { r.choice = this.correct(r); },
    explain(r) {
      const it = r.item, c = this.correct(r), m = Math.min(it.a, it.b), left = Math.abs(it.a - it.b);
      if (c === 'same') return `${it.a} ${THINGS[it.ta]} and ${it.b} ${THINGS[it.tb]}. Every one has a partner and none is left over, so they are equal: ${it.a} = ${it.b}.${it.layout !== 'even' ? ' Spreading things out does not change how many there are.' : ''}`;
      const more = c === 'a' ? THINGS[it.ta] : THINGS[it.tb];
      return `${m} pairs match up, and ${left} ${more} ${left === 1 ? 'has' : 'have'} no partner. So there are more ${more}: ${Math.max(it.a, it.b)} is more than ${m}.${it.layout !== 'even' ? ' The longer row is not always the bigger group.' : ''}`;
    },
    thumb: svg(`${[10, 26, 42].map(x => `<g transform="translate(${x - 6} 2) scale(.3)">${ART.apple}</g>`).join('')}${[10, 20, 30, 40, 50].map(x => `<g transform="translate(${x - 6} 18) scale(.3)">${ART.flower}</g>`).join('')}`, '0 0 80 32')
  };

  /* ======================================================================
   * What Time Is It? (K.II.B.4)
   * ====================================================================== */
  const CTX = {
    3: 'Snack time is at 3 o\u2019clock.', 7: 'Breakfast is at 7 o\u2019clock.', 8: 'Bedtime is at 8 o\u2019clock.',
    9: 'Sunday Mass starts at 9 o\u2019clock.', 10: 'Recess is at 10 o\u2019clock.', 12: 'The Angelus bell rings at 12 o\u2019clock, noon.',
    6: 'The evening Angelus bell rings at 6 o\u2019clock.', 4: 'Soccer practice is at 4 o\u2019clock.', 11: 'Story time is at 11 o\u2019clock.'
  };
  const C = 120;
  function clockFace(r, hour, mode, ring) {
    let nums = '', ticks = '';
    for (let h = 1; h <= 12; h++) {
      const a = h * Math.PI / 6, x = C + 86 * Math.sin(a), y = C - 86 * Math.cos(a);
      const hl = ring === h ? `<circle cx="${x}" cy="${y}" r="17" fill="var(--accent)" fill-opacity=".18" stroke="var(--accent)" stroke-width="2"/>` : '';
      nums += mode === 'set'
        ? `<g class="hr" data-act="hour" data-h="${h}" role="button" tabindex="0" aria-label="${h}">${hl}<circle cx="${x}" cy="${y}" r="17" fill="transparent"/><text x="${x}" y="${y + 8}" text-anchor="middle" class="cnum">${h}</text></g>`
        : `${hl}<text x="${x}" y="${y + 8}" text-anchor="middle" class="cnum">${h}</text>`;
    }
    for (let m = 0; m < 60; m++) { const a = m * Math.PI / 30, r1 = m % 5 ? 106 : 101; ticks += `<line x1="${C + r1 * Math.sin(a)}" y1="${C - r1 * Math.cos(a)}" x2="${C + 111 * Math.sin(a)}" y2="${C - 111 * Math.cos(a)}" stroke="var(--ink)" stroke-width="${m % 5 ? 1 : 2.5}" stroke-opacity="${m % 5 ? .4 : .9}"/>`; }
    return `<circle cx="${C}" cy="${C}" r="116" fill="var(--surface)" stroke="var(--ink)" stroke-width="5"/>${ticks}${nums}
      <line x1="${C}" y1="${C}" x2="${C}" y2="54" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
      <g data-hand data-cx="${C}" data-cy="${C}" transform="rotate(${hour * 30} ${C} ${C})" class="${mode === 'set' ? 'hand-live' : ''}"><line x1="${C}" y1="${C + 10}" x2="${C}" y2="76" stroke="var(--t1)" stroke-width="10" stroke-linecap="round"/>${mode === 'set' ? `<circle cx="${C}" cy="76" r="12" fill="var(--t1)" fill-opacity=".25"/>` : ''}</g>
      <circle cx="${C}" cy="${C}" r="7" fill="var(--ink)"/>`;
  }
  T.clock = {
    choice: r => r.item.mode === 'read',
    init(r) { r.hour = r.item.h === 6 ? 9 : 6; r.touched = false; r.choice = null; },
    text(r) { return `${r.item.mode === 'set' ? 'Show' : 'Read'} ${r.item.h} o'clock`; },
    options(r) {
      const h = r.item.h, set = new Set([h, h === 12 ? 6 : 12, h % 12 + 1]);
      if (set.size < 3) set.add((h + 1) % 12 + 1);
      return [...set].sort((a, b) => a - b);
    },
    view(r) {
      const it = r.item, ctx = CTX[it.h] || '';
      if (it.mode === 'set') {
        return `<p class="prompt">${esc(ctx)} Show <b class="big-inline">${it.h}</b> o\u2019clock.</p>
          <p class="sub">Drag the short red hand, or tap a number.</p>
          <div class="clockwrap">${svg(clockFace(r, r.hour, 'set', r.hint >= 2 || r.solved ? it.h : null), '0 0 240 240', 'clock dial', ' data-dial="1"').replace('aria-hidden="true"', 'role="group" aria-label="Clock"')}</div>`;
      }
      const dis = r.solved ? ' disabled' : '';
      return `<p class="prompt">What time does the clock show?</p>
        <div class="clockwrap">${svg(clockFace(r, it.h, 'read', r.hint >= 2 || r.solved ? it.h : null), '0 0 240 240', 'clock')}</div>
        <div class="choices" role="group" aria-label="Your answer">${this.options(r).map(v => `<button type="button" class="choice${r.choice === v ? ' picked' : ''}" data-act="choose" data-c="${v}"${dis}><span class="word">${v} o\u2019clock</span></button>`).join('')}</div>`;
    },
    handle(r, act, el) {
      if (act === 'choose') { r.choice = +el.dataset.c; return { check: true }; }
      if (act === 'hour') { r.hour = +el.dataset.h; r.touched = true; return { focus: `[data-act="hour"][data-h="${r.hour}"]` }; }
      if (act === 'dial') { const h = Math.round(+el.dataset.angle / 30) % 12; r.hour = h === 0 ? 12 : h; r.touched = true; return {}; }
    },
    check(r) {
      const it = r.item;
      if (it.mode === 'read') {
        if (r.choice === null) return { nudge: 'Tap the time.' };
        if (r.choice === it.h) return { ok: true };
        if (r.choice === 12) return { err: 'minute', tag: 'Read the long (minute) hand as the hour' };
        return { err: 'wrong', tag: 'Read the hour on a clock incorrectly' };
      }
      if (!r.touched) return { nudge: 'Move the short red hand first.' };
      if (r.hour === it.h) return { ok: true };
      if (Math.min((r.hour - it.h + 12) % 12, (it.h - r.hour + 12) % 12) === 1) return { err: 'near', tag: 'Pointed the hour hand next to the right number' };
      return { err: 'wrong', tag: 'Set the hour on a clock incorrectly' };
    },
    hint(r, lv) {
      const it = r.item;
      if (lv >= 2) return it.mode === 'set' ? `The circled number is where the short hand goes for ${it.h} o\u2019clock.` : 'The short red hand points at the circled number. That number is the hour.';
      if (r.err === 'minute') return 'The long hand is the minute hand. When it points to 12, the time is \u201co\u2019clock.\u201d The short hand tells which hour.';
      if (r.err === 'near') return 'Close. Look carefully: the short hand must point right at the number.';
      return it.mode === 'set' ? `The short hand shows the hour. Make it point straight at ${it.h}.` : 'Find the short red hand. Which number is it pointing to?';
    },
    show(r) { if (r.item.mode === 'read') r.choice = r.item.h; else { r.hour = r.item.h; r.touched = true; } },
    explain(r) {
      const h = r.item.h;
      return `At ${h} o\u2019clock the long hand points to 12 and the short hand points to ${h}. The short hand tells the hour. When the long hand is on 12, we say \u201co\u2019clock.\u201d`;
    },
    thumb: svg(`<circle cx="40" cy="16" r="14" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><line x1="40" y1="16" x2="40" y2="5" stroke="var(--ink)" stroke-width="2" stroke-linecap="round"/><line x1="40" y1="16" x2="48" y2="16" stroke="var(--t1)" stroke-width="3" stroke-linecap="round"/>`, '0 0 80 32')
  };

  /* ======================================================================
   * Robot Path (K.III.2): give step-by-step directions with the words up, down, left, right.
   * ====================================================================== */
  const MOVES = { U: [0, -1, 'up'], D: [0, 1, 'down'], L: [-1, 0, 'left'], R: [1, 0, 'right'] };
  const key = (x, y) => x + ',' + y;
  function sim(it, prog) {
    const rocks = new Set((it.rocks || []).map(([x, y]) => key(x, y)));
    let [x, y] = it.start; const trace = [[x, y]]; let bump = null;
    for (const m of prog) {
      const [dx, dy] = MOVES[m], nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= it.w || ny >= it.h || rocks.has(key(nx, ny))) { bump = [nx, ny]; break; }
      x = nx; y = ny; trace.push([x, y]);
    }
    return { trace, end: [x, y], bump, at: x === it.goal[0] && y === it.goal[1] };
  }
  function solve(it) {
    const rocks = new Set((it.rocks || []).map(([x, y]) => key(x, y)));
    const prev = new Map([[key(...it.start), null]]), q = [it.start];
    while (q.length) {
      const [x, y] = q.shift();
      if (x === it.goal[0] && y === it.goal[1]) break;
      for (const m of 'RLUD') {
        const nx = x + MOVES[m][0], ny = y + MOVES[m][1], k = key(nx, ny);
        if (nx < 0 || ny < 0 || nx >= it.w || ny >= it.h || rocks.has(k) || prev.has(k)) continue;
        prev.set(k, [key(x, y), m]); q.push([nx, ny]);
      }
    }
    const out = []; let k = key(...it.goal);
    if (!prev.has(k)) return null;
    while (prev.get(k)) { const [pk, m] = prev.get(k); out.unshift(m); k = pk; }
    return out;
  }
  CM.robot = { sim, solve };
  const ARROW = d => svg(`<path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" transform="rotate(${{ R: 0, D: 90, L: 180, U: 270 }[d]} 12 12)"/>`, '0 0 24 24');
  const MAXPROG = 14;

  T.robot = {
    checkLabel: 'Run',
    init(r) { r.prog = []; r.running = false; r.frame = 0; r.ranPos = null; r.bumpAt = null; },
    text(r) { return `Robot path ${r.item.w}\u00d7${r.item.h}` + (r.prog.length ? ` \u2192 ${r.prog.join('')}` : ''); },
    view(r) {
      const it = r.item, rocks = new Set((it.rocks || []).map(([x, y]) => key(x, y)));
      const pos = r.running ? r.trace[r.frame] : (r.ranPos || it.start);
      const path = new Set();
      if (r.hint >= 2 || r.solved) { let [x, y] = it.start; (solve(it) || []).forEach(m => { x += MOVES[m][0]; y += MOVES[m][1]; path.add(key(x, y)); }); }
      let cells = '';
      for (let y = 0; y < it.h; y++) for (let x = 0; x < it.w; x++) {
        const k = key(x, y), robotHere = pos[0] === x && pos[1] === y;
        const bump = r.bumpAt && r.bumpAt[0] === x && r.bumpAt[1] === y;
        cells += `<div class="cell2${path.has(k) ? ' path' : ''}${bump ? ' bump' : ''}">${rocks.has(k) ? svg(ART.rock) : ''}${it.goal[0] === x && it.goal[1] === y ? svg(ART.flower, '0 0 40 40', 'goal') : ''}${robotHere ? svg(ART.robot, '0 0 40 40', 'bot' + (r.running ? ' moving' : '')) : ''}</div>`;
      }
      const dis = r.solved || r.running ? ' disabled' : '';
      const chips = r.prog.length ? r.prog.map((m, i) => `<button type="button" class="pchip${r.running && i === r.frame - 1 ? ' now' : ''}" data-act="rm" data-i="${i}" aria-label="Step ${i + 1}: ${MOVES[m][2]}. Tap to remove."${dis}>${ARROW(m)}</button>`).join('') : '<span class="muted">Your steps will show here.</span>';
      return `<p class="prompt">Help the robot reach the flower.</p>
        <p class="sub">Tap arrows to plan each step, then press Run. Don't bump the rocks.</p>
        <div class="grid2" style="--w:${it.w}" role="img" aria-label="Grid ${it.w} by ${it.h}. Robot at column ${pos[0] + 1}, row ${pos[1] + 1}. Flower at column ${it.goal[0] + 1}, row ${it.goal[1] + 1}.">${cells}</div>
        <div class="prog" aria-live="polite"><span class="eyebrow">Steps (${r.prog.length})</span><div class="pchips">${chips}</div></div>
        <div class="arrows" role="group" aria-label="Add a step">${['U', 'L', 'R', 'D'].map(m => `<button type="button" class="arrowbtn a-${m}" data-act="add" data-m="${m}"${dis || r.prog.length >= MAXPROG ? ' disabled' : ''}>${ARROW(m)}<span>${MOVES[m][2]}</span></button>`).join('')}
          <button type="button" class="btn btn-ghost sm" data-act="undo"${dis || !r.prog.length ? ' disabled' : ''}>Undo</button>
          <button type="button" class="btn btn-ghost sm" data-act="clear"${dis || !r.prog.length ? ' disabled' : ''}>Clear</button></div>`;
    },
    handle(r, act, el) {
      const reset = () => { r.ranPos = null; r.bumpAt = null; };
      if (act === 'add' && r.prog.length < MAXPROG) { r.prog.push(el.dataset.m); reset(); return { focus: `[data-act="add"][data-m="${el.dataset.m}"]` }; }
      if (act === 'undo') { r.prog.pop(); reset(); return { focus: '[data-act="undo"]' }; }
      if (act === 'clear') { r.prog = []; reset(); return { focus: '[data-act="add"][data-m="R"]' }; }
      if (act === 'rm') { r.prog.splice(+el.dataset.i, 1); reset(); return {}; }
    },
    animate: {
      start(r) {
        if (!r.prog.length) return { nudge: 'Tap the arrows to plan the robot\u2019s steps.' };
        const s = sim(r.item, r.prog);
        r.trace = s.trace; r.frame = 0; r.running = true; r.bumpAt = null; r.ranPos = null;
        return true;
      },
      step(r) {
        if (r.frame < r.trace.length - 1) { r.frame++; return true; }
        const s = sim(r.item, r.prog); r.ranPos = s.end; r.bumpAt = s.bump; r.running = false;
        return false;
      }
    },
    check(r) {
      const it = r.item;
      if (!r.prog.length) return { nudge: 'Tap the arrows to plan the robot\u2019s steps.' };
      const s = sim(it, r.prog);
      r.ranPos = s.end; r.bumpAt = s.bump;
      if (s.at && !s.bump) return { ok: true, note: r.prog.length > solve(it).length ? `It works. Can you find a way with only ${solve(it).length} steps?` : '' };
      const swap = (a, b) => r.prog.map(m => m === a ? b : m === b ? a : m);
      const sLR = sim(it, swap('L', 'R')), sUD = sim(it, swap('U', 'D'));
      if (sLR.at && !sLR.bump && r.prog.some(m => m === 'L' || m === 'R')) return { err: 'lr', tag: 'Mixed up left and right' };
      if (sUD.at && !sUD.bump && r.prog.some(m => m === 'U' || m === 'D')) return { err: 'ud', tag: 'Mixed up up and down' };
      if (s.bump) return { err: 'bump', tag: 'Planned a path that runs into a rock or the edge' };
      return { err: 'miss', tag: 'Planned a path that stops before the goal' };
    },
    hint(r, lv) {
      const it = r.item;
      if (lv >= 2) return 'Follow the dotted squares from the robot to the flower. Plan one arrow for each square.';
      if (r.err === 'lr') return 'Your robot went the opposite way. Hold up your hands: the hand that makes an L is your left.';
      if (r.err === 'ud') return 'Up moves toward the top of the picture. Down moves toward the bottom.';
      if (r.err === 'bump') return 'The robot stopped where it bumped. Plan a way around the rocks.';
      if (r.err === 'miss') return 'The robot stopped before the flower. Count how many more squares it needs.';
      return `Look at the robot. The flower is ${it.goal[0] > it.start[0] ? 'to the right' : it.goal[0] < it.start[0] ? 'to the left' : ''}${it.goal[0] !== it.start[0] && it.goal[1] !== it.start[1] ? ' and ' : ''}${it.goal[1] < it.start[1] ? 'up' : it.goal[1] > it.start[1] ? 'down' : ''}. What should the first step be?`;
    },
    show(r) { r.prog = solve(r.item).slice(); r.ranPos = r.item.goal; r.bumpAt = null; },
    explain(r) {
      const p = r.prog.length ? r.prog : solve(r.item);
      const words = []; let i = 0;
      while (i < p.length) { let j = i; while (j < p.length && p[j] === p[i]) j++; words.push(`${j - i} ${MOVES[p[i]][2]}`); i = j; }
      return `The robot\u2019s plan: ${words.join(', then ')}. That is ${plural(p.length, 'step')}. A list of steps in order, like this one, is called an algorithm. Change the order and the robot ends up somewhere else.`;
    },
    thumb: svg(`${[0, 1, 2, 3].map(i => `<rect x="${8 + i * 17}" y="6" width="15" height="15" rx="2" fill="var(--sunk)" stroke="var(--line)"/>`).join('')}<g transform="translate(8 6) scale(.38)">${ART.robot}</g><g transform="translate(59 6) scale(.38)">${ART.flower}</g><path d="M28 26h24M46 23l6 3-6 3" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round"/>`, '0 0 80 32')
  };

  T.tenframe && (T.tenframe.thumb = svg(`${[0, 1, 2, 3, 4].map(i => `<rect x="${14 + i * 11}" y="6" width="10" height="10" fill="var(--surface)" stroke="var(--line)"/><rect x="${14 + i * 11}" y="16" width="10" height="10" fill="var(--surface)" stroke="var(--line)"/>`).join('')}${[0, 1, 2, 3, 4, 5, 6].map(i => `<circle cx="${19 + (i % 5) * 11}" cy="${11 + Math.floor(i / 5) * 10}" r="3.5" fill="var(--t4)"/>`).join('')}`, '0 0 80 32'));
})(typeof window !== 'undefined' ? window.CM : global.CM);
