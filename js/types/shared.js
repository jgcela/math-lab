/* Shared visual models used by several mission types and by the Math Lab. */
(function (CM) {
  'use strict';
  const { frac } = CM.h;
  CM.TYPES = CM.TYPES || {};
  const V = CM.viz = {};

  /* Fraction bars */
  const BAR_COLORS = { 1: '--t6', 2: '--t1', 3: '--t3', 4: '--t2', 5: '--t5', 6: '--t4', 7: '--t6', 8: '--t6', 9: '--t3', 10: '--t1', 11: '--t5', 12: '--t4' };
  V.barColor = d => `var(${BAR_COLORS[d] || '--t4'})`;
  V.bar = function (n, shaded, opts = {}) {
    let s = `<div class="bar${opts.live ? ' is-live' : ''}" style="--tile:${V.barColor(n)}" role="group" aria-label="${opts.label || ''}">`;
    for (let i = 0; i < n; i++) {
      const on = shaded.has(i);
      s += opts.live
        ? `<button type="button" class="seg${on ? ' on' : ''}" data-act="seg" data-i="${i}" ${opts.key ? `data-key="${opts.key}"` : ''} aria-pressed="${on}" aria-label="Piece ${i + 1} of ${n}"${opts.disabled ? ' disabled' : ''}></button>`
        : `<span class="seg${on ? ' on' : ''}"></span>`;
    }
    return s + '</div>';
  };

  /* Place value */
  V.NAMES = ['ones', 'tens', 'hundreds', 'thousands', 'ten thousands'];
  V.ONE = ['one', 'ten', 'hundred', 'thousand', 'ten thousand'];
  V.HEAD = ['Ones', 'Tens', 'Hundreds', 'Thousands', 'Ten thousands'];
  V.digits = (n, p) => Array.from({ length: p }, (_, i) => Math.floor(n / 10 ** i) % 10);
  V.fromDigits = d => d.reduce((s, v, i) => s + v * 10 ** i, 0);
  V.len = n => String(n).length;

  V.addWork = function (x, y) {
    const p = V.len(x + y), a = V.digits(x, p), b = V.digits(y, p), res = [], cin = [], notes = [];
    let c = 0;
    for (let i = 0; i < p; i++) {
      const s = a[i] + b[i] + c; cin[i] = c; res[i] = s % 10;
      if (s >= 10) notes.push(`${V.HEAD[i]}: ${a[i]} + ${b[i]}${c ? ' + 1' : ''} = ${s}. Write ${s % 10} and trade 10 ${V.NAMES[i]} for 1 ${V.ONE[i + 1]}.`);
      c = s >= 10 ? 1 : 0;
    }
    return { p, a, b, res, cin, notes };
  };
  V.subWork = function (x, y) {
    const p = V.len(x), top = V.digits(x, p), bot = V.digits(y, p), reg = [...top], notes = [];
    for (let i = 0; i < p; i++) {
      if (reg[i] < bot[i]) {
        let j = i + 1; while (reg[j] === 0) j++;
        reg[j]--; for (let k = j - 1; k > i; k--) reg[k] += 9;
        reg[i] += 10;
        notes.push(j === i + 1
          ? `${V.HEAD[i]}: you can't take ${bot[i]} from ${top[i]}, so break 1 ${V.ONE[j]} into 10 ${V.NAMES[i]}. Now ${reg[i]} \u2212 ${bot[i]} = ${reg[i] - bot[i]}.`
          : `${V.HEAD[i]}: there are no ${V.NAMES[i + 1]} to break, so break 1 ${V.ONE[j]} into 10 ${V.NAMES[j - 1]}, and keep breaking down until you have 10 more ${V.NAMES[i]}.`);
      }
    }
    return { p, top, bot, reg, res: reg.map((v, i) => v - bot[i]), notes };
  };
  const cell = (v, show) => show ? v : '';
  V.addChart = function (x, y) {
    const w = V.addWork(x, y), idx = [...Array(w.p).keys()].reverse();
    return `<div class="chart"><table>
      <tr><th></th>${idx.map(i => `<th scope="col">${V.HEAD[i]}</th>`).join('')}</tr>
      <tr><th scope="row">Traded</th>${idx.map(i => `<td class="hl small">${w.cin[i] ? '+1' : ''}</td>`).join('')}</tr>
      <tr><th scope="row">${x}</th>${idx.map(i => `<td>${cell(w.a[i], i < V.len(x))}</td>`).join('')}</tr>
      <tr><th scope="row">+ ${y}</th>${idx.map(i => `<td>${cell(w.b[i], i < V.len(y))}</td>`).join('')}</tr>
      <tr class="total"><th scope="row">=</th>${idx.map(i => `<td>${w.res[i]}</td>`).join('')}</tr>
    </table></div>${w.notes.length ? `<ul class="notes">${w.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : `<p class="notes">No trades needed: every place adds up to 9 or less.</p>`}`;
  };
  V.subChart = function (x, y) {
    const w = V.subWork(x, y), idx = [...Array(w.p).keys()].reverse();
    const traded = w.reg.some((v, i) => v !== w.top[i]), resLen = V.len(x - y);
    return `<div class="chart"><table>
      <tr><th></th>${idx.map(i => `<th scope="col">${V.HEAD[i]}</th>`).join('')}</tr>
      <tr><th scope="row">Start</th>${idx.map(i => `<td>${w.top[i]}</td>`).join('')}</tr>
      ${traded ? `<tr><th scope="row">After trading</th>${idx.map(i => `<td class="${w.reg[i] !== w.top[i] ? 'hl' : ''}">${w.reg[i]}</td>`).join('')}</tr>` : ''}
      <tr><th scope="row">Take away</th>${idx.map(i => `<td>${cell(w.bot[i], i < V.len(y))}</td>`).join('')}</tr>
      <tr class="total"><th scope="row">=</th>${idx.map(i => `<td>${cell(w.res[i], i < resLen)}</td>`).join('')}</tr>
    </table></div>${w.notes.length ? `<ul class="notes">${w.notes.map(n => `<li>${n}</li>`).join('')}</ul>` : `<p class="notes">No trades needed: every top digit is big enough.</p>`}`;
  };
  V.blocks = function (n) {
    const th = Math.floor(n / 1000), h = Math.floor(n / 100) % 10, t = Math.floor(n / 10) % 10, o = n % 10;
    let s = `<div class="blocks" role="img" aria-label="${th ? th + ' thousands, ' : ''}${h} hundreds, ${t} tens, ${o} ones">`;
    if (th) s += `<div class="grp">${'<span class="thou"></span>'.repeat(th)}</div>`;
    if (h) s += `<div class="grp">${'<span class="hund"></span>'.repeat(h)}</div>`;
    if (t) s += `<div class="grp">${'<span class="ten"></span>'.repeat(t)}</div>`;
    if (o) s += `<div class="grp ones">${'<span class="one"></span>'.repeat(o)}</div>`;
    if (!n) s += `<span class="muted">0</span>`;
    return s + '</div>';
  };
  V.legend = (thousands) => `<div class="legend" aria-hidden="true">${thousands ? '<span><i class="lg-thou"></i>thousand</span>' : ''}<span><i class="lg-hund"></i>hundred</span><span><i class="lg-ten"></i>ten</span><span><i class="lg-one"></i>one</span></div>`;
  V.answerBox = (label, r, max) => `<div class="eq"><label for="ans">${label} =</label><input class="ans" id="ans" data-field="answer" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="${max || 5}" value="${r.answer || ''}"${r.solved ? ' disabled' : ''}></div>`;
  V.stepper = (label, key, val, min, max, disabled, unit) =>
    `<div class="stepper"><span class="st-label">${label}</span><button type="button" class="step" data-act="${key}-" aria-label="Decrease ${label}"${val <= min || disabled ? ' disabled' : ''}>\u2212</button><output>${val}</output><button type="button" class="step" data-act="${key}+" aria-label="Increase ${label}"${val >= max || disabled ? ' disabled' : ''}>+</button>${unit ? `<span>${unit}</span>` : ''}</div>`;
  V.frac = frac;
})(typeof window !== 'undefined' ? window.CM : global.CM);
