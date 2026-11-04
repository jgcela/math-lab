/* App shell: routing, student dashboard, learning path, Math Lab and Challenges indexes, parent and teacher dashboard. */
(function (CM) {
  'use strict';
  const { esc, plural, fmtTime } = CM.h;
  const $ = s => document.querySelector(s);
  let storage = null;
  try { storage = window.localStorage; } catch (e) { }
  CM.store.load(storage);
  const S = () => CM.store.state;

  const view = $('#view');
  let route = { name: 'home' }, highlight = null, confirmReset = false;
  let form = null, formErr = '', confirmDel = null; // profile form state: null | { mode: 'add' | 'edit', id, color }

  /* ---------- routing ---------- */
  function parse(hash) {
    const h = (hash || '').replace(/^#/, '');
    if (!h || h === 'home') return { name: 'home' };
    let m;
    if ((m = h.match(/^path(?:-(\w+))?$/))) return { name: 'path', grade: m[1] || S().profile.grade };
    if ((m = h.match(/^skill-([\w-]+)$/))) {
      const id = m[1].replace(/-/g, '.'), o = CM.objective(id);
      return { name: 'path', grade: o ? (o.grade === 'ALG1' ? '8' : o.grade) : S().profile.grade, skill: id };
    }
    if ((m = h.match(/^mission-([\w-]+)$/))) return { name: 'mission', id: m[1] };
    if ((m = h.match(/^lab-([\w-]+)$/))) return { name: 'labtool', id: m[1] };
    if (h === 'lab') return { name: 'lab' };
    if (h === 'challenges') return { name: 'challenges' };
    if ((m = h.match(/^challenge-([\w-]+)$/))) return { name: 'challenge', id: m[1] };
    if (h === 'profiles') return { name: 'profiles' };
    if (h === 'family' || h === 'parents') return { name: 'family' };
    if (h === 'family-demo') return { name: 'family', demo: true };
    if ((m = h.match(/^report-([\w]+)$/))) return { name: 'report', id: m[1] };
    return { name: 'home' };
  }
  function go() {
    CM.Engine.stop(); CM.Lab.close(); CM.Challenge.close();
    route = parse(location.hash);
    if (!CM.store.active() && !['profiles', 'family', 'report'].includes(route.name)) route = { name: 'profiles' };
    highlight = route.skill || null;
    render();
    if (highlight) {
      const el = document.getElementById('sk-' + highlight.replace(/\./g, '-'));
      if (el) { el.scrollIntoView({ block: 'center' }); el.focus({ preventScroll: true }); }
    } else window.scrollTo(0, 0);
  }

  const band = g => (CM.grade(g) || CM.grade('3')).band;

  /* ---------- shared bits ---------- */
  const statusLabel = { mastered: 'Mastered', practicing: 'Practicing', ready: 'Ready', locked: 'Suggested later' };
  function gradeStats(g) {
    const skills = CM.gradeSkills(g);
    const withM = skills.filter(s => s.missions.length);
    const mastered = withM.filter(s => s.missions.every(id => (CM.store.peek(id) || {}).mastered));
    return { total: skills.length, withMissions: withM.length, mastered: mastered.length };
  }
  const logo = `<svg class="logo" viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="22" fill="none" stroke="currentColor" stroke-width="2.5"/>${Array.from({ length: 8 }, (_, i) => `<circle cx="${24 + 11 * Math.cos(i * Math.PI / 4)}" cy="${24 + 11 * Math.sin(i * Math.PI / 4)}" r="11" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".8"/>`).join('')}<circle cx="24" cy="24" r="3.5" fill="currentColor"/></svg>`;

  const avatar = (c, size) => `<span class="av${size ? ' av-' + size : ''}" style="--c:var(--${c.color})" aria-hidden="true">${esc((c.name || '?').charAt(0).toUpperCase())}</span>`;
  const lastActive = d => { const t = d.activity.length ? d.activity[d.activity.length - 1].t : 0; if (!t) return 'Not started'; const days = Math.floor((new Date().setHours(0, 0, 0, 0) - new Date(t).setHours(0, 0, 0, 0)) / 864e5); return days <= 0 ? 'Active today' : days === 1 ? 'Active yesterday' : 'Last active ' + new Date(t).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); };

  function header() {
    const g = S().profile.grade, kid = CM.store.active();
    const nav = [['home', 'Home'], ['path', 'Learning Path'], ['lab', 'Math Lab'], ['challenges', 'Challenges'], ['family', 'Family']];
    const cur = { home: 'home', path: 'path', mission: 'path', lab: 'lab', labtool: 'lab', challenges: 'challenges', challenge: 'challenges', family: 'family', report: 'family' }[route.name];
    $('#top').innerHTML = `<div class="topin">
      <a class="brand" href="#home">${logo}<span>Catholic Math</span></a>
      <nav aria-label="Main">${nav.map(([k, l]) => `<a href="#${k}"${cur === k ? ' aria-current="page"' : ''}>${l}</a>`).join('')}</nav>
      ${kid ? `<label class="gpick"><span>Grade</span><select id="gradeSel" aria-label="${esc(kid.name)}'s grade">${CM.GRADES.map(x => `<option value="${x.id}"${x.id === g ? ' selected' : ''}>${x.label}</option>`).join('')}</select></label>
      <a class="who-chip" href="#profiles" title="Switch learner">${avatar(kid, 'sm')}<span class="wc-name">${esc(kid.name)}</span><span class="wc-switch">Switch</span></a>` : `<a class="who-chip" href="#profiles"><span class="wc-name">Choose a learner</span></a>`}
    </div>`;
  }

  /* ---------- views ---------- */
  /* Home: a sunny hero with the owl and the rosette of mastered missions, big mission cards
   * that carry each mission's scene, and three chunky doors to the path, the lab, and challenges. */
  const DOORS = {
    path: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 54 C 22 46, 8 34, 26 30 S 44 18, 50 10" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 10"/><path d="M48 6 v20" stroke="#5b4038" stroke-width="3" stroke-linecap="round"/><path d="M48 7 l12 5 l-12 5z" fill="#ff6b6b"/><circle cx="12" cy="54" r="6" fill="#ffd43b"/></svg>',
    lab: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="10" width="52" height="12" rx="4" fill="#fff"/><rect x="6" y="26" width="25" height="12" rx="4" fill="#ffd43b"/><rect x="33" y="26" width="25" height="12" rx="4" fill="#ffd43b"/><rect x="6" y="42" width="16" height="12" rx="4" fill="#ff8787"/><rect x="24" y="42" width="16" height="12" rx="4" fill="#ff8787"/><rect x="42" y="42" width="16" height="12" rx="4" fill="#ff8787"/></svg>',
    think: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 6l7.5 15.5 17 2.4-12.3 12 2.9 17L32 45l-15.1 7.9 2.9-17-12.3-12 17-2.4z" fill="#ffd43b" stroke="#fff" stroke-width="3" stroke-linejoin="round"/><circle cx="26" cy="30" r="2.6" fill="#2b2230"/><circle cx="38" cy="30" r="2.6" fill="#2b2230"/><path d="M27 36 q5 4 10 0" fill="none" stroke="#2b2230" stroke-width="2.4" stroke-linecap="round"/></svg>'
  };
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10-6.5a1 1 0 0 0 0-1.8l-10-6.5A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>';
  function kidCard(id, why) {
    const m = CM.mission(id), st = CM.status(id), p = CM.store.peek(id) || { streak: 0 };
    const theme = (m.stage && m.stage.theme) || 'meadow';
    const th = CM.TYPES[m.type] && CM.TYPES[m.type].thumb;
    const got = p.mastered ? CM.rules.masteryRun : Math.min(p.streak || 0, CM.rules.masteryRun);
    const look = m.id === 'k-count-build' && CM.Kid ? CM.Kid.art.sheep : th;
    return `<a class="kc kc-${theme}" href="#mission-${id}">
      <span class="kc-art">${CM.Stage.scene(theme)}${look ? `<span class="kc-pic${m.id === 'k-count-build' ? ' char' : ''}">${look}</span>` : ''}${why ? `<span class="kc-why">${esc(why)}</span>` : ''}</span>
      <span class="kc-body">
        <span class="kc-title">${esc(m.title)}</span>
        <span class="kc-goal">${esc(m.goal)}</span>
        <span class="kc-foot"><span class="kc-stars" aria-label="${p.mastered ? 'Mastered' : `${got} of ${CM.rules.masteryRun} in a row`}">${Array.from({ length: CM.rules.masteryRun }, (_, i) => `<i class="${i < got ? 'on' : ''}"></i>`).join('')}</span><span class="pill ${st}">${statusLabel[st]}</span><span class="kc-go" aria-hidden="true">${PLAY}</span></span>
      </span>
    </a>`;
  }
  function home() {
    const st = S(), g = st.profile.grade, G = CM.grade(g), stats = gradeStats(g), K = CM.Kid;
    const last = st.lastMission && CM.mission(st.lastMission);
    const rec = CM.recommend(g, 4).filter(x => x.id !== st.lastMission).slice(0, 3);
    const cards = (last ? [{ id: last.id, why: 'Last time' }] : []).concat(rec).slice(0, 4);
    const hour = new Date().getHours();
    const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const gm = CM.MISSIONS.filter(m => m.grade === g);
    const nearest = gm.length ? null : CM.GRADES.map(x => x.id).filter(x => CM.MISSIONS.some(m => m.grade === x)).sort((a, b) => Math.abs(CM.GRADES.findIndex(x => x.id === a) - CM.GRADES.findIndex(x => x.id === g)) - Math.abs(CM.GRADES.findIndex(x => x.id === b) - CM.GRADES.findIndex(x => x.id === g)))[0];
    const done = gm.filter(m => (CM.store.peek(m.id) || {}).mastered).length;
    const top = cards[0] && CM.mission(cards[0].id);
    return `<section class="kh-hero">
        <div class="kh-hi">
          <p class="kh-grade">${G.label}${G.proposed ? ' \u00b7 proposed pathway' : ''}</p>
          <h1>${greet}${st.profile.name ? `, <span>${esc(st.profile.name)}</span>` : ''}!</h1>
          <p class="kh-lead">${top ? 'Ready for today\u2019s math adventure?' : gm.length ? 'Every mission here is mastered. Try a challenge!' : `Missions for ${G.label} are on the way.`}</p>
          ${top ? `<a class="kh-play" href="#mission-${top.id}"><span class="kh-play-i">${PLAY}</span><span>Play <b>${esc(top.title)}</b></span></a>` : ''}
        </div>
        <div class="kh-friends" aria-hidden="true">${K ? `<span class="kh-owl">${K.owl('happy')}</span><span class="kh-sheep">${K.art.sheep}</span><span class="kh-chick">${K.art.chick}</span>` : ''}</div>
        <div class="kh-rose">${K ? K.rosette(done, gm.length) : ''}<p><b>${done} of ${gm.length}</b> ${gm.length === 1 ? 'mission' : 'missions'} mastered</p><p class="kh-skills">${stats.mastered} of ${stats.withMissions} skills \u00b7 ${stats.total} in ${G.label}</p></div>
      </section>
      <section class="kh-sec" aria-labelledby="h-today">
        <h2 id="h-today">Today's missions</h2>
        ${cards.length ? `<div class="kh-cards">${cards.map(x => kidCard(x.id, x.why)).join('')}</div>`
        : `<p class="kh-empty">${gm.length ? 'Every mission for this grade is mastered. Try the stretch problems or a challenge.' : `There are no missions for ${G.label} yet. The learning path lists every ${G.label} skill.${nearest ? ` Missions are ready in <a href="#path-${nearest}">${CM.grade(nearest).label}</a>.` : ''}`}</p>`}
      </section>
      <section class="kh-sec" aria-labelledby="h-explore">
        <h2 id="h-explore">Explore</h2>
        <div class="kh-doors">
          <a class="kd kd-path" href="#path-${g}"><span class="kd-i">${DOORS.path}</span><span class="kd-t">Learning Path</span><span class="kd-s">Every ${esc(G.label)} skill, step by step</span></a>
          <a class="kd kd-lab" href="#lab"><span class="kd-i">${DOORS.lab}</span><span class="kd-t">Math Lab</span><span class="kd-s">Fraction bars, blocks, a number line, a balance</span></a>
          <a class="kd kd-think" href="#challenges"><span class="kd-i">${DOORS.think}</span><span class="kd-t">Challenges</span><span class="kd-s">Puzzles with more than one way in</span></a>
        </div>
      </section>`;
  }

  function pathView() {
    const g = route.grade, G = CM.grade(g) || CM.grade('3');
    const tabs = `<div class="gtabs" role="tablist" aria-label="Grade">${CM.GRADES.map(x => `<a role="tab" href="#path-${x.id}" aria-selected="${x.id === G.id}">${x.short}</a>`).join('')}</div>`;
    const disp = CM.dispositions(G.id);
    const domains = CM.path(G.id);
    const stats = gradeStats(G.id);
    let html = `<p class="eyebrow">My Learning Path</p><h1>${G.label}</h1>${tabs}
      <p class="level">${stats.total} skills \u00b7 ${stats.withMissions} with missions \u00b7 ${stats.mastered} mastered</p>`;
    if (G.proposed) html += `<div class="note"><p><b>About 8th grade.</b> The 2018 document has no 8th Grade standards section. This path combines two sources:</p><ul><li><b>Official:</b> ${esc(CM.GRADE8.officialNote)}</li><li><b>Proposed:</b> ${esc(CM.GRADE8.proposedNote)}</li></ul></div>`;
    html += `<details class="disp"><summary>Catholic Dispositions for ${G.proposed ? 'this pathway (from Algebra I)' : G.label}</summary><ul>${disp.map(d => `<li>${esc(d)}</li>`).join('')}</ul><p class="muted">Quoted from the 2018 Math Standards${G.proposed ? ', Algebra I, page 30' : ''}.</p></details>`;
    domains.forEach(d => {
      html += `<section class="domain${d.proposed ? ' proposed' : ''}"><h2>${d.code === 'ALG1' ? '' : d.code + '. '}${esc(d.name)}${d.note ? ` <small>(${esc(d.note)})</small>` : ''}</h2>`;
      if (d.proposed) html += `<p class="muted">Proposed for grade 8. Objective IDs keep their Algebra I numbering.</p>`;
      d.units.forEach(u => {
        const wm = u.skills.filter(s => s.missions.length).length;
        html += `<div class="unit"><h3>${u.code ? u.code + '. ' : ''}${esc(u.name)}${u.note ? ` <small>(${esc(u.note)})</small>` : ''}</h3>
          ${u.skills.length ? `<p class="muted small">${wm} of ${u.skills.length} skills have missions${u.numberingNote ? ' \u00b7 ' + esc(u.numberingNote) : ''}</p>` : ''}
          <ul class="skills">${u.skills.map(s => {
          const anchor = 'sk-' + s.id.replace(/\./g, '-');
          const ms = s.missions.map(id => { const stt = CM.status(id); return `<a class="mlink ${stt}" href="#mission-${id}"><span class="pill ${stt}">${statusLabel[stt]}</span>${esc(CM.mission(id).title)}</a>`; }).join('');
          return `<li id="${anchor}" tabindex="-1" class="${highlight === s.id ? 'hl' : ''}${s.missions.length ? ' has' : ''}">
              <span class="sid">${s.scopeRow ? `S&amp;S ${s.mark}` : s.id}</span>
              <span class="stext">${esc(s.text)}${s.corrected ? ' <span class="muted small" title="Symbols restored from the PDF where text extraction lost them">(symbols restored)</span>' : ''}${s.page ? ` <span class="muted small">p. ${s.page}</span>` : ''}${s.numberingNote ? ` <span class="muted small">(${esc(s.numberingNote)})</span>` : ''}</span>
              <span class="smis">${ms || '<span class="muted small">No mission yet</span>'}</span>
            </li>`;
        }).join('') || '<li class="muted">No objectives listed for this section.</li>'}</ul></div>`;
      });
      html += '</section>';
    });
    html += `<p class="muted small">Source: Archdiocese of Denver Catholic Schools, 2018 Math Standards. Skill IDs follow the document's structure: grade, strand, section, objective number.</p>`;
    return html;
  }

  function labIndex() {
    const b = band(S().profile.grade);
    const tools = CM.LAB_TOOLS.slice().sort((x, y) => (y.bands.includes(b) - x.bands.includes(b)) || (y.ready - x.ready));
    return `<p class="eyebrow">Explore freely</p><h1>Math Lab</h1>
      <p class="sub">Tools for trying ideas. Nothing here is scored.</p>
      <div class="lgrid">${tools.map(t => t.ready
      ? `<a class="tilecard" href="#lab-${t.id}"><span class="tc-title">${esc(t.title)}</span><span class="muted">${esc(t.blurb)}</span>${t.bands.includes(b) ? '' : '<span class="why">Other grades</span>'}</a>`
      : `<div class="tilecard off" aria-disabled="true"><span class="tc-title">${esc(t.title)}</span><span class="muted">Not built yet</span></div>`).join('')}</div>`;
  }

  function challengesIndex() {
    return `<p class="eyebrow">Think it through</p><h1>Challenges</h1>
      <p class="sub">Puzzles that reward patience and careful reasoning. Most have more than one answer.</p>
      <div class="lgrid">${CM.CHALLENGES.map(c => { const r = S().challenges[c.id]; return `<a class="tilecard" href="#challenge-${c.id}"><span class="tc-title">${esc(c.title)}</span><span class="muted">${esc(c.goal)}</span><span class="why">${r && r.found.length ? `${r.found.length} of 8 found` : `Grades ${c.grades[0]}\u2013${c.grades[c.grades.length - 1]}`}</span></a>`; }).join('')}
      <div class="tilecard off" aria-disabled="true"><span class="tc-title">More challenges</span><span class="muted">Not built yet</span></div></div>`;
  }

  function report(childId) {
    const kid = CM.store.child(childId);
    if (!kid) return `<p class="eyebrow"><a href="#family">Family</a></p><h1>Report not found</h1><p class="muted">This profile may have been deleted.</p>`;
    return CM.store.withChild(childId, () => reportBody(kid));
  }
  function reportBody(kid) {
    const st = S();
    const acts = st.activity, time = Object.values(st.missions).reduce((s, p) => s + (p.time || 0), 0);
    const practiced = {};
    acts.forEach(a => { const m = CM.mission(a.mission); if (!m) return; m.standards.forEach(id => { const x = practiced[id] = practiced[id] || { n: 0, clean: 0 }; x.n++; if (!a.helped) x.clean++; }); });
    const mastered = CM.MISSIONS.filter(m => (CM.store.peek(m.id) || {}).mastered);
    const weak = CM.needsWork();
    const due = [...new Set(st.review.filter(r => r.due <= acts.length).map(r => r.mission))];
    const tags = {};
    st.log.forEach(l => { const k = l.tag; (tags[k] = tags[k] || { n: 0, mission: l.mission, ex: l.detail }).n++; });
    const rec = CM.recommend(st.profile.grade, 4);
    const title = id => { const m = CM.mission(id); return m ? m.title : id.replace('challenge:', 'Challenge: '); };
    return `<p class="eyebrow back"><a href="#family">\u2190 Family</a></p>
      <div class="rhead">${avatar(kid, 'lg')}<div><h1>${esc(kid.name)}</h1><p class="level">${CM.grade(kid.grade).label} \u00b7 ${lastActive(st)}</p></div>
        <button type="button" class="btn btn-primary" data-app="pick" data-id="${kid.id}">Learn as ${esc(kid.name)}</button></div>
      <div class="stats">
        <div class="stat"><b>${acts.length}</b><span>problems completed</span></div>
        <div class="stat"><b>${fmtTime(time)}</b><span>time in missions</span></div>
        <div class="stat"><b>${Object.keys(practiced).length}</b><span>standards practiced</span></div>
        <div class="stat"><b>${mastered.length}</b><span>missions mastered</span></div>
      </div>
      <section class="panel"><h2>Suggested next</h2>${rec.length ? `<ul class="dlist">${rec.map(x => `<li><span>${esc(CM.mission(x.id).title)}</span><small>${esc(x.why)} \u00b7 ${CM.mission(x.id).standards.join(', ')}</small></li>`).join('')}</ul>` : '<p class="muted">Nothing to suggest for this grade yet.</p>'}</section>
      <section class="panel"><h2>Needs reinforcement</h2>${weak.length || due.length ? `<ul class="dlist">${[...new Set([...weak, ...due])].map(id => { const p = CM.store.peek(id); return `<li><span>${esc(title(id))}</span><small>${p ? `${p.helped} of ${p.done} solved with help` : ''}${due.includes(id) ? ' \u00b7 review due' : ''}</small></li>`; }).join('')}</ul>` : '<p class="muted">Nothing flagged. A mission is flagged when 40% or more of its problems needed help, or when a review is due.</p>'}</section>
      <section class="panel"><h2>Mistakes and misconceptions</h2>${Object.keys(tags).length ? `<ul class="dlist">${Object.entries(tags).sort((a, b) => b[1].n - a[1].n).slice(0, 12).map(([k, v]) => `<li><span>${esc(k)}</span><small>${v.n}\u00d7 \u00b7 ${esc(title(v.mission))}${v.ex ? ' \u00b7 e.g. ' + esc(v.ex) : ''}</small></li>`).join('')}</ul>` : '<p class="muted">No mistakes recorded yet.</p>'}</section>
      <section class="panel"><h2>Standards practiced</h2>${Object.keys(practiced).length ? `<div class="tablewrap"><table class="tbl"><thead><tr><th>Standard</th><th>Objective</th><th>Problems</th><th>Without help</th></tr></thead><tbody>${Object.entries(practiced).map(([id, x]) => { const o = CM.objective(id); return `<tr><td><a href="#skill-${id.replace(/\./g, '-')}">${id}</a></td><td>${o ? esc(o.text) : ''}</td><td>${x.n}</td><td>${Math.round(100 * x.clean / x.n)}%</td></tr>`; }).join('')}</tbody></table></div>` : '<p class="muted">No standards practiced yet.</p>'}</section>
      <section class="panel"><h2>Skills mastered</h2>${mastered.length ? `<ul class="dlist">${mastered.map(m => `<li><span>${esc(m.title)}</span><small>${m.standards.join(', ')}</small></li>`).join('')}</ul>` : '<p class="muted">None yet. Mastery means 3 correct in a row without hints, including one at the hardest level.</p>'}</section>
      <section class="panel"><h2>Data</h2><p class="muted">Progress is saved only in this browser on this device. Clearing the browser's site data erases it.</p>
        <div class="actions" id="resetRow">${confirmReset ? `<span class="muted">Erase ${esc(kid.name)}'s progress? The profile stays.</span><button type="button" class="btn btn-primary" data-app="reset-yes" data-id="${kid.id}">Erase progress</button><button type="button" class="btn btn-ghost" data-app="reset-no">Keep</button>` : '<button type="button" class="btn btn-ghost" data-app="reset">Reset progress</button>'}</div></section>`;
  }

  function childForm() {
    const c = form.mode === 'edit' ? CM.store.child(form.id) : null;
    return `<form class="panel pform" id="pform" novalidate>
      <h2>${c ? 'Edit ' + esc(c.name) : 'Add a child'}</h2>
      <label class="field"><span>First name</span><input id="fName" maxlength="24" autocomplete="off" value="${esc(form.draftName !== undefined ? form.draftName : (c ? c.name : ''))}" required></label>
      <label class="field"><span>Grade</span><select id="fGrade">${CM.GRADES.map(x => `<option value="${x.id}"${(c ? c.grade : form.grade || '3') === x.id ? ' selected' : ''}>${x.label}</option>`).join('')}</select></label>
      <fieldset class="field"><legend>Color</legend><div class="swatches">${CM.COLORS.map(k => `<button type="button" class="swatch${form.color === k ? ' picked' : ''}" style="--c:var(--${k})" data-app="color" data-c="${k}" aria-label="Color ${CM.COLORS.indexOf(k) + 1}" aria-pressed="${form.color === k}"></button>`).join('')}</div></fieldset>
      ${formErr ? `<p class="ferr" role="alert">${esc(formErr)}</p>` : ''}
      <div class="actions"><button type="submit" class="btn btn-primary">${c ? 'Save changes' : 'Add child'}</button><button type="button" class="btn btn-ghost" data-app="form-cancel">Cancel</button></div>
      ${c ? `<div class="danger">${confirmDel === c.id ? `<span>Delete ${esc(c.name)} and all of their progress? This can't be undone.</span><button type="button" class="btn btn-danger" data-app="del-yes" data-id="${c.id}">Delete profile</button><button type="button" class="btn btn-ghost" data-app="del-no">Keep</button>` : `<button type="button" class="btn btn-ghost sm" data-app="del" data-id="${c.id}">Delete this profile</button>`}</div>` : ''}
    </form>`;
  }

  function profiles() {
    const kids = CM.store.children(), active = CM.store.active();
    if (!kids.length && !form) form = { mode: 'add', color: CM.COLORS[0] };
    return `<p class="eyebrow">Catholic Math</p><h1>${kids.length ? 'Who is learning today?' : 'Welcome. Add your first child.'}</h1>
      ${kids.length ? `<div class="kids">${kids.map(c => `<div class="kid${active && active.id === c.id ? ' current' : ''}">
          <button type="button" class="kid-main" data-app="pick" data-id="${c.id}">${avatar(c, 'lg')}<span class="kid-name">${esc(c.name)}</span><span class="muted">${CM.grade(c.grade).label}</span><span class="muted small">${lastActive(c.data)}</span></button>
          <button type="button" class="btn btn-ghost sm" data-app="edit" data-id="${c.id}">Edit</button>
        </div>`).join('')}
        ${form ? '' : `<button type="button" class="kid kid-add" data-app="add"><span class="av av-lg av-plus" aria-hidden="true">+</span><span class="kid-name">Add child</span></button>`}
      </div>` : ''}
      ${form ? childForm() : ''}
      <p class="muted small">Profiles and progress are saved only in this browser. Nothing is sent to a server.</p>`;
  }

  /* ---------- render ---------- */
  function render() {
    header();
    const g = route.name === 'mission' && CM.mission(route.id) ? CM.mission(route.id).grade : route.name === 'path' ? route.grade : S().profile.grade;
    document.body.dataset.band = band(g);
    document.body.dataset.route = route.name;
    document.body.classList.toggle('immersive', route.name === 'mission' && !!(CM.mission(route.id) || {}).stage);
    view.className = 'view v-' + route.name;
    if (route.name === 'home') view.innerHTML = home();
    else if (route.name === 'path') view.innerHTML = pathView();
    else if (route.name === 'mission') { view.innerHTML = '<p class="eyebrow back"><a href="#path-' + ((CM.mission(route.id) || {}).grade || '3') + '">\u2190 Learning Path</a></p><div id="mroot"></div>'; CM.Engine.start(route.id, $('#mroot')); }
    else if (route.name === 'lab') view.innerHTML = labIndex();
    else if (route.name === 'labtool') { if (CM.LAB_TOOLS.some(t => t.id === route.id && t.ready)) CM.Lab.open(route.id, view); else view.innerHTML = labIndex(); }
    else if (route.name === 'challenges') view.innerHTML = challengesIndex();
    else if (route.name === 'challenge') { if (CM.CHALLENGES.some(c => c.id === route.id)) CM.Challenge.open(route.id, view); else view.innerHTML = challengesIndex(); }
    else if (route.name === 'profiles') view.innerHTML = profiles();
    else if (route.name === 'family') { view.innerHTML = CM.Parents.render({ demo: route.demo }); CM.Parents.after(view); }
    else if (route.name === 'report') view.innerHTML = report(route.id);
    if (route.name === 'profiles' && form) { const f = $('#fName'); if (f && !f.value) f.focus({ preventScroll: true }); }
  }

  /* ---------- events ---------- */
  document.addEventListener('click', ev => {
    if (CM.Engine.onClick(ev) || CM.Lab.onClick(ev) || CM.Challenge.onClick(ev)) return;
    const el = ev.target.closest('[data-app]');
    if (!el) return;
    const a = el.dataset.app, id = el.dataset.id;
    if (a === 'pd-focus') CM.Parents.focus = id;
    else if (a === 'reset') confirmReset = true;
    else if (a === 'reset-no') confirmReset = false;
    else if (a === 'reset-yes') { CM.store.resetChild(id); confirmReset = false; }
    else if (a === 'pick') { CM.store.select(id); CM.store.save(); form = null; confirmDel = null; if (location.hash === '#home') go(); else location.hash = 'home'; return; }
    else if (a === 'add' || a === 'add-go') { form = { mode: 'add', color: CM.COLORS[CM.store.children().length % CM.COLORS.length] }; formErr = ''; if (a === 'add-go') return; }
    else if (a === 'edit') { const c = CM.store.child(id); form = { mode: 'edit', id, color: c.color }; formErr = ''; confirmDel = null; }
    else if (a === 'color') { keepForm(); form.color = el.dataset.c; }
    else if (a === 'form-cancel') { form = null; formErr = ''; confirmDel = null; }
    else if (a === 'del') { keepForm(); confirmDel = id; }
    else if (a === 'del-no') { keepForm(); confirmDel = null; }
    else if (a === 'del-yes') { CM.store.removeChild(id); form = null; confirmDel = null; }
    else return;
    render();
    if (a === 'color') { const b = document.querySelector(`[data-app="color"][data-c="${el.dataset.c}"]`); if (b) b.focus(); }
  });
  // Keep typed values when the form re-renders (color pick, delete confirm).
  function keepForm() { if (!form) return; const n = $('#fName'), g = $('#fGrade'); if (n) form.draftName = n.value; if (g) form.grade = g.value; }
  document.addEventListener('input', ev => CM.Engine.onInput(ev));
  document.addEventListener('submit', ev => {
    if (ev.target.id !== 'pform') return;
    ev.preventDefault();
    const name = $('#fName').value.trim(), grade = $('#fGrade').value;
    if (!name) { keepForm(); formErr = 'Type a first name.'; render(); $('#fName').focus(); return; }
    if (form.mode === 'edit') CM.store.updateChild(form.id, { name, grade, color: form.color });
    else CM.store.addChild({ name, grade, color: form.color });
    form = null; formErr = ''; confirmDel = null;
    render();
  });
  document.addEventListener('keydown', ev => CM.Engine.onKey(ev));
  document.addEventListener('change', ev => {
    if (ev.target.id === 'gradeSel') {
      const kid = CM.store.active(); if (kid) CM.store.updateChild(kid.id, { grade: ev.target.value });
      if (route.name === 'path') { location.hash = 'path-' + ev.target.value; return; }
      render();
    }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && CM.Engine.active()) CM.store.save(); });
  window.addEventListener('hashchange', go);
  go();
})(window.CM);
