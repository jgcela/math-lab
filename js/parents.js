/* Family dashboard for parents and teachers.
 * Pure analytics (CM.Parents.stats and helpers) run under Node for tests; render() returns an HTML string.
 * Reads the same family store as the rest of the app. Sample mode (#family-demo) renders a made-up family
 * from memory and never writes to the store. */
(function (CM) {
  'use strict';
  const { esc, plural, fmtTime } = CM.h;
  const DAY = 864e5;
  const P = CM.Parents = { focus: 'all' };

  /* ---------- time helpers ---------- */
  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const addDays = (t, n) => { const d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); };
  P.dayStart = dayStart;

  /* Minutes estimated from answer times: gaps between answers count up to 3 minutes, a new session adds 30 seconds. */
  P.estimateSeconds = function (acts, from, to) {
    const ts = acts.map(a => a.t).filter(t => t >= from && t < to).sort((a, b) => a - b);
    let s = 0;
    ts.forEach((t, i) => { const gap = i ? t - ts[i - 1] : Infinity; s += gap <= 180e3 ? gap / 1000 : 30; });
    return s;
  };

  /* Days in a row with practice, ending today (or yesterday, so a streak survives until bedtime). */
  P.streak = function (acts, now) {
    const days = new Set(acts.map(a => dayStart(a.t)));
    let d = dayStart(now);
    if (!days.has(d)) d = addDays(d, -1);
    let n = 0;
    while (days.has(d)) { n++; d = addDays(d, -1); }
    return n;
  };

  /* When a mission was mastered: replay its answers with the mastery rule from core.js. */
  P.masteredAt = function (acts, missionId) {
    let streak = 0, top = false;
    for (const a of acts) {
      if (a.mission !== missionId) continue;
      if (!a.helped) { streak++; if (a.tier >= CM.rules.topTier) top = true; if (streak >= CM.rules.masteryRun && top) return a.t; }
      else { streak = 0; top = false; }
    }
    return 0;
  };

  P.byDay = function (acts) {
    const m = new Map();
    acts.forEach(a => { const k = dayStart(a.t), x = m.get(k) || { n: 0, clean: 0 }; x.n++; if (!a.helped) x.clean++; m.set(k, x); });
    return m;
  };

  /* Everything the dashboard shows for one child. Call inside CM.store.withChild. */
  P.stats = function (c, now) {
    const d = c.data, acts = d.activity, today = dayStart(now), weekFrom = addDays(today, -6), prevFrom = addDays(today, -13);
    const inRange = (from, to) => acts.filter(a => a.t >= from && a.t < to);
    const week = inRange(weekFrom, addDays(today, 1)), prev = inRange(prevFrom, weekFrom);
    const recent = acts.slice(-40), clean = recent.filter(a => !a.helped).length;
    const gradeMissions = CM.MISSIONS.filter(m => m.grade === c.grade);
    const ring = gradeMissions.map(m => { const p = CM.store.peek(m.id); return { id: m.id, title: m.title, status: CM.status(m.id), tier: p ? p.tier : 0, done: p ? p.done : 0 }; });
    const mastered = CM.MISSIONS.filter(m => (CM.store.peek(m.id) || {}).mastered).map(m => ({ id: m.id, title: m.title, at: P.masteredAt(acts, m.id) })).sort((a, b) => b.at - a.at);
    const close = CM.MISSIONS.map(m => ({ m, p: CM.store.peek(m.id) })).filter(x => x.p && !x.p.mastered && x.p.streak >= 1 && x.p.tier >= 2).sort((a, b) => b.p.streak - a.p.streak || b.p.tier - a.p.tier)[0];
    const tags = {};
    d.log.forEach(l => { const k = l.tag; const x = tags[k] = tags[k] || { tag: k, n: 0, mission: l.mission, last: 0, ex: l.detail }; x.n++; x.last = Math.max(x.last, l.t); });
    return {
      child: c,
      total: acts.length,
      week: week.length, prevWeek: prev.length,
      weekAcc: week.length ? Math.round(100 * week.filter(a => !a.helped).length / week.length) : null,
      prevAcc: prev.length ? Math.round(100 * prev.filter(a => !a.helped).length / prev.length) : null,
      weekSeconds: P.estimateSeconds(acts, weekFrom, addDays(today, 1)),
      totalSeconds: Object.values(d.missions).reduce((s, p) => s + (p.time || 0), 0),
      streak: P.streak(acts, now),
      accuracy: recent.length ? Math.round(100 * clean / recent.length) : null,
      days: P.byDay(acts),
      ring, mastered,
      close: close ? { id: close.m.id, title: close.m.title, need: Math.max(1, CM.rules.masteryRun - close.p.streak) } : null,
      needsWork: CM.needsWork().map(id => CM.mission(id)).filter(Boolean),
      mistakes: Object.values(tags).sort((a, b) => b.n - a.n),
      next: CM.recommend(c.grade, 2).map(x => ({ ...x, title: CM.mission(x.id).title }))
    };
  };

  /* ---------- sample family (made up, deterministic, never saved) ---------- */
  const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const DEMO_TAGS = {
    'k-count-build': ['Skipped objects while counting', 'Built a group with the wrong number of objects'],
    'k-pattern-train': ['Copied the last shape instead of continuing the pattern'],
    'k-shape-hunt': ['Did not recognize a shape that was turned', 'Called a rectangle a square'],
    'k-number-hop': ['Landed one mark away (counted the marks instead of the jumps)'],
    'k-which-more': ['Judged by how long a row looks instead of matching or counting'],
    'k-clock': ['Read the long (minute) hand as the hour'],
    'k-robot-path': ['Mixed up left and right'],
    'g3-fraction-build': ['Did not cut the whole into the number of pieces on the bottom', 'Colored the wrong number of pieces'],
    'g3-fraction-compare': ['Thinks a bigger bottom number means a bigger fraction', 'Compared fractions incorrectly'],
    'g3-fraction-equiv': ['Colored too little to match the amount'],
    'g3-arrays': ['Added the numbers instead of multiplying'],
    'g3-add-regroup': ['Forgot to trade 10 ones for a ten (or 10 tens for a hundred)'],
    'g3-sub-regroup': ['Subtracted the smaller digit from the bigger one in each place'],
    'g5-garden': ['Found the planted fraction instead of the available fraction']
  };
  const HARD = { 'g3-fraction-compare': .28, 'g3-sub-regroup': .18, 'k-clock': .2, 'k-robot-path': .12 };
  P.demoFamily = function (now) {
    const kids = [
      { id: 'demo-a', name: 'Lucy', grade: 'K', color: 't6', seed: 7, rate: .62, skill: .05 },
      { id: 'demo-b', name: 'Mateo', grade: '3', color: 't4', seed: 11, rate: .5, skill: 0 }
    ];
    const fam = { v: 2, activeId: null, children: kids.map(k => ({ id: k.id, name: k.name, grade: k.grade, color: k.color, created: now - 90 * DAY, data: CM.freshState() })) };
    P.withFamily(fam, () => kids.forEach(k => CM.store.withChild(k.id, c => {
      const r = rng(k.seed), st = CM.store.state;
      st.profile = { name: c.name, grade: c.grade };
      const order = CM.MISSIONS.filter(m => m.grade === c.grade).map(m => m.id);
      let practiced = 0;
      for (let back = 83; back >= 0; back--) {
        const day = addDays(dayStart(now), -back), ramp = back < 21 ? 1.25 : 1;
        if (back !== 0 && r() > k.rate * ramp) continue;
        // A new mission opens about every 12 practice days, so the sample shows a mix of mastered, practicing and new.
        const open = new Set(order.slice(0, 1 + Math.floor(practiced++ / 12)));
        let t = day + (15.5 + r() * 4) * 3600e3;
        if (back === 0) t = Math.min(t, now - 40 * 60e3);
        const n = 5 + Math.floor(r() * 9);
        for (let i = 0; i < n; i++) {
          const recs = CM.recommend(c.grade, 8).filter(x => open.has(x.id)).slice(0, 3); if (!recs.length) break;
          const pick = recs[r() < .75 ? 0 : Math.floor(r() * recs.length)].id, m = CM.mission(pick), prog = CM.store.m(m.id);
          const stretch = prog.mastered && m.items.some(x => x.tier === CM.rules.stretchTier) && r() < .5;
          const { tier } = CM.pickItem(m, prog, stretch);
          const pHelp = Math.max(.04, .1 + .07 * tier + (HARD[m.id] || 0) - k.skill - .015 * Math.min(prog.done, 8));
          const helped = r() < pHelp, secs = 20 + r() * 50;
          t += secs * 1000;
          CM.recordResult(m, prog, tier, helped, stretch);
          prog.time += secs; prog.last = t;
          st.activity[st.activity.length - 1].t = t;
          st.lastMission = m.id;
          if (helped) { const tags = DEMO_TAGS[m.id] || ['Needed a hint']; CM.logMistake(m, tags[Math.floor(r() * tags.length)], ''); st.log[0].t = t; }
        }
      }
    })));
    fam.activeId = null;
    return fam;
  };
  P.withFamily = function (fam, fn) {
    const s = CM.store, pf = s.family, ps = s.state;
    s.family = fam; s.state = CM.freshState();
    try { return fn(); } finally { s.family = pf; s.state = ps; }
  };

  /* ---------- graphics ---------- */
  const pt = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  // Rose window: one petal per mission in the child's grade. Fewer than 8 missions leaves dashed "not built yet" petals.
  function rose(s) {
    const c = s.child, ring = s.ring.slice(), N = Math.max(8, ring.length);
    while (ring.length < N) ring.push(null);
    const r0 = 30, r1 = 104, w = Math.min(Math.PI / N * .92, .62);
    const petals = ring.map((m, i) => {
      const a = -Math.PI / 2 + i * 2 * Math.PI / N;
      const d = `M${pt(r0, a)} Q${pt(r1 * .78, a - w)} ${pt(r1, a)} Q${pt(r1 * .78, a + w)} ${pt(r0, a)}Z`;
      if (!m) return `<path class="pe pe-soon" d="${d}" style="--i:${i}"><title>Mission not built yet</title></path>`;
      const lvl = m.status === 'mastered' ? 'm' : m.status === 'practicing' ? 'p' + Math.min(3, Math.max(1, m.tier)) : m.status === 'locked' ? 'l' : 'r';
      const label = `${m.title}: ${m.status === 'mastered' ? 'mastered' : m.status === 'practicing' ? `practicing, level ${m.tier} of 3` : m.status === 'locked' ? 'suggested later' : 'not started'}`;
      return `<path class="pe pe-${lvl}" d="${d}" style="--i:${i}"><title>${esc(label)}</title></path>${lvl === 'm' ? `<path class="spark" style="--i:${i}" transform="translate(${pt(r1 * .62, a).replace(' ', ',')})" d="M0 -6 L1.6 -1.6 6 0 1.6 1.6 0 6 -1.6 1.6 -6 0 -1.6 -1.6Z"/>` : ''}`;
    }).join('');
    const dots = Array.from({ length: N }, (_, i) => { const a = -Math.PI / 2 + (i + .5) * 2 * Math.PI / N, [x, y] = pt(108, a).split(' '); return `<circle cx="${x}" cy="${y}" r="2.6" class="rdot"/>`; }).join('');
    const done = s.ring.filter(m => m.status === 'mastered').length;
    return `<svg class="rose" viewBox="-122 -122 244 244" role="img" aria-label="${esc(c.name)}: ${done} of ${s.ring.length} ${CM.grade(c.grade).label} missions mastered" style="--c:var(--${c.color})">
      <circle r="117" class="rrim"/>${dots}${petals}
      <circle r="${r0 - 3}" class="rhub"/><text class="rletter" dy=".36em">${esc(c.name.charAt(0).toUpperCase())}</text></svg>`;
  }

  function weekBars(list, now) {
    const today = dayStart(now), days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const rows = days.map(d => list.map(s => ({ c: s.child, n: (s.days.get(d) || { n: 0 }).n })));
    const max = Math.max(5, ...rows.map(r => r.reduce((x, y) => x + y.n, 0)));
    return `<div class="wbars" role="img" aria-label="Problems per day, last 7 days: ${rows.map((r, i) => new Date(days[i]).toLocaleDateString('en-US', { weekday: 'short' }) + ' ' + r.reduce((x, y) => x + y.n, 0)).join(', ')}">
      ${rows.map((r, i) => { const tot = r.reduce((x, y) => x + y.n, 0); return `<div class="wb${days[i] === today ? ' today' : ''}"><div class="wb-col" style="--i:${i}">${r.filter(x => x.n).map(x => `<span style="height:${(100 * x.n / max).toFixed(1)}%;--c:var(--${x.c.color})"></span>`).join('')}</div><b>${tot || ''}</b><small>${new Date(days[i]).toLocaleDateString('en-US', { weekday: 'narrow' })}</small></div>`; }).join('')}
    </div>`;
  }

  function heatmap(list, now, color) {
    const weeks = 12, today = dayStart(now), dow = new Date(today).getDay();
    const start = addDays(today, -dow - (weeks - 1) * 7);
    const cells = [];
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(start, i);
      if (d > today) { cells.push('<span class="hc future"></span>'); continue; }
      const n = list.reduce((s, x) => s + (x.days.get(d) || { n: 0 }).n, 0);
      const lvl = n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 18 ? 3 : 4;
      cells.push(`<span class="hc l${lvl}${d === today ? ' now' : ''}" title="${new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}: ${plural(n, 'problem')}"></span>`);
    }
    const active = new Set(); list.forEach(x => x.days.forEach((v, k) => { if (k >= start) active.add(k); }));
    return `<div style="--hc:${color}"><div class="heat" role="img" aria-label="Practice calendar, last 12 weeks: practiced on ${active.size} days">${cells.join('')}</div>
      <div class="heat-legend"><span>12 weeks ago</span><span class="hl-scale"><small>Less</small>${[0, 1, 2, 3, 4].map(l => `<span class="hc l${l}"></span>`).join('')}<small>More</small></span><span>This week</span></div></div>`;
  }

  function accuracyChart(list, now) {
    const W = 640, H = 220, L = 38, R = 12, T = 14, B = 30, days = 28, today = dayStart(now);
    const x = i => L + (W - L - R) * i / (days - 1), y = v => T + (H - T - B) * (1 - v / 100);
    const grid = [0, 50, 75, 100].map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="gl"/><text x="${L - 8}" y="${y(v)}" dy=".32em" class="ax" text-anchor="end">${v}%</text>`).join('');
    const xl = [0, 7, 14, 21, 27].map(i => `<text x="${x(i)}" y="${H - 8}" class="ax" text-anchor="${i === 0 ? 'start' : i === 27 ? 'end' : 'middle'}">${i === 27 ? 'Today' : new Date(addDays(today, i - 27)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</text>`).join('');
    const series = list.map(s => {
      const pts = [];
      for (let i = 0; i < days; i++) { const v = s.days.get(addDays(today, i - 27)); if (v && v.n) pts.push({ i, v: Math.round(100 * v.clean / v.n), n: v.n }); }
      return { s, pts };
    }).filter(z => z.pts.length);
    if (!series.length) return '<p class="pd-empty">Once someone practices, this chart shows how often they get answers right without a hint.</p>';
    const area = series.length === 1 ? (() => { const p = series[0].pts; return `<path class="acc-area" style="--c:var(--${series[0].s.child.color})" d="M${x(p[0].i)} ${y(0)} ${p.map(q => `L${x(q.i)} ${y(q.v)}`).join(' ')} L${x(p[p.length - 1].i)} ${y(0)}Z"/>`; })() : '';
    const lines = series.map(({ s, pts }) => `<g style="--c:var(--${s.child.color})"><polyline class="acc-line" points="${pts.map(q => `${x(q.i)},${y(q.v)}`).join(' ')}"/>${pts.map(q => `<circle class="acc-pt" cx="${x(q.i)}" cy="${y(q.v)}" r="${q.n >= 10 ? 5 : 4}"><title>${esc(s.child.name)}, ${new Date(addDays(today, q.i - 27)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}: ${q.v}% without help (${plural(q.n, 'problem')})</title></circle>`).join('')}</g>`).join('');
    const legend = series.length > 1 ? `<div class="legend">${series.map(({ s }) => `<span><i style="--c:var(--${s.child.color})"></i>${esc(s.child.name)}</span>`).join('')}</div>` : '';
    const words = series.map(({ s, pts }) => { const n = pts.reduce((a, q) => a + q.n, 0), c = pts.reduce((a, q) => a + Math.round(q.v * q.n / 100), 0); return `${esc(s.child.name)} solved ${Math.round(100 * c / n)}% of ${n} problems without help`; }).join('; ');
    return `${legend}<svg class="acc" viewBox="0 0 ${W} ${H}" role="img" aria-label="Last 4 weeks: ${words}.">${grid}${xl}${area}${lines}</svg><p class="pd-note">${words} in the last 4 weeks.</p>`;
  }

  /* ---------- view ---------- */
  const icon = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 16.8l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/></svg>',
    flame: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 3.5 5.5 5.6 5.5 11a5.5 5.5 0 0 1-11 0c0-2.4 1-4 2.4-5.4.2 1.6 1 2.7 2.1 3.1C10.6 7.6 11 5 12 2z"/></svg>',
    target: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="1.8"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    up: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3"/></svg>'
  };
  const when = t => { if (!t) return ''; const d = Math.round((dayStart(Date.now()) - dayStart(t)) / DAY); return d <= 0 ? 'today' : d === 1 ? 'yesterday' : d < 7 ? 'on ' + new Date(t).toLocaleDateString('en-US', { weekday: 'long' }) : 'on ' + new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };
  const num = (v, fmt) => `<b class="num" data-count="${v}"${fmt ? ` data-fmt="${fmt}"` : ''}>${fmt === 'min' ? Math.round(v / 60) : v}</b>`;

  function highlights(list, now) {
    const out = [];
    list.forEach(s => {
      const n = s.child.name, recent = s.mastered.filter(m => m.at && now - m.at < 7 * DAY);
      recent.slice(0, 2).forEach(m => out.push({ k: 'star', c: s.child, t: `<b>${esc(n)}</b> mastered <b>${esc(m.title)}</b> ${when(m.at)}.` }));
      if (s.close) out.push({ k: 'up', c: s.child, t: `<b>${esc(n)}</b> is ${s.close.need === 1 ? 'one clean answer' : s.close.need + ' clean answers'} away from mastering <b>${esc(s.close.title)}</b>.` });
      if (s.week >= 8 && s.prevWeek >= 8 && s.weekAcc - s.prevAcc >= 5) out.push({ k: 'target', c: s.child, t: `<b>${esc(n)}</b> solved ${s.weekAcc}% without help this week, up from ${s.prevAcc}%.` });
      if (s.streak >= 3) out.push({ k: 'flame', c: s.child, t: `<b>${esc(n)}</b> has practiced ${s.streak} days in a row.` });
      if (!out.some(h => h.c === s.child) && s.week) {
        const cnt = {}; s.child.data.activity.filter(a => now - a.t < 7 * DAY).forEach(a => cnt[a.mission] = (cnt[a.mission] || 0) + 1);
        const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0], m = top && CM.mission(top[0]);
        if (m) out.push({ k: 'target', c: s.child, t: `<b>${esc(n)}</b> solved ${plural(s.week, 'problem')} this week, most of them in <b>${esc(m.title)}</b>.` });
      }
      if (s.needsWork[0]) out.push({ k: 'eye', c: s.child, t: `<b>${esc(n)}</b> needs help often on <b>${esc(s.needsWork[0].title)}</b>. A short session together could help.` });
    });
    return out.slice(0, 5);
  }

  function childCard(s, demo) {
    const c = s.child, G = CM.grade(c.grade), done = s.ring.filter(m => m.status === 'mastered').length;
    const last = c.data.activity.length ? c.data.activity[c.data.activity.length - 1].t : 0;
    const top = s.mistakes[0];
    return `<article class="kcard" style="--c:var(--${c.color})">
      <div class="kc-rose">${rose(s)}
        <ul class="rose-key" aria-label="Petal key"><li><i class="k-m"></i>Mastered</li><li><i class="k-p"></i>Practicing</li><li><i class="k-r"></i>Not started</li></ul></div>
      <div class="kc-body">
        <header><h3>${esc(c.name)}</h3><p>${G.label} · ${last ? 'active ' + when(last) : 'not started yet'}</p></header>
        <p class="kc-lead">${s.ring.length ? `<b>${done}</b> of ${s.ring.length} ${G.label} missions mastered` : `No ${G.label} missions yet`}</p>
        <dl class="kstats">
          <div><dt>${icon.target}Without help</dt><dd>${s.accuracy === null ? '–' : num(s.accuracy) + '<small>%</small>'}</dd></div>
          <div><dt>${icon.flame}Streak</dt><dd>${num(s.streak)}<small>${s.streak === 1 ? 'day' : 'days'}</small></dd></div>
          <div><dt>${icon.star}This week</dt><dd>${num(s.week)}<small>problems</small></dd></div>
          <div><dt>${icon.clock}All time</dt><dd>${s.total ? fmtTime(s.totalSeconds) : '–'}</dd></div>
        </dl>
        <ul class="kc-notes">
          ${s.mastered[0] ? `<li class="n-star">${icon.star}<span><b>Latest win:</b> ${esc(s.mastered[0].title)}${s.mastered[0].at ? ', ' + when(s.mastered[0].at) : ''}</span></li>` : ''}
          ${s.next[0] ? `<li class="n-up">${icon.up}<span><b>Up next:</b> ${esc(s.next[0].title)} <small>(${esc(s.next[0].why)})</small></span></li>` : ''}
          ${top ? `<li class="n-eye">${icon.eye}<span><b>Watch for:</b> ${esc(top.tag.charAt(0).toLowerCase() + top.tag.slice(1))} <small>(${top.n}×)</small></span></li>` : ''}
        </ul>
        ${demo ? '' : `<div class="kc-actions"><a class="btn btn-ghost sm" href="#report-${c.id}">Full report</a><button type="button" class="btn btn-primary sm" data-app="pick" data-id="${c.id}">Learn as ${esc(c.name)}</button></div>`}
      </div>
    </article>`;
  }

  function stumbles(list) {
    const all = list.flatMap(s => s.mistakes.slice(0, 6).map(m => ({ ...m, c: s.child }))).sort((a, b) => b.n - a.n).slice(0, 6);
    if (!all.length) return '<p class="pd-empty">No mistakes recorded yet. When a child needs a second try or a hint, the app notes what went wrong here.</p>';
    const max = all[0].n;
    return `<ol class="stum">${all.map(m => `<li style="--c:var(--${m.c.color})"><div class="st-top"><span>${esc(m.tag)}</span><b>${m.n}×</b></div>
      <div class="st-bar"><span style="width:${(100 * m.n / max).toFixed(0)}%"></span></div>
      <small>${list.length > 1 ? esc(m.c.name) + ' · ' : ''}${esc((CM.mission(m.mission) || { title: m.mission }).title)} · last ${when(m.last)}</small></li>`).join('')}</ol>`;
  }

  P.render = function (opts) {
    const demo = !!(opts && opts.demo), now = Date.now();
    const run = () => {
      const kids = CM.store.children();
      if (P.focus !== 'all' && !kids.some(k => k.id === P.focus)) P.focus = 'all';
      const all = kids.map(c => CM.store.withChild(c.id, () => P.stats(c, now)));
      const list = P.focus === 'all' ? all : all.filter(s => s.child.id === P.focus);
      return { kids, all, list };
    };
    const { kids, all, list } = demo ? P.withFamily(P._demo || (P._demo = P.demoFamily(now)), run) : run();
    const sum = k => list.reduce((s, x) => s + x[k], 0);
    const week = sum('week'), prev = sum('prevWeek'), secs = sum('weekSeconds');
    const streak = list.length ? Math.max(...list.map(s => s.streak)) : 0;
    const masteredN = list.reduce((s, x) => s + x.mastered.length, 0);
    const delta = prev ? Math.round(100 * (week - prev) / prev) : null;
    const today = new Date(now), weekOf = new Date(addDays(dayStart(now), -6));
    const hl = highlights(list, now);
    const focusKid = P.focus === 'all' ? null : kids.find(k => k.id === P.focus);
    const heatColor = focusKid ? `var(--${focusKid.color})` : 'var(--pd-gold)';

    const tabs = kids.length > 1 ? `<div class="pd-tabs" role="group" aria-label="Show">${[{ id: 'all', name: 'Everyone' }, ...kids].map(k => `<button type="button" data-app="pd-focus" data-id="${k.id}" aria-pressed="${P.focus === k.id}"${k.color ? ` style="--c:var(--${k.color})"` : ''}>${k.color ? `<i></i>` : ''}${esc(k.name)}</button>`).join('')}</div>` : '';

    const hero = `<section class="pd-hero">
      <div class="pd-hero-top">
        <div><p class="pd-eyebrow">Parents & Teachers${demo ? ' · sample family' : ''}</p>
          <h1>${kids.length ? (focusKid ? esc(focusKid.name) + '’s week' : 'Your family’s week') : 'Family dashboard'}</h1>
          <p class="pd-sub">${weekOf.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${plural(kids.length, 'child', 'children')}</p></div>
        ${tabs}
      </div>
      ${kids.length ? `<div class="pd-kpis">
        <div class="kpi"><span class="kpi-l">Problems this week</span>${num(week)}<span class="kpi-d${delta === null ? '' : delta >= 0 ? ' up' : ' down'}">${delta === null ? 'First week of data' : delta === 0 ? 'Same as last week' : `${delta > 0 ? '+' : ''}${delta}% vs. last week`}</span></div>
        <div class="kpi"><span class="kpi-l">Time practicing</span><span class="kpi-v">${num(secs, 'min')}<small>min</small></span><span class="kpi-d">Estimated from answer times</span></div>
        <div class="kpi"><span class="kpi-l">Missions mastered</span>${num(masteredN)}<span class="kpi-d">All time</span></div>
        <div class="kpi"><span class="kpi-l">Longest streak now</span><span class="kpi-v">${num(streak)}<small>${streak === 1 ? 'day' : 'days'}</small></span><span class="kpi-d">${streak ? 'Practice today to keep it going' : 'Start one today'}</span></div>
      </div>
      <div class="pd-hero-bottom">
        <div class="pd-week"><p class="pd-eyebrow">Last 7 days</p>${weekBars(list, now)}</div>
        <div class="pd-hl"><p class="pd-eyebrow">Highlights</p>${hl.length ? `<ul>${hl.map(h => `<li class="h-${h.k}" style="--c:var(--${h.c.color})">${icon[h.k]}<span>${h.t}</span></li>`).join('')}</ul>` : '<p class="pd-quiet">Highlights appear after a few practice sessions.</p>'}</div>
      </div>` : `<div class="pd-start"><p>Add a child to start tracking practice. Progress stays in this browser.</p><div class="actions"><a class="btn pd-btn-gold" href="#profiles" data-app="add-go">Add a child</a><a class="btn pd-btn-glass" href="#family-demo">See it with a sample family</a></div></div>`}
    </section>`;

    if (!kids.length) return `<div class="pd">${hero}</div>`;

    return `<div class="pd">
      ${demo ? `<div class="pd-demo" role="note"><span><b>Sample family.</b> Lucy and Mateo are made up, so you can see the dashboard with a few weeks of practice. Nothing here is saved.</span><a class="btn btn-ghost sm" href="#family">Back to my family</a></div>` : ''}
      ${hero}
      <section aria-labelledby="pd-kids"><h2 id="pd-kids" class="pd-h2">Each child</h2>
        <p class="pd-note">Each petal is one ${list.length > 1 ? 'grade-level ' : ''}mission. It fills in as the child moves up levels and turns solid with a star when mastered.</p>
        <div class="kgrid">${list.map(s => childCard(s, demo)).join('')}</div></section>
      <div class="pd-row">
        <section class="pd-card" aria-labelledby="pd-acc"><h2 id="pd-acc" class="pd-h2">Getting it on their own</h2><p class="pd-note">Share of each day’s problems solved on the first try, without a hint.</p>${accuracyChart(list, now)}</section>
        <section class="pd-card" aria-labelledby="pd-heat"><h2 id="pd-heat" class="pd-h2">Practice rhythm</h2><p class="pd-note">Short sessions on most days work better than one long session a week.</p>${heatmap(list, now, heatColor)}</section>
      </div>
      <section class="pd-card" aria-labelledby="pd-stum"><h2 id="pd-stum" class="pd-h2">Where they stumble</h2><p class="pd-note">The most frequent mistakes, so you know what to talk through at the kitchen table.</p>${stumbles(list)}</section>
      ${demo ? '' : `<div class="pd-actions"><a class="btn btn-primary" href="#profiles" data-app="add-go">Add child</a><a class="btn btn-ghost" href="#profiles">Manage profiles</a><a class="btn btn-ghost" href="#family-demo">View sample family</a></div>`}
      <p class="muted small">All profiles and progress live in this browser only. Another browser, another device, or a cleared cache starts empty.</p>
    </div>`;
  };

  /* Count-up for numbers, skipped when the reader prefers reduced motion. */
  P.after = function (root) {
    if (!root || typeof window === 'undefined' || !window.requestAnimationFrame) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const els = [...root.querySelectorAll('.num[data-count]')];
    const t0 = performance.now(), dur = 900;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      els.forEach(el => { const v = +el.dataset.count * e; el.textContent = el.dataset.fmt === 'min' ? Math.round(v / 60) : Math.round(v); });
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
})(typeof window !== 'undefined' ? (window.CM = window.CM || {}) : (global.CM = global.CM || {}));
