/* Core: helpers, curriculum index, and progress store. No DOM work here, so it can run under Node for tests. */
(function (CM) {
  'use strict';

  /* ---------- helpers ---------- */
  CM.h = {
    esc: s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])),
    frac: (a, b) => `<span class="frac" role="img" aria-label="${a} out of ${b}"><span aria-hidden="true">${a}</span><span aria-hidden="true">${b}</span></span>`,
    plural: (n, w, p) => `${n} ${n === 1 ? w : (p || w + 's')}`,
    range: n => new Set(Array.from({ length: n }, (_, i) => i)),
    gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; },
    clamp: (v, lo, hi) => Math.max(lo, Math.min(hi, v)),
    fmtTime: s => s < 60 ? `${Math.round(s)} sec` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} hr`
  };

  /* ---------- curriculum index ---------- */
  const OBJ = {}, UNITS_BY_GRADE = {};
  function indexStandards() {
    CM.STANDARDS.grades.forEach(g => {
      g.domains.forEach(d => {
        const add = (o, sub) => { OBJ[o.id] = { ...o, grade: g.id, gradeName: g.name, domain: d, sub }; };
        d.objectives.forEach(o => add(o, null));
        d.subdomains.forEach(sd => sd.objectives.forEach(o => add(o, sd)));
      });
    });
  }
  CM.objective = id => OBJ[id] || null;
  CM.scopeRow = id => CM.SCOPE.find(r => r.id === id) || null;
  CM.mission = id => CM.MISSIONS.find(m => m.id === id) || null;
  CM.grade = id => CM.GRADES.find(g => g.id === id) || null;
  CM.missionsForSkill = sid => CM.MISSIONS.filter(m => m.standards.includes(sid));
  CM.stdGrade = id => CM.STANDARDS.grades.find(g => g.id === id);

  /*
   * Build the learning path for a grade:
   * [{ code, name, note, official, units: [{ code, name, note, skills: [{ id, text, page, missions }] }] }]
   */
  CM.path = function (gradeId) {
    if (UNITS_BY_GRADE[gradeId]) return UNITS_BY_GRADE[gradeId];
    const out = [];
    const skill = (o) => ({ id: o.id, text: o.text, page: o.page, corrected: !!o.corrected, numberingNote: o.numberingNote, missions: CM.missionsForSkill(o.id).map(m => m.id) });
    if (gradeId !== '8') {
      const g = CM.stdGrade(gradeId);
      g.domains.forEach(d => {
        const units = d.subdomains.length
          ? d.subdomains.map(sd => ({ code: sd.code, name: sd.name, note: sd.note, numberingNote: sd.numberingNote, page: sd.page, skills: sd.objectives.map(skill) }))
          : [{ code: '', name: d.name, note: d.note, page: d.page, skills: d.objectives.map(skill) }];
        out.push({ code: d.code, name: d.name, note: d.note, official: true, units });
      });
    } else {
      // Official part: Scope & Sequence rows marked M in the grade 8 column, grouped by strand.
      const strands = {};
      CM.SCOPE.filter(r => r.marks['8']).forEach(r => {
        (strands[r.strand] = strands[r.strand] || { code: r.strand, name: r.strandName, official: true, scope: true, units: [{ code: '', name: 'Scope & Sequence: grade 8', skills: [] }] })
          .units[0].skills.push({ id: r.id, text: r.skill, mark: r.marks['8'], scopeRow: true, missions: CM.MISSIONS.filter(m => (m.scope || []).includes(r.id) && m.grade === '8').map(m => m.id) });
      });
      Object.values(strands).forEach(s => out.push(s));
      // Proposed part: Algebra I Section 1.
      const alg = CM.stdGrade('ALG1');
      out.push({
        code: 'ALG1', name: 'Algebra I, Section 1 (proposed for grade 8)', official: false, proposed: true,
        units: alg.domains.filter(d => d.section && d.section.n === CM.GRADE8.algebraSection)
          .map(d => ({ code: d.code, name: d.name, page: d.page, skills: d.objectives.map(skill) }))
      });
    }
    UNITS_BY_GRADE[gradeId] = out;
    return out;
  };
  CM.gradeSkills = gradeId => CM.path(gradeId).flatMap(d => d.units.flatMap(u => u.skills));
  CM.dispositions = gradeId => (gradeId === '8' ? CM.stdGrade('ALG1') : CM.stdGrade(gradeId)).dispositions;

  /* ---------- progress store ---------- */
  /*
   * Family store. One record per child, all kept in the browser (localStorage key below).
   *   family = { v: 2, activeId, children: [{ id, name, grade, color, created, data }] }
   * `state` always points at the active child's `data`, so the rest of the app reads one learner at a time.
   * Version 1 data (a single learner) is migrated into the first child on load.
   */
  const KEY = 'catholic-math-family-v2', OLD_KEY = 'catholic-math-v1';
  const blankMission = () => ({ tier: 1, streak: 0, tierStreak: 0, topClean: false, mastered: false, idx: {}, attempts: 0, clean: 0, helped: 0, helpedRun: 0, time: 0, last: 0, done: 0 });
  CM.freshState = () => ({ v: 1, profile: { name: '', grade: '3' }, missions: {}, review: [], log: [], activity: [], hints: 0, challenges: {}, lastMission: null });
  CM.COLORS = ['t1', 't2', 't3', 't4', 't5', 't6'];
  const newId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  CM.store = {
    family: null, state: null, storage: null,
    load(storage) {
      this.storage = storage || null;
      let fam = null;
      try { fam = JSON.parse(this.storage && this.storage.getItem(KEY)); } catch (e) { fam = null; }
      if (!fam || !Array.isArray(fam.children)) {
        fam = { v: 2, activeId: null, children: [] };
        try {
          const old = JSON.parse(this.storage && this.storage.getItem(OLD_KEY));
          if (old && old.missions && (Object.keys(old.missions).length || old.profile.name)) {
            const c = { id: newId(), name: old.profile.name || 'My child', grade: old.profile.grade || '3', color: 't4', created: Date.now(), data: old };
            fam.children.push(c); fam.activeId = c.id;
          }
        } catch (e) { }
      }
      this.family = fam;
      this.select(fam.activeId);
      return this.state;
    },
    save() { try { this.storage && this.storage.setItem(KEY, JSON.stringify(this.family)); } catch (e) { } },
    children() { return this.family.children; },
    child(id) { return this.family.children.find(c => c.id === id) || null; },
    active() { return this.child(this.family.activeId); },
    select(id) {
      const c = this.child(id);
      this.family.activeId = c ? c.id : null;
      // Without a selected child, a throwaway state keeps pure functions working (tests, previews). It is never saved.
      this.state = c ? c.data : CM.freshState();
      if (c) { c.data.profile.name = c.name; c.data.profile.grade = c.grade; }
      return c;
    },
    addChild({ name, grade, color }) {
      const c = { id: newId(), name: String(name).trim().slice(0, 24), grade: grade || '3', color: color || CM.COLORS[this.family.children.length % CM.COLORS.length], created: Date.now(), data: CM.freshState() };
      this.family.children.push(c);
      this.select(c.id); this.save();
      return c;
    },
    updateChild(id, patch) {
      const c = this.child(id); if (!c) return null;
      if (patch.name !== undefined) c.name = String(patch.name).trim().slice(0, 24) || c.name;
      if (patch.grade) c.grade = patch.grade;
      if (patch.color) c.color = patch.color;
      c.data.profile.name = c.name; c.data.profile.grade = c.grade;
      if (this.family.activeId === id) this.state = c.data;
      this.save();
      return c;
    },
    removeChild(id) {
      this.family.children = this.family.children.filter(c => c.id !== id);
      if (this.family.activeId === id) this.select(null);
      this.save();
    },
    resetChild(id) { const c = this.child(id); if (!c) return; c.data = CM.freshState(); c.data.profile.name = c.name; c.data.profile.grade = c.grade; if (this.family.activeId === id) this.state = c.data; this.save(); },
    // Run fn with another child's data as the current state (used by the family dashboard).
    withChild(id, fn) { const c = this.child(id), prev = this.state; if (!c) return null; this.state = c.data; try { return fn(c); } finally { this.state = prev; } },
    reset() { const c = this.active(); if (c) this.resetChild(c.id); else this.state = CM.freshState(); },
    m(id) { return this.state.missions[id] || (this.state.missions[id] = blankMission()); },
    peek(id) { return this.state.missions[id] || null }
  };

  /* ---------- mastery rules (transparent, rule-based) ----------
   * - Items are ordered in tiers 1\u20133 (core) and 4 (stretch, offered after mastery).
   * - Two clean answers in a row at a tier move the student up one tier.
   * - A helped answer (any wrong attempt or hint) moves the student down one tier and queues a review.
   * - Mastery: three clean answers in a row, at least one of them at tier 3.
   * - Two helped answers in a row on a mission with unmastered prerequisites flags those prerequisites.
   */
  CM.rules = { up: 2, masteryRun: 3, topTier: 3, stretchTier: 4, reviewGap: 2 };

  CM.pickItem = function (mission, prog, stretch) {
    const tier = stretch ? CM.rules.stretchTier : CM.h.clamp(prog.tier, 1, CM.rules.topTier);
    let pool = mission.items.filter(i => i.tier === tier);
    if (!pool.length) pool = mission.items.filter(i => i.tier <= tier);
    const k = prog.idx[tier] || 0;
    prog.idx[tier] = k + 1;
    return { item: pool[k % pool.length], tier };
  };

  CM.recordResult = function (mission, prog, tier, helped, stretch) {
    const st = CM.store.state;
    prog.attempts++; prog.done++; prog.last = Date.now();
    const events = [];
    if (!helped) {
      prog.clean++; prog.streak++; prog.helpedRun = 0;
      st.review = st.review.filter(r => !(r.mission === mission.id && r.due <= st.activity.length + 1));
      if (tier >= CM.rules.topTier) prog.topClean = true;
      if (!stretch) {
        prog.tierStreak++;
        if (prog.tierStreak >= CM.rules.up && prog.tier < CM.rules.topTier) { prog.tier++; prog.tierStreak = 0; events.push('tier-up'); }
      }
      if (!prog.mastered && prog.streak >= CM.rules.masteryRun && prog.topClean) { prog.mastered = true; events.push('mastered'); }
    } else {
      prog.helped++; prog.streak = 0; prog.tierStreak = 0; prog.helpedRun++;
      if (!stretch && prog.tier > 1) { prog.tier--; events.push('tier-down'); }
      prog.topClean = prog.mastered ? prog.topClean : false;
      st.review.push({ mission: mission.id, due: st.activity.length + 1 + CM.rules.reviewGap });
      if (prog.helpedRun >= 2) {
        const missing = mission.prereqs.filter(p => !(CM.store.peek(p) || {}).mastered);
        if (missing.length) events.push('prereq:' + missing.join(','));
      }
    }
    st.activity.push({ t: Date.now(), mission: mission.id, tier, helped, stretch: !!stretch });
    if (st.activity.length > 500) st.activity = st.activity.slice(-500);
    return events;
  };

  CM.logMistake = function (mission, tag, detail) {
    const st = CM.store.state;
    st.log.unshift({ t: Date.now(), mission: mission.id, tag, detail });
    st.log = st.log.slice(0, 200);
  };

  /* ---------- recommendations ---------- */
  CM.status = function (id) {
    const p = CM.store.peek(id), m = CM.mission(id);
    if (p && p.mastered) return 'mastered';
    if (m.prereqs.some(q => !(CM.store.peek(q) || {}).mastered) && !(p && p.done)) return 'locked';
    if (p && p.done) return 'practicing';
    return 'ready';
  };
  CM.needsWork = function () {
    return CM.MISSIONS.filter(m => { const p = CM.store.peek(m.id); return p && p.done >= 2 && !p.mastered && p.helped / p.done >= 0.4; }).map(m => m.id);
  };
  CM.recommend = function (gradeId, n) {
    const st = CM.store.state, seen = new Set(), out = [];
    const push = (id, why) => { if (!seen.has(id) && CM.mission(id) && out.length < n) { seen.add(id); out.push({ id, why }); } };
    const inGrade = CM.MISSIONS.filter(m => m.grade === gradeId);
    // 1. Prerequisites flagged by struggle
    CM.MISSIONS.forEach(m => { const p = CM.store.peek(m.id); if (p && p.helpedRun >= 2) m.prereqs.forEach(q => { if (!(CM.store.peek(q) || {}).mastered) push(q, `Builds the base for ${m.title}`); }); });
    // 2. Reviews that are due
    st.review.filter(r => r.due <= st.activity.length).forEach(r => push(r.mission, 'Review'));
    // 3. In progress in this grade
    inGrade.filter(m => CM.status(m.id) === 'practicing').forEach(m => push(m.id, 'Keep going'));
    // 4. Ready and not started in this grade
    inGrade.filter(m => CM.status(m.id) === 'ready').forEach(m => push(m.id, 'New'));
    // 5. Stretch on mastered missions
    inGrade.filter(m => CM.status(m.id) === 'mastered' && m.items.some(i => i.tier === CM.rules.stretchTier)).forEach(m => push(m.id, 'Stretch'));
    return out;
  };

  indexStandards();
})(typeof window !== 'undefined' ? (window.CM = window.CM || {}) : (global.CM = global.CM || {}));
