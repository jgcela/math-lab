/* Math Lab: open-ended manipulatives with no scoring. */
(function (CM) {
  'use strict';
  const { frac, range, clamp, esc } = CM.h, V = CM.viz;
  const L = CM.Lab = {};
  const S = {
    'fraction-bars': { bars: [{ n: 4, on: range(3) }, { n: 8, on: range(6) }] },
    'base-ten': { p: [5, 4, 3, 0] },
    'number-line': { mode: 'whole', den: 4, pts: new Set() },
    balance: { a: 3, b: 4, c: 0, d: 19, x: 5 }
  };
  let tool = null, root = null, focusSel = null;

  L.open = function (id, el) { tool = id; root = el; render(); };
  L.close = () => { tool = null; };
  L.active = () => !!tool;

  const cmp = (a, b, c, d) => { const x = a * d - c * b; return x > 0 ? '>' : x < 0 ? '<' : '='; };

  function view() {
    if (tool === 'fraction-bars') {
      const st = S[tool];
      const rows = st.bars.map((b, k) => `<div class="labrow">
          <div class="row"><span class="lab">${frac(b.on.size, b.n)}</span><div class="barwrap">${V.bar(b.n, b.on, { live: true, key: k, label: `Bar ${k + 1}` })}</div></div>
          <div class="steppers">${V.stepper('Pieces', 'n' + k, b.n, 1, 12)}${st.bars.length > 1 ? `<button type="button" class="btn btn-ghost sm" data-act="rm" data-k="${k}">Remove bar</button>` : ''}</div>
        </div>`).join('');
      const a = st.bars[0], b = st.bars[1];
      const sentence = b ? `<p class="tally">${frac(a.on.size, a.n)} ${cmp(a.on.size, a.n, b.on.size, b.n)} ${frac(b.on.size, b.n)}</p>` : '';
      return `<p class="sub">Change the number of pieces, tap pieces to color them, and compare the bars. All bars are the same whole.</p>
        <div class="mat lab-bars">${rows}</div>${sentence}
        ${st.bars.length < 3 ? '<div class="actions"><button type="button" class="btn btn-ghost" data-act="add">Add a bar</button></div>' : ''}`;
    }
    if (tool === 'base-ten') {
      const p = S[tool].p, val = p[0] + 10 * p[1] + 100 * p[2] + 1000 * p[3];
      const names = ['Ones', 'Tens', 'Hundreds', 'Thousands'];
      const expanded = [3, 2, 1, 0].filter(i => p[i]).map(i => p[i] * 10 ** i).join(' + ') || '0';
      const blocks = [3, 2, 1, 0].map(i => {
        const cls = ['one', 'ten', 'hund', 'thou'][i];
        return `<div class="pv-col"><p class="eyebrow">${names[i]}</p><div class="grp${i === 0 ? ' ones' : ''}">${`<span class="${cls}"></span>`.repeat(p[i])}</div>
          ${V.stepper(names[i], 'p' + i, p[i], 0, 19)}</div>`;
      }).join('');
      return `<p class="sub">Add and remove blocks. Trade when a place has 10 or more.</p>
        <p class="big">${val.toLocaleString('en-US')}</p>
        <p class="tally">Expanded form: ${expanded}</p>
        <div class="pv">${blocks}</div>
        <div class="actions">
          ${[0, 1, 2].map(i => `<button type="button" class="btn btn-ghost sm" data-act="up" data-i="${i}"${p[i] < 10 || p[i + 1] >= 19 ? ' disabled' : ''}>Trade 10 ${names[i].toLowerCase()} \u2192 1 ${['ten', 'hundred', 'thousand'][i]}</button>`).join('')}
          ${[1, 2, 3].map(i => `<button type="button" class="btn btn-ghost sm" data-act="down" data-i="${i}"${p[i] < 1 || p[i - 1] > 9 ? ' disabled' : ''}>Break 1 ${['', 'ten', 'hundred', 'thousand'][i]} \u2192 10 ${names[i - 1].toLowerCase()}</button>`).join('')}
        </div>`;
    }
    if (tool === 'number-line') {
      const st = S[tool];
      let ticks = [];
      if (st.mode === 'whole') ticks = Array.from({ length: 21 }, (_, i) => ({ v: i, n: i, d: 1, label: String(i) }));
      else if (st.mode === 'int') ticks = Array.from({ length: 21 }, (_, i) => ({ v: i - 10, n: i - 10, d: 1, label: String(i - 10) }));
      else ticks = Array.from({ length: 2 * st.den + 1 }, (_, i) => ({ v: i / st.den, n: i, d: st.den, label: i % st.den === 0 ? String(i / st.den) : `${i}/${st.den}` }));
      const pts = [...st.pts].sort((a, b) => a - b);
      const show = v => { const t = ticks.find(t => Math.abs(t.v - v) < 1e-9); return t ? (t.d === 1 || t.n % t.d === 0 ? String(t.v) : frac(t.n, t.d)) : v; };
      return `<div class="seg-group" role="group" aria-label="Number line type">
          ${[['whole', 'Whole numbers'], ['frac', 'Fractions'], ['int', 'Integers']].map(([k, l]) => `<button type="button" class="segbtn${st.mode === k ? ' picked' : ''}" data-act="mode" data-m="${k}" aria-pressed="${st.mode === k}">${l}</button>`).join('')}
        </div>
        ${st.mode === 'frac' ? V.stepper('Equal parts in each whole', 'den', st.den, 2, 12) : ''}
        <p class="sub">Tap a mark to place a point. Tap it again to remove it.</p>
        <div class="nline-wrap"><div class="nline" style="--n:${ticks.length}">
          ${ticks.map(t => `<button type="button" class="tick${st.pts.has(t.v) ? ' on' : ''}${(t.d === 1 || t.n % t.d === 0) ? ' major' : ''}" data-act="pt" data-v="${t.v}" aria-pressed="${st.pts.has(t.v)}" aria-label="${t.label}"><span class="mk"></span><span class="tl">${(t.d === 1 || t.n % t.d === 0 || st.den <= 6) ? t.label : ''}</span></button>`).join('')}
        </div></div>
        <p class="tally">${pts.length ? `Points from least to greatest: ${pts.map(show).join(' &lt; ')}` : 'No points placed yet.'}</p>`;
    }
    if (tool === 'balance') {
      const b = S[tool], left = b.a * b.x + b.b, right = b.c * b.x + b.d;
      const tilt = left === right ? 0 : left > right ? 1 : -1;
      const H = CM.balanceHelpers;
      return `<p class="sub">Build both sides of an equation and choose a secret value for x. The balance shows whether the equation is true for that value.</p>
        <p class="big eqline">${H.side(b.a, b.b)} = ${H.side(b.c, b.d)}</p>
        ${V.balance({ a: b.a, b: b.b, c: b.c, d: b.d }, tilt)}
        <p class="tally">${left === right ? `Level. When x = ${b.x}, both sides equal ${left}, so the equation is true.` : `Not level. When x = ${b.x}, the left side is ${left} and the right side is ${right}.`}</p>
        <div class="steppers">${V.stepper('Left x-boxes', 'a', b.a, 0, 9)}${V.stepper('Left weights', 'b', b.b, 0, 30)}${V.stepper('Right x-boxes', 'c', b.c, 0, 9)}${V.stepper('Right weights', 'd', b.d, 0, 30)}${V.stepper('Secret x', 'x', b.x, 0, 12)}</div>`;
    }
    return '';
  }

  function render() {
    if (!tool || !root) return;
    const meta = CM.LAB_TOOLS.find(t => t.id === tool);
    root.innerHTML = `<p class="eyebrow"><a href="#lab">Math Lab</a></p><h1 class="mtitle">${esc(meta.title)}</h1><section class="card">${view()}</section>`;
    if (focusSel) { const el = root.querySelector(focusSel); if (el) el.focus({ preventScroll: true }); focusSel = null; }
  }

  L.onClick = function (ev) {
    if (!tool) return false;
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled || !root.contains(el)) return false;
    const act = el.dataset.act, st = S[tool];
    focusSel = el.id ? '#' + el.id : `[data-act="${act}"]${el.dataset.i !== undefined ? `[data-i="${el.dataset.i}"]` : ''}${el.dataset.key !== undefined ? `[data-key="${el.dataset.key}"]` : ''}${el.dataset.v !== undefined ? `[data-v="${el.dataset.v}"]` : ''}${el.dataset.m ? `[data-m="${el.dataset.m}"]` : ''}`;
    let m;
    if (tool === 'fraction-bars') {
      if (act === 'seg') { const b = st.bars[+el.dataset.key], i = +el.dataset.i; b.on.has(i) ? b.on.delete(i) : b.on.add(i); }
      else if ((m = act.match(/^n(\d)([+-])$/))) { const b = st.bars[+m[1]]; b.n = clamp(b.n + (m[2] === '+' ? 1 : -1), 1, 12); b.on = new Set([...b.on].filter(i => i < b.n)); }
      else if (act === 'add') { st.bars.push({ n: 3, on: new Set() }); focusSel = null; }
      else if (act === 'rm') { st.bars.splice(+el.dataset.k, 1); focusSel = null; }
      else return false;
    } else if (tool === 'base-ten') {
      if ((m = act.match(/^p(\d)([+-])$/))) st.p[+m[1]] = clamp(st.p[+m[1]] + (m[2] === '+' ? 1 : -1), 0, 19);
      else if (act === 'up') { const i = +el.dataset.i; st.p[i] -= 10; st.p[i + 1] += 1; }
      else if (act === 'down') { const i = +el.dataset.i; st.p[i] -= 1; st.p[i - 1] += 10; }
      else return false;
    } else if (tool === 'number-line') {
      if (act === 'mode') { st.mode = el.dataset.m; st.pts = new Set(); }
      else if (act === 'den+' || act === 'den-') { st.den = clamp(st.den + (act === 'den+' ? 1 : -1), 2, 12); st.pts = new Set(); }
      else if (act === 'pt') { const v = +el.dataset.v; st.pts.has(v) ? st.pts.delete(v) : st.pts.add(v); }
      else return false;
    } else if (tool === 'balance') {
      if ((m = act.match(/^([abcdx])([+-])$/))) { const lim = { a: 9, b: 30, c: 9, d: 30, x: 12 }[m[1]]; st[m[1]] = clamp(st[m[1]] + (m[2] === '+' ? 1 : -1), 0, lim); }
      else return false;
    }
    render();
    return true;
  };
})(window.CM);
