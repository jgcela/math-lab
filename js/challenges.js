/* Challenges: open puzzles with more than one solution. */
(function (CM) {
  'use strict';
  const C = CM.Challenge = {};
  let root = null, id = null, st = null, focusSel = null;

  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const key = g => g.join('');

  C.open = function (cid, el) {
    root = el; id = cid;
    st = { grid: Array(9).fill(null), sel: 4, hint: 0, msg: null, tone: null, solved: false };
    render();
  };
  C.close = () => { id = null; };
  C.active = () => !!id;

  function rec() { const s = CM.store.state; return s.challenges[id] || (s.challenges[id] = { attempts: 0, found: [] }); }

  function render() {
    const ch = CM.CHALLENGES.find(c => c.id === id), g = st.grid, R = rec();
    const sums = LINES.map(l => l.every(i => g[i]) ? l.reduce((s, i) => s + g[i], 0) : null);
    const cell = i => `<button type="button" class="ms-cell${st.sel === i ? ' sel' : ''}${st.hint >= 2 && !g[i] && i === 4 ? ' target' : ''}" data-act="cell" data-i="${i}" aria-label="Square ${i + 1}${g[i] ? ', ' + g[i] : ', empty'}"${st.solved ? ' disabled' : ''}>${g[i] || ''}</button>`;
    const sum = k => `<span class="ms-sum${sums[k] === null ? '' : sums[k] === 15 ? ' good' : ''}">${sums[k] === null ? '' : sums[k]}</span>`;
    root.innerHTML = `<p class="eyebrow"><a href="#challenges">Challenges</a></p>
      <h1 class="mtitle">${ch.title}</h1>
      <p class="goal">${ch.goal}</p>
      <section class="card">
        <div class="ms-wrap">
          <div class="ms">
            ${[0, 1, 2].map(rw => `${[0, 1, 2].map(c => cell(rw * 3 + c)).join('')}${sum(rw)}`).join('')}
            ${sum(3)}${sum(4)}${sum(5)}${sum(6)}
          </div>
          <p class="tally">Diagonal sums: ${sums[6] ?? '\u2013'} and ${sums[7] ?? '\u2013'}</p>
        </div>
        <div class="tiles" role="group" aria-label="Numbers">
          ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" class="tile${g.includes(n) ? ' used' : ''}" data-act="num" data-n="${n}"${st.solved ? ' disabled' : ''}>${n}</button>`).join('')}
        </div>
        ${st.msg ? `<div class="tutor ${st.tone === 'good' ? 'good' : st.tone === 'info' ? 'info' : ''}"><span class="who">Tutor</span><p>${st.msg}</p></div>` : ''}
        <div class="actions">
          ${st.solved ? '<button type="button" class="btn btn-primary" data-act="again">Find a different square</button>'
        : `<button type="button" class="btn btn-primary" data-act="check">Check</button><button type="button" class="btn btn-ghost" data-act="clear">Clear square</button><button type="button" class="btn btn-ghost" data-act="hint">Hint</button>`}
        </div>
        <p class="muted">${ch.note} You have found ${R.found.length} of the 8 possible squares.</p>
      </section>`;
    if (focusSel) { const el = root.querySelector(focusSel); if (el) el.focus({ preventScroll: true }); focusSel = null; }
  }

  C.onClick = function (ev) {
    if (!id) return false;
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled || !root.contains(el)) return false;
    const act = el.dataset.act, g = st.grid;
    if (act === 'cell') { st.sel = +el.dataset.i; focusSel = `[data-act="cell"][data-i="${st.sel}"]`; }
    else if (act === 'num') {
      const n = +el.dataset.n, at = g.indexOf(n);
      if (at > -1) g[at] = null;
      g[st.sel] = n;
      const next = g.findIndex(v => !v);
      if (next > -1) st.sel = next;
      focusSel = `[data-act="num"][data-n="${n}"]`;
    } else if (act === 'clear') { g[st.sel] = null; }
    else if (act === 'hint') {
      st.hint++;
      st.msg = st.hint === 1 ? 'The numbers 1 to 9 add up to 45. There are 3 rows, so each row must add up to 45 \u00f7 3. What is that?'
        : st.hint === 2 ? 'Each row adds to 15. The center square is in 4 different lines, more than any other square. Which number from 1 to 9 is in the middle?'
          : 'Put 5 in the center. The even numbers 2, 4, 6, and 8 go in the corners, and each pair of opposite corners adds to 10.';
      st.tone = 'hint';
    } else if (act === 'check') {
      const R = rec(); R.attempts++;
      if (g.some(v => !v)) { st.msg = 'Fill every square first.'; st.tone = 'info'; }
      else {
        const sums = LINES.map(l => l.reduce((s, i) => s + g[i], 0));
        const bad = sums.map((s, k) => s === 15 ? -1 : k).filter(k => k > -1);
        if (!bad.length) {
          st.solved = true;
          const k = key(g), isNew = !R.found.includes(k);
          if (isNew) R.found.push(k);
          st.msg = isNew ? `Every line adds to 15. ${R.found.length === 1 ? 'This is one of 8 magic squares made from 1\u20139.' : `That's ${R.found.length} different squares.`} Each one is a turn or a mirror image of the others. Try to explain why.` : 'Every line adds to 15. You already found this square. Can you find one you haven\'t?';
          st.tone = 'good';
        } else {
          const names = ['top row', 'middle row', 'bottom row', 'left column', 'middle column', 'right column', 'diagonal from top left', 'diagonal from top right'];
          st.msg = `Not yet. These lines don't add to 15: ${bad.map(k => `${names[k]} (${sums[k]})`).join(', ')}.`;
          st.tone = 'hint';
          CM.logMistake({ id: 'challenge:' + id }, 'Magic square lines with unequal sums', g.join(' '));
        }
      }
      CM.store.save();
    } else if (act === 'again') { st = { grid: Array(9).fill(null), sel: 4, hint: 0, msg: null, tone: null, solved: false }; }
    else return false;
    render();
    return true;
  };
})(window.CM);
