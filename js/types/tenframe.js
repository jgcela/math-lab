/* Kindergarten mission type: touch-and-count, and build a group on ten-frames. */
(function (CM) {
  'use strict';
  const T = CM.TYPES;

  const SHAPES = {
    apple: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 12c-4-3-14-3-14 9 0 9 7 15 10 15 2 0 3-1 4-1s2 1 4 1c3 0 10-6 10-15 0-12-10-12-14-9z" fill="var(--t1)"/><path d="M20 12c0-4 2-7 5-8" stroke="var(--ink)" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M22 9c3-3 7-3 9-1-3 3-6 3-9 1z" fill="var(--t3)"/></svg>',
    star: '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4l4.7 10.6 11.5 1.1-8.7 7.7 2.6 11.3L20 28.8 9.9 34.7l2.6-11.3-8.7-7.7 11.5-1.1z" fill="var(--t2)" stroke="color-mix(in srgb,var(--t2) 70%,var(--ink))" stroke-width="1.5" stroke-linejoin="round"/></svg>'
  };
  function slots(n, seed) {
    const all = Array.from({ length: 15 }, (_, i) => i);
    let s = seed * 9301 + 49297;
    for (let i = all.length - 1; i > 0; i--) { s = (s * 9301 + 49297) % 233280; const j = Math.floor(s / 233280 * (i + 1));[all[i], all[j]] = [all[j], all[i]]; }
    return all.slice(0, n).map((k, i) => ({ col: k % 5, row: Math.floor(k / 5), dx: ((i * 37) % 21) - 10, dy: ((i * 53) % 17) - 8 }));
  }

  T.tenframe = {
    init(r) { r.order = []; r.answer = null; r.filled = new Set(); },
    text(r) { return r.item.mode === 'count' ? `Count ${r.item.n} ${r.item.thing}s` : `Build ${r.item.n}`; },
    view(r) {
      const { n, mode, thing } = r.item;
      if (mode === 'count') {
        const pos = slots(n, n + (thing === 'star' ? 7 : 0));
        const objs = pos.map((p, i) => {
          const k = r.order.indexOf(i);
          return `<button type="button" class="obj${k > -1 ? ' counted' : ''}" data-act="tap" data-i="${i}" style="grid-column:${p.col + 1};grid-row:${p.row + 1};translate:${p.dx}% ${p.dy}%" aria-label="${thing} ${i + 1}${k > -1 ? ', counted as ' + (k + 1) : ''}"${r.solved ? ' disabled' : ''}>${SHAPES[thing]}${k > -1 ? `<b>${k + 1}</b>` : ''}</button>`;
        }).join('');
        // On the full-screen stage, four big answer cards instead of eleven small ones. The right one moves around.
        const first = r.mission && r.mission.stage ? Math.max(0, n - 1 - (n % 3)) : 0;
        const tiles = Array.from({ length: r.mission && r.mission.stage ? 4 : 11 }, (_, k) => first + k).map(i => `<button type="button" class="tile${r.answer === i ? ' picked' : ''}" data-act="pick" data-n="${i}"${r.solved ? ' disabled' : ''}>${i}</button>`).join('');
        return `<p class="prompt">How many ${thing}s?</p>
          <p class="sub">Touch each one as you count.</p>
          <div class="scatter">${objs}</div>
          <div class="tiles" role="group" aria-label="How many">${tiles}</div>`;
      }
      const frames = Math.max(2, Math.ceil(n / 10)), hintTargets = r.hint >= 2 && !r.solved;
      let html = '';
      for (let f = 0; f < frames; f++) {
        let cells = '';
        for (let c = 0; c < 10; c++) {
          const i = f * 10 + c, on = r.filled.has(i);
          cells += `<button type="button" class="cell${on ? ' on' : ''}${hintTargets && i < n ? ' target' : ''}" data-act="fill" data-i="${i}" aria-pressed="${on}" aria-label="Box ${c + 1} of frame ${f + 1}"${r.solved ? ' disabled' : ''}></button>`;
        }
        html += `<div class="frame" role="group" aria-label="Ten-frame ${f + 1}">${cells}</div>`;
      }
      return `<p class="prompt">Make a group of <span class="big-inline">${n}</span>.</p>
        <p class="sub">Tap boxes to fill them.</p>
        <div class="frames">${html}</div>
        <p class="tally" aria-live="polite">${r.hint >= 1 || r.solved ? `Filled: ${r.filled.size}` : ''}</p>`;
    },
    handle(r, act, el) {
      const i = +el.dataset.i;
      // `say` is read aloud for pre-readers: the count as each object is touched, so the child hears one number per object.
      if (act === 'tap') { const k = r.order.indexOf(i); k > -1 ? r.order.splice(k, 1) : r.order.push(i); return { focus: `[data-act="tap"][data-i="${i}"]`, say: k > -1 ? '' : String(r.order.length) }; }
      if (act === 'pick') { r.answer = +el.dataset.n; return { focus: `[data-act="pick"][data-n="${el.dataset.n}"]`, say: el.dataset.n }; }
      if (act === 'fill') { r.filled.has(i) ? r.filled.delete(i) : r.filled.add(i); return { focus: `[data-act="fill"][data-i="${i}"]`, say: String(r.filled.size) }; }
    },
    check(r) {
      const { n, mode } = r.item;
      if (mode === 'count') {
        if (r.answer === null) return { nudge: 'Tap the number that tells how many.' };
        if (r.answer === n) return { ok: true };
        if (r.order.length < n && r.answer === r.order.length) return { err: 'skipped', tag: 'Skipped objects while counting' };
        return { err: 'count', tag: 'Counted a group incorrectly' };
      }
      if (r.filled.size === n) return { ok: true };
      return { err: r.filled.size < n ? 'less' : 'more', tag: 'Built a group with the wrong number of objects' };
    },
    hint(r, lv) {
      const { n, mode, thing } = r.item;
      if (mode === 'count') {
        if (lv >= 2) { r.order = Array.from({ length: n }, (_, i) => i); return `Every ${thing} has a number now. The last number tells how many.`; }
        return r.err === 'skipped' ? `Some ${thing}s don't have a number yet. Touch each one once.` : `Touch each ${thing} one time. Say the number as you touch it.`;
      }
      if (lv >= 2) return n > 10 ? `Fill the outlined boxes. One full frame is 10. Then ${n - 10 * Math.floor(n / 10)} more.` : 'Fill the outlined boxes.';
      if (r.err === 'more') return `You have ${r.filled.size}. That's too many. Take some away.`;
      if (r.err === 'less') return `You have ${r.filled.size}. You need more.`;
      return n > 10 ? `A full ten-frame holds 10. ${n} is ${Math.floor(n / 10) * 10} and ${n % 10} more.` : 'Count each box as you fill it.';
    },
    show(r) {
      const { n, mode } = r.item;
      if (mode === 'count') { r.order = Array.from({ length: n }, (_, i) => i); r.answer = n; }
      else r.filled = CM.h.range(n);
    },
    explain(r) {
      const { n, mode, thing } = r.item;
      if (mode === 'count') return `Each ${thing} got one number: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. The last number you say is how many there are: ${n}.`;
      const tens = Math.floor(n / 10), ones = n % 10;
      return n >= 10 ? `${n} is ${tens === 1 ? '1 full ten-frame' : tens + ' full ten-frames'}${ones ? ` and ${ones} more` : ''}: ${tens * 10}${ones ? ` + ${ones}` : ''} = ${n}.` : `${n} boxes are full. ${10 - n} are empty. ${n} + ${10 - n} = 10.`;
    }
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
