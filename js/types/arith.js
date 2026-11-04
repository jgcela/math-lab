/* Whole-number mission types: arrays, addition and subtraction with regrouping. */
(function (CM) {
  'use strict';
  const V = CM.viz, T = CM.TYPES;

  /* Array Builder: the child sweeps a finger across a 10 x 10 field of snowballs to frame rows x columns,
   * then picks the total. The answer choices include a + b, so adding instead of multiplying is still caught. */
  const AN = 10;
  T.arrays = {
    init(r) { r.rows = 0; r.cols = 0; r.answer = ''; },
    text(r) { return `${r.item.a} × ${r.item.b}`; },
    choices(item) {
      const { a, b } = item, p = a * b, out = [p];
      [a + b, p + b, p - b, p + a, p - a].forEach(v => { if (v > 0 && out.length < 3 && !out.includes(v)) out.push(v); });
      const k = (a * 7 + b) % 3;
      return out.slice(k).concat(out.slice(0, k));
    },
    view(r) {
      const { a, b } = r.item, R = r.rows, C = r.cols, match = (R === a && C === b) || (R === b && C === a);
      const skip = (r.hint >= 2 || r.solved) && match;
      const dis = r.solved ? ' disabled' : '';
      let cells = '';
      for (let c = 1; c <= AN; c++) cells += `<span class="ag-lab${c <= C ? ' on' : ''}" style="grid-area:1/${c + 1}" aria-hidden="true">${c}</span>`;
      for (let y = 1; y <= AN; y++) {
        cells += `<span class="ag-lab${y <= R ? ' on' : ''}" style="grid-area:${y + 1}/1" aria-hidden="true">${y}</span>`;
        for (let x = 1; x <= AN; x++) {
          const on = y <= R && x <= C, corner = (y === Math.max(R, 1) && x === Math.max(C, 1));
          cells += `<button type="button" class="ag-dot${on ? ' in' : ''}" style="grid-area:${y + 1}/${x + 1}" data-act="cell" data-sweep data-r="${y}" data-c="${x}" tabindex="${corner ? 0 : -1}" aria-label="${y} ${y === 1 ? 'row' : 'rows'} of ${x}"${dis}></button>`;
        }
        if (skip && y <= R) cells += `<span class="ag-skip" style="grid-area:${y + 1}/${AN + 2}">${y * C}</span>`;
      }
      const frame = R && C ? `<span class="ag-frame" style="grid-area:2/2/${R + 2}/${C + 2}" aria-hidden="true"></span>` : '';
      const target = r.hint >= 2 && !r.solved && !match ? `<span class="ag-target" style="grid-area:2/2/${a + 2}/${b + 2}" aria-hidden="true"></span>` : '';
      const tiles = T.arrays.choices(r.item).map(v => `<button type="button" class="tile${String(v) === r.answer ? ' picked' : ''}" data-act="pick" data-n="${v}"${dis}>${v}</button>`).join('');
      return `<p class="prompt">Show ${a} × ${b} with snowballs.</p>
        <p class="sub">Drag across the snowballs to make ${a} rows of ${b}. Then pick the total.</p>
        <div class="agrid" role="group" aria-label="Snowball field. ${R ? `${R} rows of ${C} chosen.` : 'Nothing chosen yet.'} Use the arrow keys to change rows and columns.">${cells}${frame}${target}</div>
        <p class="ag-cap" aria-live="polite">${R ? `${R} ${R === 1 ? 'row' : 'rows'} of ${C}` : '&nbsp;'}</p>
        <p class="eqn">${a} × ${b} = <span class="eqn-ans">${r.answer || '?'}</span></p>
        <div class="tiles" role="group" aria-label="Total">${tiles}</div>`;
    },
    handle(r, act, el) {
      if (act === 'cell' || act === 'sweep') { r.rows = +el.dataset.r; r.cols = +el.dataset.c; return { focus: `[data-act="cell"][data-r="${r.rows}"][data-c="${r.cols}"]` }; }
      if (act === 'pick') { r.answer = el.dataset.n; return { focus: `[data-act="pick"][data-n="${el.dataset.n}"]`, say: el.dataset.n }; }
      const m = act.match(/^(rows|cols)([+-])$/);
      if (m) { r[m[1]] = CM.h.clamp(r[m[1]] + (m[2] === '+' ? 1 : -1), 1, AN); return { focus: `[data-act="cell"][data-r="${r.rows}"][data-c="${r.cols}"]` }; }
    },
    /* Arrow keys move the corner of the frame. */
    key(r, k) {
      const d = { ArrowDown: 'rows+', ArrowUp: 'rows-', ArrowRight: 'cols+', ArrowLeft: 'cols-' }[k];
      if (!d) return null;
      if (!r.rows) { r.rows = 1; r.cols = 1; }
      return T.arrays.handle(r, d);
    },
    check(r) {
      const { a, b } = r.item, n = parseInt(r.answer, 10);
      if (!r.rows) return { nudge: 'Drag across the snowballs to build the array first.' };
      const arr = r.rows === a && r.cols === b, swap = r.rows === b && r.cols === a && a !== b;
      if (!arr && !swap) return { err: 'array', tag: 'Built an array that does not match the problem' };
      if (isNaN(n)) return { nudge: 'Your array looks right. Now pick the total.' };
      if (n !== a * b) return n === a + b ? { err: 'added', tag: 'Added the numbers instead of multiplying' } : { err: 'count', tag: 'Counted the array total incorrectly' };
      return { ok: true, note: swap ? `${b} rows of ${a} gives the same total as ${a} rows of ${b}.` : '' };
    },
    hint(r, lv) {
      const { a, b } = r.item;
      const arrayIssue = r.err === 'array' || (!r.err && !(r.rows === a && r.cols === b) && !(r.rows === b && r.cols === a));
      if (arrayIssue) return lv === 1 ? `The first number, ${a}, is how many rows. The second number, ${b}, is how many snowballs go in each row.` : `Drag to the outlined corner: ${a} rows of ${b}.`;
      if (lv >= 2) return `The numbers at the end of each row count by ${b}s. The last one is the total.`;
      if (r.err === 'added') return `${a} + ${b} is ${a + b}, but ${a} × ${b} means ${a} groups of ${b}. Count by ${b}s, once for each row.`;
      return `Count by ${b}s, once for each row: ${b}, ${2 * b}, and keep going.`;
    },
    show(r) { const { a, b } = r.item; r.rows = a; r.cols = b; r.answer = String(a * b); },
    explain(r) {
      const { a, b } = r.item;
      return `${a} \u00d7 ${b} means ${a} equal groups of ${b}. As repeated addition: ${Array(a).fill(b).join(' + ')} = ${a * b}. Turning the array sideways gives ${b} rows of ${a}, the same ${a * b} dots, which is why ${a} \u00d7 ${b} = ${b} \u00d7 ${a}.`;
    }
  };

  const digitsOf = (n, p) => V.digits(n, p);

  T.addRegroup = {
    init(r) { r.answer = ''; },
    text(r) { return `${r.item.x} + ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item, big = x + y >= 1000;
      return `<p class="big">${x} + ${y} = ?</p>
        <p class="sub">Add the ones first, then the tens, then the hundreds${big ? ', then the thousands' : ''}.</p>
        <div class="mat">
          <div class="brow"><span class="lab">${x}</span>${V.blocks(x)}</div>
          <div class="brow"><span class="lab">+ ${y}</span>${V.blocks(y)}</div>
          ${V.legend(big)}
        </div>
        ${r.hint >= 2 || r.solved ? V.addChart(x, y) : ''}
        ${V.answerBox(`${x} + ${y}`, r)}`;
    },
    check(r) {
      const { x, y } = r.item, n = parseInt(r.answer, 10);
      if (isNaN(n)) return { nudge: 'Type your answer in the box.' };
      if (n === x + y) return { ok: true };
      const p = V.len(x + y), a = digitsOf(x, p), b = digitsOf(y, p);
      const noCarry = V.fromDigits(a.map((v, i) => (v + b[i]) % 10));
      const concat = parseInt(a.map((v, i) => v + b[i]).reverse().join('').replace(/^0+/, '') || '0', 10);
      if (n === noCarry) return { err: 'nocarry', tag: 'Forgot to trade 10 ones for a ten (or 10 tens for a hundred)' };
      if (n === concat) return { err: 'concat', tag: 'Wrote a two-digit column sum in one place' };
      return { err: 'other', tag: 'Added incorrectly' };
    },
    hint(r, lv) {
      const { x, y } = r.item, o1 = x % 10, o2 = y % 10, s = o1 + o2;
      if (lv >= 2) return 'Look at the chart. It adds each place and shows every trade.';
      if (r.err === 'nocarry') return 'Check each place. When a place adds up to 10 or more, trade 10 of them for 1 of the next place and add it there.';
      if (r.err === 'concat') return `${o1} + ${o2} = ${s}, but only one digit fits in each place. Trade 10 ones for 1 ten.`;
      return s >= 10 ? `Start with the ones: ${o1} + ${o2}. If you get 10 or more, trade 10 ones for 1 ten.` : `Start with the ones: ${o1} + ${o2}. Then move left, one place at a time.`;
    },
    show(r) { r.answer = String(r.item.x + r.item.y); },
    explain(r) {
      const { x, y } = r.item, w = V.addWork(x, y);
      return `${x} + ${y} = ${x + y}. ${w.notes.length ? `Ten of one place is worth one of the next place, so every 10 ones become 1 ten and every 10 tens become 1 hundred. The chart shows ${w.notes.length === 1 ? 'the trade' : 'each trade'}.` : 'No place reached 10, so no trades were needed.'}`;
    }
  };

  T.subRegroup = {
    init(r) { r.answer = ''; },
    text(r) { return `${r.item.x} \u2212 ${r.item.y}`; },
    view(r) {
      const { x, y } = r.item;
      return `<p class="big">${x} \u2212 ${y} = ?</p>
        <p class="sub">Start with ${x} and take away ${y}. Begin with the ones. If a place doesn't have enough, break one from the place to its left.</p>
        <div class="mat"><div class="brow"><span class="lab">${x}<small>start</small></span>${V.blocks(x)}</div>${V.legend(x >= 1000)}</div>
        ${r.hint >= 2 || r.solved ? V.subChart(x, y) : ''}
        ${V.answerBox(`${x} \u2212 ${y}`, r)}`;
    },
    check(r) {
      const { x, y } = r.item, n = parseInt(r.answer, 10);
      if (isNaN(n)) return { nudge: 'Type your answer in the box.' };
      if (n === x - y) return { ok: true };
      const p = V.len(x), a = digitsOf(x, p), b = digitsOf(y, p);
      const flip = V.fromDigits(a.map((v, i) => Math.abs(v - b[i])));
      const noReduce = V.fromDigits(a.map((v, i) => v < b[i] ? v + 10 - b[i] : v - b[i]));
      if (n === flip) return { err: 'flip', tag: 'Subtracted the smaller digit from the bigger one in each place' };
      if (n === noReduce) return { err: 'noreduce', tag: 'Broke a ten into ones without taking it away from the tens' };
      return { err: 'other', tag: 'Subtracted incorrectly' };
    },
    hint(r, lv) {
      const { x, y } = r.item, o1 = x % 10, o2 = y % 10;
      if (lv >= 2) return 'Look at the chart. The highlighted digits show where a ten, hundred, or thousand was broken into smaller pieces.';
      if (r.err === 'flip') return `In the ones you have ${o1} and need to take away ${o2}. You can't swap them around. Break 1 ten into 10 ones first.`;
      if (r.err === 'noreduce') return 'You made 10 more ones, but that ten has to come out of the tens. Take 1 away from the tens.';
      if (o1 < o2 && Math.floor(x / 10) % 10 === 0) return 'The ones place is short, and the tens place has 0. Go left until you find a place you can break, then break down one place at a time.';
      return o1 < o2 ? `Start with the ones: can you take ${o2} away from ${o1}? If not, break 1 ten into 10 ones.` : 'Take away the ones first, then move left. If a place doesn\'t have enough, break one from the place to its left.';
    },
    show(r) { r.answer = String(r.item.x - r.item.y); },
    explain(r) {
      const { x, y } = r.item;
      return `${x} \u2212 ${y} = ${x - y}. Breaking 1 ten into 10 ones does not change the number, only how it is grouped. Check by adding back: ${x - y} + ${y} = ${x}.`;
    }
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
