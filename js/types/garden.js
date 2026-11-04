/* Grade 5 mission type: The Garden Challenge (fractions of a whole, like and unlike denominators). */
(function (CM) {
  'use strict';
  const { frac, gcd, plural } = CM.h, T = CM.TYPES;

  const ICON = {
    f: '<svg viewBox="0 0 40 40" aria-hidden="true"><g fill="var(--t6)"><circle cx="20" cy="11" r="6"/><circle cx="29" cy="18" r="6"/><circle cx="26" cy="28" r="6"/><circle cx="14" cy="28" r="6"/><circle cx="11" cy="18" r="6"/></g><circle cx="20" cy="20" r="5" fill="var(--t2)"/></svg>',
    v: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 34V18" stroke="var(--t3)" stroke-width="3" stroke-linecap="round"/><path d="M20 20c-9 0-12-6-12-12 7 0 12 4 12 12zM20 24c8 0 12-5 12-11-7 0-12 3-12 11z" fill="var(--t3)"/></svg>'
  };
  const NAME = { f: 'flowers', v: 'vegetables', e: 'available' };

  function counts(r) {
    const it = r.item;
    if (!it.plan) return { F: it.flowers, V: it.veg, A: it.total - it.flowers - it.veg };
    const F = it.total * it.plan.flowers[0] / it.plan.flowers[1], V = it.total * it.plan.veg[0] / it.plan.veg[1];
    return { F, V, A: it.total - F - V };
  }
  const plotsOf = r => r.item.plan ? r.plots : r.item.layout.split('');

  T.garden = {
    init(r) {
      r.sel = new Set(); r.num = ''; r.den = '';
      if (r.item.plan) { r.plots = Array(r.item.total).fill('e'); r.brush = 'f'; }
    },
    text(r) { const it = r.item; return it.plan ? `Plan ${it.total} plots: ${it.plan.flowers.join('/')} flowers, ${it.plan.veg.join('/')} vegetables` : `${it.total} plots: ${it.flowers} flowers, ${it.veg} vegetables`; },
    view(r) {
      const it = r.item, plots = plotsOf(r), c = counts(r), showCounts = r.hint >= 2 || r.solved;
      const cells = plots.map((k, i) => {
        const sel = !it.plan && r.sel.has(i);
        const label = it.plan ? `Plot ${i + 1}, ${k === 'e' ? 'empty' : NAME[k]}` : `Plot ${i + 1}, ${k === 'e' ? (sel ? 'available, selected' : 'available') : NAME[k]}`;
        return `<button type="button" class="plot plot-${k}${sel ? ' sel' : ''}" data-act="plot" data-i="${i}" aria-label="${label}"${r.solved ? ' disabled' : ''}>${ICON[k] || ''}${sel ? '<span class="check" aria-hidden="true">\u2713</span>' : ''}</button>`;
      }).join('');
      let top;
      if (!it.plan) {
        top = `<p class="prompt">A community garden has ${it.total} equal plots. ${plural(it.flowers, 'plot has', 'plots have')} flowers and ${plural(it.veg, 'plot has', 'plots have')} vegetables.</p>
          <p class="sub">Tap the plots that are still available. Then write the fraction of the garden that is available.</p>`;
      } else {
        const pf = it.plan.flowers, pv = it.plan.veg;
        top = `<p class="prompt">Plan a garden of ${it.total} equal plots: ${frac(pf[0], pf[1])} for flowers and ${frac(pv[0], pv[1])} for vegetables.</p>
          <p class="sub">Pick a plant, tap plots to plant them, then write the fraction of the garden left available.</p>
          <div class="brushes" role="group" aria-label="What to plant">
            <button type="button" class="brush${r.brush === 'f' ? ' picked' : ''}" data-act="brush" data-b="f"${r.solved ? ' disabled' : ''}>${ICON.f}Flowers</button>
            <button type="button" class="brush${r.brush === 'v' ? ' picked' : ''}" data-act="brush" data-b="v"${r.solved ? ' disabled' : ''}>${ICON.v}Vegetables</button>
          </div>`;
      }
      const planted = it.plan ? { F: r.plots.filter(k => k === 'f').length, V: r.plots.filter(k => k === 'v').length } : null;
      const tallies = showCounts
        ? `<p class="tally">${it.plan ? `Flowers: ${planted.F} \u00b7 Vegetables: ${planted.V} \u00b7 ` : ''}Equation: ${it.total} \u2212 ${c.F} \u2212 ${c.V} = ?</p>` : '';
      return `${top}
        <div class="garden" style="--cols:${it.cols}">${cells}</div>
        <div class="legend"><span><i class="lg-f"></i>Flowers</span><span><i class="lg-v"></i>Vegetables</span><span><i class="lg-e"></i>Available</span></div>
        ${tallies}
        <div class="eq"><span>Available:</span>
          <span class="fin" role="group" aria-label="Fraction available">
            <input id="num" class="ans small" data-field="num" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="Numerator" value="${r.num}"${r.solved ? ' disabled' : ''}>
            <input id="den" class="ans small" data-field="den" inputmode="numeric" pattern="[0-9]*" maxlength="2" aria-label="Denominator" value="${r.den}"${r.solved ? ' disabled' : ''}>
          </span></div>`;
    },
    handle(r, act, el) {
      const i = +el.dataset.i, it = r.item;
      if (act === 'brush') { r.brush = el.dataset.b; return { focus: `[data-act="brush"][data-b="${r.brush}"]` }; }
      if (act !== 'plot') return;
      if (it.plan) { r.plots[i] = r.plots[i] === r.brush ? 'e' : r.brush; return { focus: `[data-act="plot"][data-i="${i}"]` }; }
      const k = it.layout[i];
      if (k !== 'e') return { msg: `That plot already has ${NAME[k]}. Available plots have nothing planted.`, tone: 'info', focus: `[data-act="plot"][data-i="${i}"]` };
      r.sel.has(i) ? r.sel.delete(i) : r.sel.add(i);
      return { focus: `[data-act="plot"][data-i="${i}"]` };
    },
    check(r) {
      const it = r.item, c = counts(r);
      if (it.plan) {
        const F = r.plots.filter(k => k === 'f').length, Vv = r.plots.filter(k => k === 'v').length;
        if (!F && !Vv) return { nudge: 'Plant the flowers and vegetables first.' };
        if (F !== c.F) return { err: 'plan-f', tag: 'Found the wrong number of plots for a fraction of the garden' };
        if (Vv !== c.V) return { err: 'plan-v', tag: 'Found the wrong number of plots for a fraction of the garden' };
      } else {
        if (!r.sel.size) return { nudge: 'Tap the plots that are still available.' };
        if (r.sel.size !== c.A) return { err: 'select', tag: 'Selected the wrong number of available plots' };
      }
      const n = parseInt(r.num, 10), d = parseInt(r.den, 10);
      if (isNaN(n) || isNaN(d)) return { nudge: 'Now write the fraction: available plots on top, the whole garden on the bottom.' };
      if (d === 0) return { err: 'zero', tag: 'Wrote a fraction with 0 on the bottom' };
      if (n * it.total === c.A * d) return { ok: true, note: (n !== c.A || d !== it.total) ? `${frac(n, d)} is equivalent to ${frac(c.A, it.total)}.` : '' };
      if (n * it.total === (c.F + c.V) * d) return { err: 'complement', tag: 'Found the planted fraction instead of the available fraction' };
      if (n === c.A && d === c.F + c.V) return { err: 'part-part', tag: 'Compared available plots to planted plots instead of to the whole' };
      if (n === c.A) return { err: 'denominator', tag: 'Used the wrong whole for the denominator' };
      return { err: 'fraction', tag: 'Wrote an incorrect fraction of the whole' };
    },
    hint(r, lv) {
      const it = r.item, c = counts(r);
      if (r.err === 'plan-f' || r.err === 'plan-v' || (it.plan && !r.err && (r.plots.filter(k => k === 'f').length !== c.F || r.plots.filter(k => k === 'v').length !== c.V))) {
        const which = (r.err === 'plan-v') ? 'veg' : (r.plots.filter(k => k === 'f').length !== c.F ? 'flowers' : 'veg');
        const [a, b] = it.plan[which], want = which === 'veg' ? c.V : c.F, word = which === 'veg' ? 'vegetable' : 'flower';
        return lv === 1
          ? `${frac(a, b)} of ${it.total} means split the ${it.total} plots into ${b} equal groups${a > 1 ? ` and take ${a} of them` : ' and take one group'}.`
          : `${it.total} \u00f7 ${b} = ${it.total / b}${a > 1 ? `, and ${a} \u00d7 ${it.total / b} = ${want}` : ''}. Plant ${want} ${word} plots.`;
      }
      if (lv >= 2) return `Look at the equation: ${it.total} \u2212 ${c.F} \u2212 ${c.V} = ${c.A}. Put the available plots on top and all ${it.total} plots on the bottom.`;
      switch (r.err) {
        case 'select': return 'Available plots have nothing planted. Count only the empty plots, and tap each one.';
        case 'complement': return 'That fraction is the planted part. The question asks for the part that is still available.';
        case 'part-part': return `The bottom number is the whole garden: all ${it.total} plots, not only the planted ones.`;
        case 'denominator': return 'How many plots make up the whole garden? That number goes on the bottom.';
        case 'zero': return 'The bottom number counts the plots in the whole garden. It can never be 0.';
        default: return 'How many plots are in the whole garden? How many are taken? What is left?';
      }
    },
    show(r) {
      const it = r.item, c = counts(r);
      if (it.plan) {
        r.plots = Array(it.total).fill('e');
        for (let i = 0; i < c.F; i++) r.plots[i] = 'f';
        for (let i = c.F; i < c.F + c.V; i++) r.plots[i] = 'v';
      } else r.sel = new Set(it.layout.split('').map((k, i) => k === 'e' ? i : -1).filter(i => i > -1));
      r.num = String(c.A); r.den = String(it.total);
    },
    explain(r) {
      const it = r.item, c = counts(r), N = it.total, g = gcd(c.A, N);
      const simp = g > 1 ? ` = ${frac(c.A / g, N / g)}` : '';
      if (!it.plan) {
        return `<span class="mline">${N} \u2212 ${c.F} \u2212 ${c.V} = ${c.A} plots available.</span>
          <span class="mline">As fractions of the whole garden: 1 \u2212 ${frac(c.F, N)} \u2212 ${frac(c.V, N)} = ${frac(c.A, N)}${simp}</span>
          <span class="mline">The whole garden is 1, which is ${frac(N, N)}. Every plot is ${frac(1, N)} of it.</span>`;
      }
      const [fa, fb] = it.plan.flowers, [va, vb] = it.plan.veg;
      const L = fb * vb / gcd(fb, vb);
      return `<span class="mline">${frac(fa, fb)} of ${N} = ${c.F} flower plots, and ${frac(va, vb)} of ${N} = ${c.V} vegetable plots.</span>
        <span class="mline">1 \u2212 ${frac(fa, fb)} \u2212 ${frac(va, vb)} = ${frac(L, L)} \u2212 ${frac(fa * L / fb, L)} \u2212 ${frac(va * L / vb, L)} = ${frac(L - fa * L / fb - va * L / vb, L)}</span>
        <span class="mline">${L} is the least common denominator of ${fb} and ${vb}. With ${N} plots that is ${frac(c.A, N)}${simp} of the garden.</span>`;
    }
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
