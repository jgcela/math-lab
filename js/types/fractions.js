/* Fraction mission types: build, compare, equivalent. */
(function (CM) {
  'use strict';
  const { frac, plural, range } = CM.h, V = CM.viz, T = CM.TYPES;

  const toggleSeg = (r, el) => { const i = +el.dataset.i; r.shaded.has(i) ? r.shaded.delete(i) : r.shaded.add(i); return { focus: `[data-act="seg"][data-i="${i}"]` }; };

  T.fractionBuild = {
    init(r) { r.pieces = 1; r.shaded = new Set(); },
    text(r) { return `Build ${r.item.a}/${r.item.b}`; },
    view(r) {
      const { a, b } = r.item;
      return `<p class="prompt">Color ${frac(a, b)} of the bar.</p>
        <p class="sub">Choose how many equal pieces to cut it into, then tap pieces to color them.</p>
        ${V.stepper('Cut into', 'pieces', r.pieces, 1, 12, r.solved, r.pieces === 1 ? 'piece' : 'pieces')}
        <div class="mat"><div class="barwrap">${V.bar(r.pieces, r.shaded, { live: true, label: 'Your bar', disabled: r.solved })}</div></div>`;
    },
    handle(r, act, el) {
      if (act === 'seg') return toggleSeg(r, el);
      if (act === 'pieces+' || act === 'pieces-') { r.pieces = CM.h.clamp(r.pieces + (act === 'pieces+' ? 1 : -1), 1, 12); r.shaded = new Set(); return { focus: `[data-act="${act}"]` }; }
    },
    check(r) {
      const { a, b } = r.item, n = r.shaded.size, p = r.pieces;
      if (p === b && n === a) return { ok: true };
      if (n > 0 && n * b === a * p) return { nudge: `That's the same amount as ${frac(a, b)}. Now show it with ${b} pieces, the number on the bottom.` };
      return p !== b ? { err: 'pieces', tag: 'Did not cut the whole into the number of pieces on the bottom' } : { err: 'count', tag: 'Colored the wrong number of pieces' };
    },
    hint(r, lv) {
      const { a, b } = r.item, n = r.shaded.size;
      if (r.err === 'pieces' || (!r.err && r.pieces !== b)) return lv === 1
        ? 'The bottom number tells how many equal pieces the whole is cut into. How many pieces should your bar have?'
        : `Use the \u2212 and + buttons until the bar has ${b} pieces.`;
      return lv === 1 ? `The top number tells how many pieces to color. Count your colored pieces. Do you have ${a}?` : `You need ${plural(a, 'colored piece')}. Right now you have ${n}.`;
    },
    show(r) { const { a, b } = r.item; r.pieces = b; r.shaded = range(a); },
    explain(r) {
      const { a, b } = r.item;
      return `In ${frac(a, b)}, the bottom number ${b} says the whole is cut into ${b} equal pieces. The top number ${a} says how many of those pieces we take. Each piece is ${frac(1, b)} of the whole, so ${a} pieces make ${frac(a, b)}.`;
    }
  };

  T.fractionCompare = {
    choice: true,
    init(r) { r.choice = null; },
    text(r) { const { x, y } = r.item; return `Compare ${x[0]}/${x[1]} and ${y[0]}/${y[1]}`; },
    correct(r) { const { x, y } = r.item, d = x[0] * y[1] - y[0] * x[1]; return d > 0 ? 'x' : d < 0 ? 'y' : 'same'; },
    view(r) {
      const { x, y } = r.item;
      let s = `<p class="prompt">Which is more: ${frac(x[0], x[1])} or ${frac(y[0], y[1])}?</p>`;
      if (r.hint >= 1 || r.solved) {
        const g = p => r.hint >= 2 ? `<div class="guide" style="--p:${p}"></div>` : '';
        s += `<div class="mat">
          <div class="row"><span class="lab">${frac(x[0], x[1])}</span><div class="barwrap">${V.bar(x[1], range(x[0]), { label: `${x[0]} out of ${x[1]}` })}${g(x[0] / x[1])}</div></div>
          <div class="row"><span class="lab">${frac(y[0], y[1])}</span><div class="barwrap">${V.bar(y[1], range(y[0]), { label: `${y[0]} out of ${y[1]}` })}${g(y[0] / y[1])}</div></div>
        </div>`;
      } else s += `<p class="hidden-bars">Think it through first. A hint shows both fractions as bars.</p>`;
      const pk = k => r.choice === k ? ' picked' : '', dis = r.solved ? ' disabled' : '';
      return s + `<div class="choices" role="group" aria-label="Your answer">
        <button type="button" class="choice${pk('x')}" data-act="choose" data-c="x"${dis}>${frac(x[0], x[1])}</button>
        <button type="button" class="choice${pk('same')}" data-act="choose" data-c="same"${dis}><span class="word">Same</span></button>
        <button type="button" class="choice${pk('y')}" data-act="choose" data-c="y"${dis}>${frac(y[0], y[1])}</button></div>`;
    },
    handle(r, act, el) { if (act === 'choose') { r.choice = el.dataset.c; return { check: true }; } },
    check(r) {
      if (r.choice === this.correct(r)) return { ok: true };
      const { x, y } = r.item;
      const bb = x[0] === y[0] && x[1] !== y[1] && ((r.choice === 'x' && x[1] > y[1]) || (r.choice === 'y' && y[1] > x[1]));
      return bb ? { err: 'bigger-bottom', tag: 'Thinks a bigger bottom number means a bigger fraction' } : { err: 'other', tag: 'Compared fractions incorrectly' };
    },
    hint(r, lv) {
      const { x, y } = r.item;
      if (lv >= 2) return 'The bar whose color reaches farther to the right is more. Follow the dashed lines.';
      if (r.err === 'bigger-bottom') return `Both have ${plural(x[0], 'colored piece')}. When a whole is cut into more pieces, is each piece bigger or smaller?`;
      if (x[1] === y[1]) return `Both wholes are cut into ${x[1]} pieces, so every piece is the same size. Which one has more colored pieces?`;
      return 'Here are both fractions as bars, each the same size as one whole. Look at where the color stops.';
    },
    show(r) { r.choice = this.correct(r); },
    explain(r) {
      const { x, y } = r.item, k = this.correct(r);
      const fx = frac(x[0], x[1]), fy = frac(y[0], y[1]);
      if (x[1] === y[1]) return `Both wholes have ${x[1]} equal pieces, so the pieces are the same size. ${k === 'same' ? 'Same number of pieces, same amount.' : `${k === 'x' ? fx : fy} has more of them, so it is more.`}`;
      if (x[0] === y[0]) return `Both take ${plural(x[0], 'piece')}. The whole cut into fewer pieces has bigger pieces, so ${k === 'x' ? fx : fy} is more.`;
      return k === 'same' ? `${fx} and ${fy} reach exactly the same point on same-size wholes. They are equivalent.`
        : `On same-size wholes, ${k === 'x' ? fx : fy} reaches farther. The size of the whole must be the same for the comparison to be fair.`;
    }
  };

  T.fractionEquiv = {
    init(r) { r.shaded = new Set(); },
    text(r) { const { a, b, d } = r.item; return `${a}/${b} = ?/${d}`; },
    target(r) { const { a, b, d } = r.item; return a * d / b; },
    view(r) {
      const { a, b, d } = r.item;
      return `<p class="prompt">The top bar shows ${frac(a, b)}. Color the bottom bar so it shows the same amount.</p>
        <p class="sub">The bottom bar is cut into ${d} pieces.</p>
        <div class="mat">
          <div class="row"><span class="lab">${frac(a, b)}</span><div class="barwrap">${V.bar(b, range(a), { label: `${a} out of ${b}` })}</div></div>
          <div class="row"><span class="lab">${frac('?', d)}</span><div class="barwrap">${V.bar(d, r.shaded, { live: true, label: 'Your bar', disabled: r.solved })}</div></div>
          ${r.hint >= 2 || r.solved ? `<div class="guide" style="--p:${a / b}"></div>` : ''}
        </div>`;
    },
    handle(r, act, el) { if (act === 'seg') return toggleSeg(r, el); },
    check(r) {
      const { a, b, d } = r.item, n = r.shaded.size;
      if (n * b === a * d) return { ok: true };
      return { err: n < a * d / b ? 'short' : 'over', tag: n < a * d / b ? 'Colored too little to match the amount' : 'Colored too much to match the amount' };
    },
    hint(r, lv) {
      if (lv >= 2) return 'Follow the dashed line. Color every bottom piece to its left.';
      if (r.err === 'short') return "Your color stops before the top bar's color does. Look at where the top color ends.";
      if (r.err === 'over') return "Your color goes past the top bar's color. Look at where the top color ends.";
      return 'Look at where the color stops on the top bar. Color the bottom pieces up to that same place.';
    },
    show(r) { r.shaded = range(this.target(r)); },
    explain(r) {
      const { a, b, d } = r.item, t = this.target(r);
      if (d > b) return `${frac(a, b)} = ${frac(t, d)}. Each ${frac(1, b)} piece splits into ${d / b} pieces of size ${frac(1, d)}, so ${a} \u00d7 ${d / b} = ${t} small pieces cover the same amount. Top and bottom were both multiplied by ${d / b}.`;
      return `${frac(a, b)} = ${frac(t, d)}. Every ${b / d} small pieces join into one bigger piece, so ${a} \u00f7 ${b / d} = ${t}. Top and bottom were both divided by ${b / d}. This is how a fraction is simplified.`;
    }
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
