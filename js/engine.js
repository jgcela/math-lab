/* Mission engine: runs any mission type through the same loop of
 * challenge \u2192 interaction \u2192 check \u2192 contextual hint \u2192 worked solution \u2192 explanation \u2192 mastery. */
(function (CM) {
  'use strict';
  const { esc, plural } = CM.h;
  const E = CM.Engine = {};
  let r = null, root = null, focusSel = null, timer = null, drag = null, suppressClick = false;
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  E.active = () => !!r;

  E.start = function (missionId, el, opts = {}) {
    const mission = CM.mission(missionId);
    root = el;
    if (!mission) { root.innerHTML = '<p class="muted">Mission not found.</p>'; r = null; return; }
    const prog = CM.store.m(missionId);
    const stretch = !!opts.stretch;
    const { item, tier } = CM.pickItem(mission, prog, stretch);
    clearTimeout(timer); timer = null;
    r = { mission, item, tier, stretch, prog, attempts: 0, hint: 0, solved: false, err: null, msg: null, tone: null, events: [], tick: Date.now(), speak: 'prompt' };
    CM.TYPES[mission.type].init(r);
    CM.store.state.lastMission = missionId;
    CM.store.save();
    render();
  };

  E.stop = function () { CM.Speech.stop(); clearTimeout(timer); timer = null; endDrag(); if (r) { tick(); CM.store.save(); } r = null; };

  function tick() {
    if (!r) return;
    const now = Date.now();
    r.prog.time += Math.min((now - r.tick) / 1000, 90);
    r.tick = now;
  }

  const type = () => CM.TYPES[r.mission.type];

  function check() {
    if (r.solved) return;
    tick();
    const res = type().check(r);
    if (res.ok) return finish(r.attempts > 0 || r.hint > 0, false, res.note);
    if (res.nudge) { r.msg = res.nudge; r.tone = 'info'; r.speak = 'msg'; return render(); }
    r.err = res.err;
    CM.logMistake(r.mission, res.tag, type().text(r) + (r.answer ? ` \u2192 ${r.answer}` : ''));
    r.attempts++; r.hint = Math.min(r.hint + 1, 2);
    r.msg = (r.hint === 1 ? 'Not yet. ' : '') + type().hint(r, r.hint); r.tone = 'hint'; r.speak = 'msg';
    CM.store.save();
    render();
  }

  function askHint() {
    if (r.solved) return;
    tick();
    CM.store.state.hints++;
    if (r.hint >= 2) { type().show(r); r.hint = 3; return finish(true, true); }
    r.hint++; r.err = null;
    r.msg = type().hint(r, r.hint); r.tone = 'hint'; r.speak = 'msg';
    CM.store.save();
    render();
  }

  function finish(helped, shown, note) {
    r.solved = true;
    const events = CM.recordResult(r.mission, r.prog, r.tier, helped, r.stretch);
    r.events = events;
    const parts = [];
    if (shown) parts.push('Here is a worked solution. Read it, then try the next one on your own.');
    else parts.push(helped ? 'Correct. You found your mistake and fixed it.' : 'Correct.');
    if (note) parts.push(note);
    if (events.includes('mastered')) parts.push('Mission mastered.');
    else if (events.includes('tier-up')) parts.push('The next problems will be a step harder.');
    else if (helped && !r.stretch) parts.push('A problem like this will come back for practice.');
    r.msg = parts.join(' ');
    r.tone = shown ? 'info' : 'good';
    r.speak = 'msg';
    focusSel = '[data-act="next"]';
    CM.store.save();
    render();
  }

  function masteryDots(prog) {
    const n = prog.mastered ? CM.rules.masteryRun : Math.min(prog.streak, CM.rules.masteryRun);
    return Array.from({ length: CM.rules.masteryRun }, (_, i) => `<span class="dot${i < n ? ' on' : ''}"></span>`).join('');
  }

  E.chips = function (mission) {
    return mission.standards.map(id => {
      const o = CM.objective(id);
      return `<a class="std" href="#skill-${id.replace(/\./g, '-')}" title="${o ? esc(o.text) : ''}">${id}</a>`;
    }).join('') + (mission.scope || []).map(id => {
      const row = CM.scopeRow(id);
      return row ? `<span class="std ss" title="Scope & Sequence: ${esc(row.skill)}">S&amp;S</span>` : '';
    }).join('');
  };

  function render() {
    if (!r || !root) return;
    const m = r.mission, p = r.prog, t = type();
    const tierLabel = r.stretch ? 'Stretch problem' : `Level ${Math.min(r.tier, CM.rules.topTier)} of ${CM.rules.topTier}`;
    const prereqEvt = r.events.find(e => e.startsWith('prereq:'));
    let html = `<div class="mhead">
        <div class="mmeta">
          <p class="eyebrow">${CM.grade(m.grade).label} \u00b7 ${tierLabel}</p>
          <h1 class="mtitle">${esc(m.title)}</h1>
          <p class="goal">${esc(m.goal)}</p>
          <div class="chips">${E.chips(m)}</div>
        </div>
        ${voiceControls(m)}
        <div class="mastery" aria-label="${p.mastered ? 'Mastered' : `${Math.min(p.streak, 3)} of 3 correct in a row`}">
          <div class="dots">${masteryDots(p)}</div>
          <span>${p.mastered ? 'Mastered' : 'In a row'}</span>
        </div>
      </div>
      <section class="card mission" aria-live="polite">`;
    html += t.view(r);
    if (r.msg) html += `<div class="tutor ${r.tone === 'good' ? 'good' : r.tone === 'info' ? 'info' : ''}"><span class="who">Tutor</span><p>${r.msg}</p></div>`;
    if (r.solved) html += `<div class="explain"><p class="eyebrow">Why it works</p><p>${t.explain(r)}</p></div>`;
    if (prereqEvt) {
      const ids = prereqEvt.slice(7).split(',');
      html += `<div class="tutor info"><span class="who">Tip</span><p>This mission builds on ${ids.map(id => `<a href="#mission-${id}">${esc(CM.mission(id).title)}</a>`).join(' and ')}. Practicing that first may help.</p></div>`;
    }
    html += '<div class="actions">';
    if (r.solved) {
      html += `<button type="button" class="btn btn-primary" data-act="next">${p.mastered && !r.stretch && r.events.includes('mastered') ? 'Keep practicing' : 'Next problem'}</button>`;
      if (p.mastered && m.items.some(i => i.tier === CM.rules.stretchTier)) html += `<button type="button" class="btn btn-ghost" data-act="stretch">Try a stretch problem</button>`;
    } else {
      const isChoice = typeof t.choice === 'function' ? t.choice(r) : t.choice;
      if (!isChoice) html += `<button type="button" class="btn btn-primary" data-act="check"${r.running ? ' disabled' : ''}>${t.checkLabel || 'Check'}</button>`;
      html += `<button type="button" class="btn btn-ghost" data-act="hint"${r.running ? ' disabled' : ''}>${r.hint >= 2 ? 'Show me' : 'Hint'}</button>`;
    }
    html += '</div></section>';
    html += `<details class="about"><summary>About this mission</summary>
      ${m.standards.map(id => { const o = CM.objective(id); return o ? `<p><b>${id}</b> \u00b7 ${esc(o.gradeName)}, ${esc(o.domain.name)}${o.sub ? ' \u00b7 ' + esc(o.sub.name) : ''}: ${esc(o.text)} <span class="muted">(page ${o.page})</span></p>` : ''; }).join('')}
      ${(m.scope || []).map(id => { const s = CM.scopeRow(id); return s ? `<p><b>Scope & Sequence</b> \u00b7 ${esc(s.skill)}: ${Object.entries(s.marks).map(([g, k]) => `${g === 'PK' ? 'PK' : g === 'K' ? 'K' : 'Gr ' + g} ${k}`).join(', ')}</p>` : ''; }).join('')}
      ${m.alignNote ? `<p class="muted">${esc(m.alignNote)}</p>` : ''}
      ${m.buildsOn ? `<p>Builds on ${m.buildsOn.map(id => { const o = CM.objective(id); return `<b>${id}</b>${o ? ' (' + esc(o.text) + ')' : ''}`; }).join(', ')}.</p>` : ''}
      ${m.prereqs.length ? `<p>Suggested first: ${m.prereqs.map(id => `<a href="#mission-${id}">${esc(CM.mission(id).title)}</a> ${(CM.store.peek(id) || {}).mastered ? '(mastered)' : ''}`).join(', ')}. <span class="muted">This order is a suggestion of this app, not part of the official standards.</span></p>` : ''}
      <p><b>Catholic disposition</b> \u00b7 \u201c${esc(m.disposition)}\u201d <span class="muted">${m.dispositionSource ? esc(m.dispositionSource) : (m.grade === '8' ? 'Algebra I dispositions, page 30' : CM.grade(m.grade).label + ' dispositions')}</span></p>
      <p class="muted">Mastery rule: 3 correct in a row without hints, including one at level 3. A problem solved with help comes back for review.</p>
    </details>`;
    root.innerHTML = html;
    if (r.speak) { const what = r.speak; r.speak = null; if (CM.Speech.active(m)) CM.Speech.say(spoken(what)); }
    if (focusSel) { const el = root.querySelector(focusSel); if (el) el.focus({ preventScroll: true }); focusSel = null; }
  }

  /* ---------- read-aloud ---------- */
  const SPEAKER = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const MUTED = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  function voiceControls(m) {
    if (!CM.Speech.offered(m) || !CM.Speech.supported()) return '';
    const on = CM.Speech.on();
    return `<div class="voice">
      ${on ? `<button type="button" class="btn btn-say" data-act="say" aria-label="Hear it again">${SPEAKER}<span>Hear it</span></button>` : ''}
      <button type="button" class="btn btn-ghost btn-voice" data-act="voice" aria-pressed="${on}" aria-label="Read aloud" title="${on ? 'Turn off reading aloud' : 'Turn on reading aloud'}">${on ? SPEAKER : MUTED}</button>
    </div>`;
  }
  /* What to read: the problem's instructions, the tutor's message, or both. A solved problem adds the explanation. */
  function spoken(what) {
    const t = type(), parts = [];
    if (what === 'prompt' || what === 'all') parts.push(CM.Speech.prompt(t.view(r)));
    if ((what === 'msg' || what === 'all') && r.msg) parts.push(CM.Speech.plain(r.msg));
    if (r.solved && what !== 'prompt') parts.push(CM.Speech.plain(t.explain(r)));
    return parts.filter(Boolean).join(' ');
  }

  /* Runs a type's animated check (e.g. the robot walking its program), then checks the result. */
  function run() {
    const t = type(), res = t.animate.start(r);
    if (res && res.nudge) { r.msg = res.nudge; r.tone = 'info'; render(); return; }
    r.msg = null;
    render();
    const me = r, delay = reduced() ? 120 : 420;
    const stepFn = () => {
      if (r !== me) return;
      if (t.animate.step(r)) { render(); timer = setTimeout(stepFn, delay); }
      else { r.running = false; check(); }
    };
    timer = setTimeout(stepFn, delay);
  }

  function apply(res) {
    if (!res) return false;
    tick();
    if (res.log) { CM.logMistake(r.mission, res.log, type().text(r)); CM.store.save(); }
    if (res.msg) { r.msg = res.msg; r.tone = res.tone || 'info'; r.speak = 'msg'; }
    else if (res.say && CM.Speech.active(r.mission)) CM.Speech.say(res.say);
    if (res.focus) focusSel = res.focus;
    if (res.check) { check(); return true; }
    render();
    return true;
  }

  E.onClick = function (ev) {
    if (!r) return false;
    if (suppressClick) { suppressClick = false; return true; }
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled || !root.contains(el)) return false;
    const act = el.dataset.act;
    if (act === 'say') { CM.Speech.say(spoken(r.solved ? 'msg' : 'all')); return true; }
    if (act === 'voice') { CM.Speech.setOn(!CM.Speech.on()); if (CM.Speech.on()) r.speak = r.solved ? 'msg' : 'all'; focusSel = '[data-act="voice"]'; render(); return true; }
    if (r.running) return true;
    if (act === 'check') { if (type().animate && !r.solved) run(); else check(); return true; }
    if (act === 'hint') { askHint(); return true; }
    if (act === 'next') { tick(); E.start(r.mission.id, root, { stretch: r.stretch }); return true; }
    if (act === 'stretch') { tick(); E.start(r.mission.id, root, { stretch: true }); return true; }
    if (r.solved) return false;
    return apply(type().handle && type().handle(r, act, el));
  };

  /* ---------- drag and drop ----------
   * Any element with data-drag="value" can be dragged onto an element with data-drop="slot".
   * The type receives handle(r, 'drop', { dataset: { drag, drop } }).
   * A short press without movement falls through to the normal click, so tap-to-pick, tap-to-place also works.
   * An element with data-dial turns a [data-hand] inside it; the type receives handle(r, 'dial', { dataset: { angle } }).
   */
  function endDrag() {
    if (!drag) return;
    if (drag.ghost) drag.ghost.remove();
    if (drag.src) drag.src.classList.remove('dragging');
    if (drag.over) drag.over.classList.remove('drop-over');
    drag = null;
  }
  const dialAngle = (dial, ev) => {
    const b = dial.getBoundingClientRect();
    const a = Math.atan2(ev.clientX - (b.left + b.width / 2), -(ev.clientY - (b.top + b.height / 2))) * 180 / Math.PI;
    return (a + 360) % 360;
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('pointerdown', ev => {
      if (!r || r.solved || r.running || !root || ev.button > 0) return;
      const dial = ev.target.closest('[data-dial]');
      if (dial && root.contains(dial) && !ev.target.closest('[data-act]')) {
        const hand = dial.querySelector('[data-hand]');
        drag = { dial, hand, id: ev.pointerId };
        const a = dialAngle(dial, ev);
        if (hand) hand.setAttribute('transform', `rotate(${a} ${hand.dataset.cx} ${hand.dataset.cy})`);
        drag.angle = a;
        try { dial.setPointerCapture(ev.pointerId); } catch (e) { }
        ev.preventDefault();
        return;
      }
      const src = ev.target.closest('[data-drag]');
      if (!src || !root.contains(src) || src.disabled) return;
      drag = { src, x: ev.clientX, y: ev.clientY, id: ev.pointerId, ghost: null, over: null };
    });
    document.addEventListener('pointermove', ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      if (drag.dial) {
        drag.angle = dialAngle(drag.dial, ev);
        if (drag.hand) drag.hand.setAttribute('transform', `rotate(${drag.angle} ${drag.hand.dataset.cx} ${drag.hand.dataset.cy})`);
        ev.preventDefault();
        return;
      }
      if (!drag.ghost) {
        if (Math.hypot(ev.clientX - drag.x, ev.clientY - drag.y) < 8) return;
        const b = drag.src.getBoundingClientRect();
        const g = drag.src.cloneNode(true);
        g.removeAttribute('id');
        g.classList.add('ghost');
        Object.assign(g.style, { position: 'fixed', left: '0', top: '0', width: b.width + 'px', height: b.height + 'px', margin: '0', pointerEvents: 'none', zIndex: '50' });
        document.body.appendChild(g);
        drag.ghost = g; drag.w = b.width; drag.h = b.height;
        drag.src.classList.add('dragging');
      }
      drag.ghost.style.transform = `translate(${ev.clientX - drag.w / 2}px, ${ev.clientY - drag.h / 2}px) scale(1.08)`;
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const over = under && under.closest('[data-drop]');
      const ok = over && root.contains(over) ? over : null;
      if (ok !== drag.over) { if (drag.over) drag.over.classList.remove('drop-over'); if (ok) ok.classList.add('drop-over'); drag.over = ok; }
      ev.preventDefault();
    }, { passive: false });
    const finishDrag = ev => {
      if (!drag || ev.pointerId !== drag.id) return;
      const d = drag;
      if (d.dial) {
        endDrag();
        suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
        if (r && !r.solved) apply(type().handle(r, 'dial', { dataset: { angle: String(d.angle) } }));
        return;
      }
      const moved = !!d.ghost, over = d.over, val = d.src.dataset.drag;
      endDrag();
      if (!moved) return;
      suppressClick = true; setTimeout(() => { suppressClick = false; }, 0);
      if (ev.type === 'pointerup' && over && r && !r.solved) apply(type().handle(r, 'drop', { dataset: { drag: val, drop: over.dataset.drop } }));
    };
    document.addEventListener('pointerup', finishDrag);
    document.addEventListener('pointercancel', finishDrag);
  }

  E.onInput = function (ev) {
    if (!r) return;
    const f = ev.target.dataset && ev.target.dataset.field;
    if (!f) return;
    ev.target.value = ev.target.value.replace(f === 'answer' && r.mission.type === 'balance' ? /[^0-9-]/g : /\D/g, '');
    r[f] = ev.target.value;
  };
  E.onKey = function (ev) {
    if (!r) return;
    const t = ev.target;
    // Picture parts drawn in SVG act as buttons: Enter or Space taps them.
    if ((ev.key === 'Enter' || ev.key === ' ') && t.getAttribute && t.getAttribute('role') === 'button' && t.tagName !== 'BUTTON' && t.dataset && t.dataset.act) {
      ev.preventDefault();
      t.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return;
    }
    if (ev.key !== 'Enter' || !(t.dataset && t.dataset.field)) return;
    ev.preventDefault();
    check();
  };
})(window.CM);
