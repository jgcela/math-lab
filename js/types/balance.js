/* Grade 8 (proposed pathway) mission type: solve linear equations on a balance. Also used by the Math Lab. */
(function (CM) {
  'use strict';
  const T = CM.TYPES;

  const side = (x, k) => {
    const parts = [];
    if (x) parts.push(x === 1 ? 'x' : `${x}x`);
    if (k) parts.push(String(k));
    return parts.join(' + ') || '0';
  };
  const eqText = e => `${side(e.a, e.b)} = ${side(e.c, e.d)}`;
  const isolated = e => (e.a === 1 && e.b === 0 && e.c === 0) || (e.c === 1 && e.d === 0 && e.a === 0);
  const solution = it => (it.d - it.b) / (it.a - it.c);
  const term = (a, n) => a === 1 ? `${n}` : `${a}(${n})`;

  function pan(x, k) {
    let s = '';
    for (let i = 0; i < x; i++) s += '<span class="xbox">x</span>';
    for (let i = 0; i < k; i++) s += '<span class="wt" aria-hidden="true"></span>';
    return s || '<span class="empty-pan">empty</span>';
  }
  CM.viz.balance = function (e, tilt) {
    const deg = tilt ? (tilt > 0 ? -7 : 7) : 0; // tilt > 0: left side heavier
    return `<div class="scale" role="img" aria-label="Balance: left pan ${side(e.a, e.b)}, right pan ${side(e.c, e.d)}${tilt ? ', tipped' : ', level'}">
      <div class="beam" style="transform:rotate(${deg}deg)">
        <div class="pan left"><div class="load">${pan(e.a, e.b)}</div></div>
        <div class="pan right"><div class="load">${pan(e.c, e.d)}</div></div>
      </div>
      <div class="post"></div>
    </div>
    <p class="legend"><span><i class="lg-x">x</i>one x-box</span><span><i class="lg-w"></i>weight of 1</span></p>`;
  };

  function canonicalSteps(it) {
    const e = { ...it }, out = [];
    if (e.c > 0) { const k = e.c; e.a -= k; e.c = 0; out.push({ op: `Remove ${k === 1 ? '1 x-box' : k + ' x-boxes'} from both sides`, eq: eqText(e) }); }
    if (e.b > 0) { const k = e.b; e.b = 0; e.d -= k; out.push({ op: `Remove ${k} from both sides`, eq: eqText(e) }); }
    if (e.a > 1) { const k = e.a; e.a = 1; e.d /= k; out.push({ op: `Split both sides into ${k} equal groups (divide by ${k})`, eq: eqText(e) }); }
    return out;
  }

  T.balance = {
    init(r) { r.eq = { ...r.item }; r.steps = []; r.op = 'w'; r.k = 1; r.answer = ''; r.tilt = 0; },
    text(r) { return eqText(r.item); },
    view(r) {
      const e = r.eq, tilt = r.tilt; r.tilt = 0;
      const ops = [['w', 'Remove weights'], ['x', 'Remove x-boxes'], ['div', 'Split into equal groups']];
      const dis = r.solved ? ' disabled' : '';
      const steps = r.steps.length ? `<ol class="steps">${r.steps.map(s => `<li><span>${s.op}</span><code>${s.eq}</code></li>`).join('')}</ol>` : '';
      return `<p class="prompt">Find x. Keep the balance level.</p>
        <p class="big eqline" aria-live="polite">${eqText(e)}</p>
        ${CM.viz.balance(e, tilt)}
        ${steps}
        ${r.solved ? '' : `<div class="opbar">
          <div class="seg-group" role="group" aria-label="Operation">${ops.map(([k, l]) => `<button type="button" class="segbtn${r.op === k ? ' picked' : ''}" data-act="op" data-op="${k}" aria-pressed="${r.op === k}">${l}</button>`).join('')}</div>
          ${CM.viz.stepper(r.op === 'div' ? 'Groups' : 'How many', 'k', r.k, r.op === 'div' ? 2 : 1, 30, false)}
          <div class="actions tight">
            <button type="button" class="btn btn-secondary" data-act="both">Do it to both sides</button>
            <button type="button" class="btn btn-ghost" data-act="left">Left side only</button>
          </div>
        </div>`}
        <div class="eq"><label for="ans">x =</label><input class="ans" id="ans" data-field="answer" inputmode="numeric" pattern="-?[0-9]*" maxlength="4" value="${r.answer}"${dis}></div>`;
    },
    handle(r, act, el) {
      const e = r.eq;
      if (act === 'op') { r.op = el.dataset.op; if (r.op === 'div' && r.k < 2) r.k = 2; return { focus: `[data-act="op"][data-op="${r.op}"]` }; }
      if (act === 'k+' || act === 'k-') { r.k = CM.h.clamp(r.k + (act === 'k+' ? 1 : -1), r.op === 'div' ? 2 : 1, 30); return { focus: `[data-act="${act}"]` }; }
      if (act === 'left') {
        r.tilt = -1;
        return { msg: 'The balance tipped. Changing only one side makes the two sides unequal, so it is no longer the same equation. Whatever you do to one side, do to the other.', tone: 'hint', log: 'Changed only one side of an equation', focus: '[data-act="both"]' };
      }
      if (act === 'both') {
        const k = r.k;
        if (r.op === 'w') {
          if (e.b < k || e.d < k) return { msg: `You can't remove ${k} from both sides. The left has ${e.b} and the right has ${e.d}.`, tone: 'info' };
          e.b -= k; e.d -= k; r.steps.push({ op: `Remove ${k} from both sides`, eq: eqText(e) });
        } else if (r.op === 'x') {
          if (e.a < k || e.c < k) return { msg: `You can't remove ${k === 1 ? '1 x-box' : k + ' x-boxes'} from both sides. The left has ${e.a} and the right has ${e.c}.`, tone: 'info' };
          e.a -= k; e.c -= k; r.steps.push({ op: `Remove ${k === 1 ? '1 x-box' : k + ' x-boxes'} from both sides`, eq: eqText(e) });
        } else {
          if ([e.a, e.b, e.c, e.d].some(v => v % k)) return { msg: `Not everything splits evenly into ${k} groups. Try removing the extra weights or x-boxes first.`, tone: 'info', log: 'Tried to divide before isolating the variable term' };
          e.a /= k; e.b /= k; e.c /= k; e.d /= k; r.steps.push({ op: `Split both sides into ${k} groups (divide by ${k})`, eq: eqText(e) });
        }
        if (isolated(e)) return { msg: `${eqText(e)}. One x-box balances ${e.a ? e.d : e.b}. Type the value of x.`, tone: 'info', focus: '#ans' };
        return { focus: '[data-act="both"]' };
      }
    },
    check(r) {
      const it = r.item, n = parseInt(r.answer, 10), x = solution(it);
      if (isNaN(n)) return { nudge: 'Use the balance to get x by itself, then type the value of x.' };
      if (n === x) return { ok: true, note: isolated(r.eq) ? '' : 'You found x without finishing on the balance. The check below shows why it works.' };
      if (it.c === 0 && it.a > 1 && n === it.d - it.b) return { err: 'nodivide', tag: 'Undid the addition but not the multiplication' };
      return { err: 'answer', tag: 'Gave a value that does not balance the equation' };
    },
    hint(r, lv) {
      const e = r.eq, it = r.item;
      if (r.err === 'answer' || r.err === 'nodivide') {
        const n = parseInt(r.answer, 10);
        if (lv === 1 && !isNaN(n)) return `Check your value: put ${n} in for x. The left side is ${term(it.a, n)}${it.b ? ` + ${it.b}` : ''} = ${it.a * n + it.b}, but the right side is ${it.c ? `${term(it.c, n)} + ${it.d} = ${it.c * n + it.d}` : it.d}.`;
      }
      if (e.a > 0 && e.c > 0) return lv === 1 ? 'There are x-boxes on both pans. Take the same number of x-boxes off each side.' : `Choose \u201cRemove x-boxes\u201d, set it to ${Math.min(e.a, e.c)}, and do it to both sides.`;
      const xs = e.a ? e.a : e.c, ws = e.a ? e.b : e.d, other = e.a ? e.d : e.b;
      if (ws > 0) return lv === 1 ? `The x-boxes share their pan with ${ws} ${ws === 1 ? 'weight' : 'weights'}. Remove those weights from both sides.` : `Choose \u201cRemove weights\u201d, set it to ${ws}, and do it to both sides.`;
      if (xs > 1) return lv === 1 ? `${xs} x-boxes balance ${other}. Split both sides into ${xs} equal groups.` : `Choose \u201cSplit into equal groups\u201d, set it to ${xs}, and do it to both sides.`;
      return `One x-box balances ${other}. So x = ${other}.`;
    },
    show(r) {
      const it = r.item, x = solution(it);
      r.steps = canonicalSteps(it); r.eq = { a: 1, b: 0, c: 0, d: x }; r.answer = String(x);
    },
    explain(r) {
      const it = r.item, x = solution(it);
      const steps = r.steps.length ? r.steps : canonicalSteps(it);
      return `<span class="mline"><code>${eqText(it)}</code></span>
        ${steps.map(s => `<span class="mline">${s.op}: <code>${s.eq}</code></span>`).join('')}
        <span class="mline">Check: ${term(it.a, x)}${it.b ? ` + ${it.b}` : ''} = ${it.a * x + it.b} and ${it.c ? `${term(it.c, x)} + ` : ''}${it.d} = ${it.c * x + it.d}. Both sides are equal, so x = ${x} is true.</span>
        <span class="mline">Doing the same thing to both sides keeps them equal. That is why each step gives an equation with the same solution.</span>`;
    }
  };
  CM.balanceHelpers = { eqText, isolated, solution, side };
})(typeof window !== 'undefined' ? window.CM : global.CM);
