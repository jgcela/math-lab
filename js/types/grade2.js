/* Grade 2 addition and subtraction (2.I.B.1, 2.I.B.3, 2.I.B.4, 2.I.B.5).
 * The order follows the document: models first (2.I.B.1 "use concrete objects"), then the written column method.
 *   blockAdd  - put two numbers together with base-ten blocks and trade 10 ones for 1 ten.
 *   blockSub  - start with one number, break a ten into 10 ones when needed, and tap blocks to take them away.
 *   colAdd    - add in columns, writing the little 1 above the next place.
 *   colSub    - subtract in columns, tapping a digit to regroup it into the place on its right. */
(function (CM) {
  'use strict';
  const V = CM.viz, T = CM.TYPES;
  const PLACE = ['o', 't', 'h'];
  const split = n => ({ h: Math.floor(n / 100), t: Math.floor(n / 10) % 10, o: n % 10 });
  const valueOf = s => s.h * 100 + s.t * 10 + s.o;

  /* Error tags shared by the block and column versions, so the parent dashboard groups them together. */
  function addMistake(x, y, n) {
    const p = V.len(x + y), a = V.digits(x, p), b = V.digits(y, p);
    const noCarry = V.fromDigits(a.map((v, i) => (v + b[i]) % 10));
    const concat = parseInt(a.map((v, i) => v + b[i]).reverse().join('').replace(/^0+/, '') || '0', 10);
    if (n === noCarry && noCarry !== x + y) return { err: 'nocarry', tag: 'Forgot to trade 10 ones for a ten (or 10 tens for a hundred)' };
    if (n === concat && concat !== x + y) return { err: 'concat', tag: 'Wrote a two-digit column sum in one place' };
    if (Math.abs(n - (x + y)) === 1) return { err: 'off1', tag: 'Added and was off by one' };
    return { err: 'other', tag: 'Added incorrectly' };
  }
  function subMistake(x, y, n) {
    const p = V.len(x), a = V.digits(x, p), b = V.digits(y, p);
    const flip = V.fromDigits(a.map((v, i) => Math.abs(v - b[i])));
    const noReduce = V.fromDigits(a.map((v, i) => v < b[i] ? v + 10 - b[i] : v - b[i]));
    if (n === flip && flip !== x - y) return { err: 'flip', tag: 'Subtracted the smaller digit from the bigger one in each place' };
    if (n === noReduce && noReduce !== x - y) return { err: 'noreduce', tag: 'Broke a ten into ones without taking it away from the tens' };
    if (n === x + y) return { err: 'added', tag: 'Added instead of subtracting' };
    return { err: 'other', tag: 'Subtracted incorrectly' };
  }


  /* ---------- random problems ----------
   * Each grade 2 mission draws a new problem for its level, so answers can't be remembered.
   * Every level keeps one rule (no trade / make a ten / two-digit trade / three digits), checked in the tests.
   * The fixed items in curriculum.js stay as examples of each level and as test cases. */
  const R = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
  const oc = (x, y) => x % 10 + y % 10 >= 10;                         // ones carry
  const tc = (x, y) => Math.floor(x / 10) % 10 + Math.floor(y / 10) % 10 + (oc(x, y) ? 1 : 0) >= 10; // tens carry
  const ob = (x, y) => x % 10 < y % 10;                               // ones borrow
  const RULES = {
    add: {
      1: [rng => [R(rng, 1, 8), R(rng, 1, 8)], rng => [R(rng, 11, 89), R(rng, 1, 9)], rng => [R(rng, 11, 79), R(rng, 11, 79)]],
      2: [rng => [R(rng, 2, 9), R(rng, 2, 9)], rng => [R(rng, 11, 89), R(rng, 2, 9)]],
      3: [rng => [R(rng, 11, 79), R(rng, 11, 79)]],
      4: [rng => [R(rng, 25, 99), R(rng, 25, 99)], rng => [R(rng, 101, 799), R(rng, 15, 99)]],
      colAdd: { 1: [rng => [R(rng, 11, 79), R(rng, 11, 79)]], 2: [rng => [R(rng, 11, 89), R(rng, 2, 9)]], 3: [rng => [R(rng, 11, 79), R(rng, 11, 79)]], 4: [rng => [R(rng, 101, 599), R(rng, 101, 399)]] }
    },
    sub: {
      1: [rng => { const x = R(rng, 2, 9); return [x, R(rng, 1, x - 1)]; }, rng => [R(rng, 11, 99), R(rng, 1, 9)], rng => { const x = R(rng, 21, 99); return [x, R(rng, 10, x - 10)]; }],
      2: [rng => [R(rng, 11, 18), R(rng, 2, 9)], rng => [R(rng, 20, 99), R(rng, 2, 9)]],
      3: [rng => { const x = R(rng, 30, 99); return [x, R(rng, 11, x - 11)]; }],
      4: [rng => [R(rng, 101, 509), R(rng, 15, 99)], rng => { const h = R(rng, 1, 5); return [h * 100 + R(rng, 0, 9), R(rng, 15, 99)]; }],
      colSub: { 1: [rng => { const x = R(rng, 21, 99); return [x, R(rng, 10, x - 10)]; }, rng => [R(rng, 11, 99), R(rng, 1, 9)]], 2: [rng => [R(rng, 20, 99), R(rng, 2, 9)]], 3: [rng => { const x = R(rng, 30, 99); return [x, R(rng, 11, x - 11)]; }],
        4: [rng => { const h = R(rng, 2, 9); return [h * 100 + R(rng, 0, 9), R(rng, 101, h * 100 - 1)]; }] }
    }
  };
  /* The rule each level must satisfy. */
  CM.G2_OK = {
    add(t, x, y) {
      const s = x + y;
      if (t === 1) return !oc(x, y) && s < 100;
      if (t === 2) return oc(x, y) && s < 100 && (x < 10 || y < 10);
      if (t === 3) return oc(x, y) && s < 100 && x >= 11 && y >= 11;
      return oc(x, y) && tc(x, y) && s >= 100 && s < 1000;
    },
    sub(t, x, y) {
      if (y < 1 || y >= x) return false;
      if (t === 1) return !ob(x, y) && Math.floor(x / 10) % 10 >= Math.floor(y / 10) % 10 && x < 100;
      if (t === 2) return ob(x, y) && x < 100 && y < 10;
      if (t === 3) return ob(x, y) && x < 100 && y >= 11;
      return ob(x, y) && x >= 100 && x < 1000 && x - y >= 10;
    }
  };
  CM.G2_GEN = { blockAdd: 'add', colAdd: 'add', blockSub: 'sub', colSub: 'sub' };
  CM.genItem = function (mission, tier, prev, rng) {
    rng = rng || Math.random;
    const op = CM.G2_GEN[mission.type], set = RULES[op][mission.type] || RULES[op];
    const makers = set[tier] || set[3];
    for (let n = 0; n < 500; n++) {
      const [x, y] = makers[R(rng, 0, makers.length - 1)](rng);
      if (!CM.G2_OK[op](tier, x, y)) continue;
      if (prev && ((prev.x === x && prev.y === y) || (op === 'add' ? prev.x + prev.y === x + y : prev.x - prev.y === x - y))) continue;
      return { tier, x, y };
    }
    return mission.items.find(i => i.tier === tier) || mission.items[0];
  };

  /* ---------- blocks: one mat of hundreds, tens, and ones ---------- */
  const NAME = { h: ['hundred', 'hundreds'], t: ['ten', 'tens'], o: ['one', 'ones'] };
  const nm = (k, n) => NAME[k][n === 1 ? 0 : 1];
  /* gone = how many blocks of each kind are crossed out (subtraction only). */
  function mat(s, opts = {}) {
    const gone = opts.gone || { h: 0, t: 0, o: 0 }, live = opts.live && !opts.disabled;
    const piece = (k, i, n) => {
      const out = i >= n - gone[k];
      const cls = { h: 'hund', t: 'ten', o: 'one' }[k] + (out ? ' out' : '');
      return live
        ? `<button type="button" class="g2b ${cls}" data-act="take" data-k="${k}" data-i="${i}" aria-label="${out ? 'Put back' : 'Take away'} a ${NAME[k][0]}" aria-pressed="${out}"></button>`
        : `<span class="g2b ${cls}"></span>`;
    };
    const col = (k) => {
      const n = s[k];
      let pcs = '';
      for (let i = 0; i < n; i++) pcs += piece(k, i, n);
      const ten = k === 'o' && n >= 10 && !opts.live ? ' g2-full' : '';
      return `<div class="g2-col g2-${k}${ten}"><p class="g2-head">${V.HEAD[PLACE.indexOf(k)]}</p><div class="g2-pile">${pcs}</div>
        <p class="g2-count">${n - (gone[k] || 0)}${gone[k] ? ` <small>(${gone[k]} taken)</small>` : ''}</p></div>`;
    };
    const keys = opts.hundreds ? ['h', 't', 'o'] : ['t', 'o'];
    return `<div class="g2-mat" role="group" aria-label="${keys.map(k => `${s[k] - (gone[k] || 0)} ${nm(k, s[k] - (gone[k] || 0))}`).join(', ')}">${keys.map(col).join('')}</div>`;
  }

  T.blockAdd = {
    init(r) { r.s = { h: 0, t: 0, o: 0 }; const a = split(r.item.x), b = split(r.item.y); PLACE.forEach(k => { r.s[k] = a[k] + b[k]; }); r.answer = ''; r.trades = 0; },
    text(r) { return `${r.item.x} + ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item, s = r.s, dis = r.solved ? ' disabled' : '', big = x + y >= 100;
      const tradeO = s.o >= 10, tradeT = s.t >= 10;
      return `<p class="prompt">${x} + ${y} = ?</p>
        <p class="sub">${r.trades || (!tradeO && !tradeT) ? 'Count the tens, then the ones. Type the total.' : 'All the blocks are together. When you have 10 or more ones, trade 10 ones for 1 ten.'}</p>
        <div class="g2-parts" aria-hidden="true"><span>${x}</span>${V.blocks(x)}<span>+ ${y}</span>${V.blocks(y)}</div>
        ${mat(s, { hundreds: big || s.h > 0 })}
        <div class="g2-trades">
          <button type="button" class="g2-trade" data-act="tradeO"${tradeO ? '' : ' disabled'}${dis}>Trade 10 ones for 1 ten</button>
          ${big ? `<button type="button" class="g2-trade" data-act="tradeT"${tradeT ? '' : ' disabled'}${dis}>Trade 10 tens for 1 hundred</button>` : ''}
        </div>
        ${V.answerBox(`${x} + ${y}`, r, 4)}`;
    },
    handle(r, act) {
      if (act === 'tradeO' && r.s.o >= 10) { r.s.o -= 10; r.s.t += 1; r.trades++; return { focus: '[data-act="tradeO"]', say: '10 ones make 1 ten.' }; }
      if (act === 'tradeT' && r.s.t >= 10) { r.s.t -= 10; r.s.h += 1; r.trades++; return { focus: '[data-act="tradeT"]', say: '10 tens make 1 hundred.' }; }
    },
    check(r) {
      const { x, y } = r.item, n = parseInt(r.answer, 10);
      if (isNaN(n)) return r.s.o >= 10 ? { nudge: `You have ${r.s.o} ones. Trade 10 of them for 1 ten first.` } : { nudge: 'Count the blocks and type the total.' };
      if (n === x + y) return { ok: true, note: r.trades ? '' : (x % 10 + y % 10 >= 10 ? 'Next time, try trading 10 ones for a ten. It makes counting faster.' : '') };
      return addMistake(x, y, n);
    },
    hint(r, lv) {
      const { x, y } = r.item, s = r.s;
      if (lv >= 2) return s.o >= 10 ? `Press "Trade 10 ones for 1 ten". Then you have ${s.t + 1} tens and ${s.o - 10} ones.` : `You have ${s.h ? `${s.h} ${nm('h', s.h)}, ` : ''}${s.t} tens and ${s.o} ones. That is ${s.h ? s.h * 100 + ' + ' : ''}${s.t * 10} + ${s.o}.`;
      if (r.err === 'nocarry') return 'Look at the ones. Ten ones make a new ten. Did you count that ten?';
      if (s.o >= 10) return `${x % 10} + ${y % 10} is ${x % 10 + y % 10} ones. That is more than 9, so 10 of them can become 1 ten.`;
      return 'Count the tens first: 10, 20, 30... Then keep counting the ones.';
    },
    show(r) { while (r.s.o >= 10) T.blockAdd.handle(r, 'tradeO'); while (r.s.t >= 10) T.blockAdd.handle(r, 'tradeT'); r.answer = String(r.item.x + r.item.y); },
    explain(r) {
      const { x, y } = r.item, o = x % 10 + y % 10;
      return o >= 10
        ? `${x % 10} ones + ${y % 10} ones = ${o} ones. 10 ones make 1 ten, so ${o} ones are 1 ten and ${o - 10} ones. That is why ${x} + ${y} = ${x + y}.`
        : `Put the tens together and the ones together. There were fewer than 10 ones, so no trade was needed: ${x} + ${y} = ${x + y}.`;
    }
  };

  T.blockSub = {
    init(r) { r.s = split(r.item.x); r.gone = { h: 0, t: 0, o: 0 }; r.answer = ''; r.breaks = 0; },
    text(r) { return `${r.item.x} − ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item, s = r.s, g = r.gone, dis = r.solved ? ' disabled' : '', big = x >= 100;
      const canT = s.t - g.t > 0, canH = s.h - g.h > 0;
      const need = split(y);
      return `<p class="prompt">${x} − ${y} = ?</p>
        <p class="sub">Tap blocks to take away ${y}: ${[need.h && `${need.h} ${nm('h', need.h)}`, need.t && `${need.t} ${nm('t', need.t)}`, need.o && `${need.o} ${nm('o', need.o)}`].filter(Boolean).join(' and ')}. Not enough ones? Break a ten. Then type what is left.</p>
        ${mat(s, { gone: g, live: true, disabled: r.solved, hundreds: big })}
        <div class="g2-trades">
          <button type="button" class="g2-trade" data-act="breakT"${canT ? '' : ' disabled'}${dis}>Break 1 ten into 10 ones</button>
          ${big ? `<button type="button" class="g2-trade" data-act="breakH"${canH ? '' : ' disabled'}${dis}>Break 1 hundred into 10 tens</button>` : ''}
        </div>
        ${V.answerBox(`${x} − ${y}`, r, 4)}`;
    },
    handle(r, act, el) {
      const s = r.s, g = r.gone;
      if (act === 'breakT' && s.t - g.t > 0) { s.t--; s.o += 10; r.breaks++; return { focus: '[data-act="breakT"]', say: '1 ten makes 10 ones.' }; }
      if (act === 'breakH' && s.h - g.h > 0) { s.h--; s.t += 10; r.breaks++; return { focus: '[data-act="breakH"]', say: '1 hundred makes 10 tens.' }; }
      if (act === 'take') {
        const k = el.dataset.k, i = +el.dataset.i, out = i >= s[k] - g[k];
        g[k] = CM.h.clamp(g[k] + (out ? -1 : 1), 0, s[k]);
        return { focus: `[data-act="take"][data-k="${k}"][data-i="${i}"]`, say: out ? '' : String(g[k]) };
      }
    },
    taken(r) { return valueOf(r.gone); },
    check(r) {
      const { x, y } = r.item, n = parseInt(r.answer, 10), took = T.blockSub.taken(r);
      if (isNaN(n)) return took === y ? { nudge: 'Now count what is left and type it.' } : { nudge: `Tap blocks to take away ${y} first.` };
      if (n === x - y) return { ok: true };
      if (took !== y && took > 0 && n === x - took) return { err: 'took', tag: 'Took away the wrong number of blocks' };
      return subMistake(x, y, n);
    },
    hint(r, lv) {
      const { x, y } = r.item, s = r.s, g = r.gone, need = split(y);
      const left = s.o - g.o;
      if (lv >= 2) {
        if (s.o < need.o) return `You need to take ${need.o} ones but have only ${s.o}. Press "Break 1 ten into 10 ones".`;
        return `Take away ${need.t} tens and ${need.o} ones${need.h ? ` and ${need.h} ${nm('h', need.h)}` : ''}. Count the blocks that are not crossed out.`;
      }
      if (r.err === 'flip') return `You can't take ${need.o} ones from ${x % 10} ones by swapping them. Break 1 ten into 10 ones first.`;
      if (r.err === 'took') return `You took away ${T.blockSub.taken(r)}, but the problem takes away ${y}. Tap a crossed-out block to put it back.`;
      if (r.err === 'added') return 'Minus means take away, so the answer is smaller than the starting number.';
      if (s.o < need.o) return `How many ones do you need to take away? ${need.o}. How many ones do you have? ${s.o}. Is that enough?`;
      return left >= 0 ? 'Take away the ones first, then the tens.' : 'Start with the ones.';
    },
    show(r) {
      const { y } = r.item, need = split(y);
      r.gone = { h: 0, t: 0, o: 0 };
      if (r.s.o < need.o) { if (r.s.t === 0) T.blockSub.handle(r, 'breakH'); T.blockSub.handle(r, 'breakT'); }
      if (r.s.t < need.t) T.blockSub.handle(r, 'breakH');
      r.gone = { h: need.h, t: need.t, o: need.o };
      r.answer = String(r.item.x - r.item.y);
    },
    explain(r) {
      const { x, y } = r.item;
      return x % 10 < y % 10
        ? `There were not enough ones to take away ${y % 10}, so 1 ten was broken into 10 ones. Breaking a ten does not change the number, it only changes the blocks. ${x} − ${y} = ${x - y}. Check by adding: ${x - y} + ${y} = ${x}.`
        : `There were enough ones, so no ten had to be broken. ${x} − ${y} = ${x - y}. Check by adding: ${x - y} + ${y} = ${x}.`;
    }
  };

  /* ---------- column method ---------- */
  /* Digit boxes are typed right to left; each box moves the cursor to the next one (data-next). */
  const digitBox = (r, i, p, label, next) => `<input class="g2-d" data-field="d${i}" id="g2d${i}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="1" value="${r['d' + i] || ''}" aria-label="${label}"${next ? ` data-next="${next}"` : ''}${r.solved ? ' disabled' : ''}>`;
  const readDigits = (r, p) => {
    const ds = Array.from({ length: p }, (_, i) => r['d' + i] || '');
    if (ds.every(d => d === '')) return NaN;
    if (ds[0] === '') return NaN;
    return parseInt(ds.slice().reverse().join('').replace(/^0+(?=\d)/, '') || '0', 10);
  };
  const clearDigits = (r, p) => { for (let i = 0; i < p; i++) r['d' + i] = ''; };

  T.colAdd = {
    places(r) { return Math.max(V.len(r.item.x + r.item.y), V.len(r.item.x), V.len(r.item.y)); },
    init(r) { const p = T.colAdd.places(r); clearDigits(r, p); for (let i = 1; i < p; i++) r['c' + i] = ''; r.answer = ''; },
    text(r) { return `${r.item.x} + ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item, p = T.colAdd.places(r), idx = [...Array(p).keys()].reverse();
      const a = V.digits(x, p), b = V.digits(y, p), dis = r.solved ? ' disabled' : '';
      const carry = i => i === 0 ? '<span></span>' : `<input class="g2-c" data-field="c${i}" id="g2c${i}" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="1" value="${r['c' + i] || ''}" aria-label="Carry into the ${V.NAMES[i]}" data-next="#g2d${i}"${dis}>`;
      const show = (d, i, n) => i < V.len(n) ? d[i] : '';
      return `<p class="prompt">Add in columns: ${x} + ${y}</p>
        <p class="sub">Start with the ones. If a column makes 10 or more, write the ones digit below and the little 1 at the top of the next column.</p>
        <div class="g2-col-op" style="--p:${p}">
          <span class="g2-sign"></span>${idx.map(i => `<span class="g2-h">${V.HEAD[i].slice(0, 1)}</span>`).join('')}
          <span class="g2-sign"></span>${idx.map(i => carry(i)).join('')}
          <span class="g2-sign"></span>${idx.map(i => `<span class="g2-n">${show(a, i, x)}</span>`).join('')}
          <span class="g2-sign">+</span>${idx.map(i => `<span class="g2-n">${show(b, i, y)}</span>`).join('')}
          <span class="g2-line"></span>
          <span class="g2-sign"></span>${idx.map(i => digitBox(r, i, p, `Answer, ${V.NAMES[i]} digit`, i + 1 < p ? `#g2c${i + 1}` : '')).join('')}
        </div>
        ${r.hint >= 2 || r.solved ? V.addChart(x, y) : ''}`;
    },
    check(r) {
      const { x, y } = r.item, p = T.colAdd.places(r), n = readDigits(r, p);
      if (isNaN(n)) return { nudge: 'Start with the ones: type the ones digit in the box at the bottom right.' };
      r.answer = String(n);
      if (n === x + y) {
        const w = V.addWork(x, y), missed = w.cin.some((c, i) => c && !(r['c' + i] === '1'));
        return { ok: true, note: missed ? 'Next time, write the little 1 at the top so you remember it.' : '' };
      }
      return addMistake(x, y, n);
    },
    hint(r, lv) {
      const { x, y } = r.item, o = x % 10 + y % 10;
      if (lv >= 2) return 'Look at the chart under the problem. It adds each column and shows the little 1.';
      if (r.err === 'nocarry') return 'One column made 10 or more. Did you write the little 1 above the next column and add it in?';
      if (r.err === 'concat') return `Only one digit fits in each box. ${o} ones is 1 ten and ${o - 10} ones: write ${o - 10} and carry the 1.`;
      return o >= 10 ? `Ones: ${x % 10} + ${y % 10} = ${o}. Write ${o % 10} in the ones box and the little 1 above the tens.` : `Ones: ${x % 10} + ${y % 10} = ${o}. Write it in the ones box, then add the tens.`;
    },
    show(r) {
      const { x, y } = r.item, p = T.colAdd.places(r), w = V.addWork(x, y);
      for (let i = 0; i < p; i++) r['d' + i] = String(V.digits(x + y, p)[i]);
      for (let i = 1; i < p; i++) r['c' + i] = w.cin[i] ? '1' : '';
      if (V.len(x + y) < p) for (let i = V.len(x + y); i < p; i++) r['d' + i] = '';
      r.answer = String(x + y);
    },
    explain(r) {
      const { x, y } = r.item, w = V.addWork(x, y);
      return `${x} + ${y} = ${x + y}. ${w.notes.length ? 'The little 1 is a ten (or a hundred) that came from trading. It is the same trade you made with the blocks.' : 'No column reached 10, so nothing was carried.'}`;
    }
  };

  T.colSub = {
    places(r) { return V.len(r.item.x); },
    init(r) { const p = T.colSub.places(r); clearDigits(r, p); r.reg = V.digits(r.item.x, p); r.answer = ''; },
    text(r) { return `${r.item.x} − ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item, p = T.colSub.places(r), idx = [...Array(p).keys()].reverse();
      const top = V.digits(x, p), bot = V.digits(y, p), dis = r.solved ? ' disabled' : '';
      const resLen = p;
      const topCell = i => {
        const changed = r.reg[i] !== top[i];
        const canBreak = i > 0 && r.reg[i] > 0 && !r.solved;
        const inner = changed ? `<s>${top[i]}</s><b>${r.reg[i]}</b>` : `${top[i]}`;
        return canBreak
          ? `<button type="button" class="g2-n g2-top${changed ? ' changed' : ''}" data-act="regroup" data-i="${i}" aria-label="Regroup: take 1 from the ${V.NAMES[i]} and give 10 to the ${V.NAMES[i - 1]}. Now ${r.reg[i]}.">${inner}</button>`
          : `<span class="g2-n g2-top${changed ? ' changed' : ''}">${inner}</span>`;
      };
      return `<p class="prompt">Subtract in columns: ${x} − ${y}</p>
        <p class="sub">Start with the ones. If the top digit is too small, tap the digit to its left to regroup: it gives 10 to its neighbor.</p>
        <div class="g2-col-op" style="--p:${p}">
          <span class="g2-sign"></span>${idx.map(i => `<span class="g2-h">${V.HEAD[i].slice(0, 1)}</span>`).join('')}
          <span class="g2-sign"></span>${idx.map(topCell).join('')}
          <span class="g2-sign">−</span>${idx.map(i => `<span class="g2-n">${i < V.len(y) ? bot[i] : ''}</span>`).join('')}
          <span class="g2-line"></span>
          <span class="g2-sign"></span>${idx.map(i => digitBox(r, i, resLen, `Answer, ${V.NAMES[i]} digit`, i + 1 < resLen ? `#g2d${i + 1}` : '')).join('')}
        </div>
        ${r.reg.some((v, i) => v !== top[i]) && !r.solved ? `<div class="g2-trades"><button type="button" class="g2-trade ghost" data-act="undo"${dis}>Start over</button></div>` : ''}
        ${r.hint >= 2 || r.solved ? V.subChart(x, y) : ''}`;
    },
    handle(r, act, el) {
      if (act === 'regroup') {
        const i = +el.dataset.i;
        if (i > 0 && r.reg[i] > 0) { r.reg[i]--; r.reg[i - 1] += 10; return { focus: `[data-act="regroup"][data-i="${i}"]`, say: `1 ${V.ONE[i]} became 10 ${V.NAMES[i - 1]}.` }; }
      }
      if (act === 'undo') { r.reg = V.digits(r.item.x, T.colSub.places(r)); return { focus: '#g2d0' }; }
    },
    check(r) {
      const { x, y } = r.item, p = T.colSub.places(r), n = readDigits(r, p);
      if (isNaN(n)) return { nudge: 'Start with the ones: type the ones digit in the box at the bottom right.' };
      r.answer = String(n);
      if (n === x - y) return { ok: true };
      return subMistake(x, y, n);
    },
    hint(r, lv) {
      const { x, y } = r.item, top = r.reg, bot = V.digits(y, T.colSub.places(r));
      if (lv >= 2) return 'Look at the chart under the problem. The orange digits show where a ten or a hundred was regrouped.';
      if (r.err === 'flip') return `In the ones, the top is ${x % 10} and the bottom is ${y % 10}. You can't swap them. Tap the tens digit to regroup first.`;
      if (r.err === 'noreduce') return 'You gave the ones 10 more, so the tens must have 1 less. Tap the tens digit so it goes down by 1.';
      if (r.err === 'added') return 'Minus means take away, so the answer is smaller than the top number.';
      const i = top.findIndex((v, k) => v < bot[k]);
      if (i >= 0) return top[i + 1] === 0 ? `The ${V.NAMES[i + 1]} digit is 0, so it has nothing to give. Tap the hundreds first, then the ${V.NAMES[i + 1]}.` : `${top[i]} is smaller than ${bot[i]} in the ${V.NAMES[i]}. Tap the ${V.NAMES[i + 1]} digit to regroup.`;
      return 'Subtract each column, starting with the ones.';
    },
    show(r) {
      const { x, y } = r.item, p = T.colSub.places(r), w = V.subWork(x, y);
      r.reg = w.reg.slice();
      const d = V.digits(x - y, p), len = V.len(x - y);
      for (let i = 0; i < p; i++) r['d' + i] = i < len ? String(d[i]) : '';
      r.answer = String(x - y);
    },
    explain(r) {
      const { x, y } = r.item, w = V.subWork(x, y);
      return `${x} − ${y} = ${x - y}. ${w.notes.length ? 'Regrouping is the same as breaking a ten into 10 ones with the blocks: the number stays the same, only the groups change.' : 'Every top digit was big enough, so nothing was regrouped.'} Check by adding: ${x - y} + ${y} = ${x}.`;
    }
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
