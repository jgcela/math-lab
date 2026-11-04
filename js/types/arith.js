/* Whole-number mission types: arrays, addition and subtraction with regrouping. */
(function (CM) {
  'use strict';
  const V = CM.viz, T = CM.TYPES;

  T.arrays = {
    init(r) { r.rows = 1; r.cols = 1; r.answer = ''; },
    text(r) { return `${r.item.a} \u00d7 ${r.item.b}`; },
    view(r) {
      const { a, b } = r.item;
      const skip = (r.hint >= 2 || r.solved) && r.rows === a && r.cols === b;
      let rows = '';
      for (let i = 0; i < r.rows; i++) rows += `<div class="arow">${'<span class="adot"></span>'.repeat(r.cols)}<span class="skip">${skip ? (i + 1) * r.cols : ''}</span></div>`;
      return `<p class="big">${a} \u00d7 ${b} = ?</p>
        <p class="sub">Build it as an array: equal rows of dots. Then type the total.</p>
        <div class="steppers">${V.stepper('Rows', 'rows', r.rows, 1, 10, r.solved)}${V.stepper('Dots in each row', 'cols', r.cols, 1, 10, r.solved)}</div>
        <div class="array" style="--c:${r.cols}" role="img" aria-label="${r.rows} rows of ${r.cols} dots">${rows}</div>
        ${V.answerBox(`${a} \u00d7 ${b}`, r, 3)}`;
    },
    handle(r, act) {
      const m = act.match(/^(rows|cols)([+-])$/);
      if (m) { r[m[1]] = CM.h.clamp(r[m[1]] + (m[2] === '+' ? 1 : -1), 1, 10); return { focus: `[data-act="${act}"]` }; }
    },
    check(r) {
      const { a, b } = r.item, n = parseInt(r.answer, 10);
      const arr = r.rows === a && r.cols === b, swap = r.rows === b && r.cols === a && a !== b;
      if (!arr && !swap) return { err: 'array', tag: 'Built an array that does not match the problem' };
      if (isNaN(n)) return { nudge: 'Your array looks right. Now type the total in the box.' };
      if (n !== a * b) return n === a + b ? { err: 'added', tag: 'Added the numbers instead of multiplying' } : { err: 'count', tag: 'Counted the array total incorrectly' };
      return { ok: true, note: swap ? `${b} rows of ${a} gives the same total as ${a} rows of ${b}.` : '' };
    },
    hint(r, lv) {
      const { a, b } = r.item;
      const arrayIssue = r.err === 'array' || (!r.err && !(r.rows === a && r.cols === b) && !(r.rows === b && r.cols === a));
      if (arrayIssue) return lv === 1 ? `The first number, ${a}, is how many rows. The second number, ${b}, is how many dots go in each row.` : `Set Rows to ${a} and Dots in each row to ${b}.`;
      if (lv >= 2) return `The numbers at the end of each row count by ${b}s. The last one is the total.`;
      if (r.err === 'added') return `${a} + ${b} is ${a + b}, but ${a} \u00d7 ${b} means ${a} groups of ${b}. Count by ${b}s, once for each row.`;
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
