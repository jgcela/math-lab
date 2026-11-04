/* Node test runner: `node tests/run-tests.js`
 * Checks curriculum traceability and the math in every mission item. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const ctx = { window: {}, console };
ctx.global = ctx; ctx.window = ctx;
vm.createContext(ctx);
for (const f of ['data/standards.js', 'data/scope.js', 'data/curriculum.js', 'js/core.js', 'js/speech.js', 'js/stage.js', 'js/types/shared.js', 'js/types/fractions.js', 'js/types/arith.js', 'js/types/tenframe.js', 'js/types/visual.js', 'js/types/garden.js', 'js/types/balance.js', 'js/parents.js'])
  vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx, { filename: f });
const CM = ctx.CM;
CM.store.load(null);

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log('FAIL', msg); } };

/* 1. Curriculum traceability */
const ids = new Set();
CM.STANDARDS.grades.forEach(g => g.domains.forEach(d => [...d.objectives, ...d.subdomains.flatMap(s => s.objectives)].forEach(o => { ok(!ids.has(o.id), 'duplicate id ' + o.id); ids.add(o.id); ok(o.page >= 5 && o.page <= 34, 'page range ' + o.id); })));
ok(['K', '1', '2', '3', '4', '5', '6', '7', 'ALG1'].every(g => CM.stdGrade(g)), 'all grades parsed');
ok(CM.objective('3.I.E.1').text.startsWith('Identify equivalent fractions'), '3.I.E.1 text');
ok(CM.objective('5.I.E.3').text === 'Add and subtract fractions with like and unlike denominators.', '5.I.E.3 text');
ok(CM.objective('K.I.A.9').text.includes('up to 30'), 'K.I.A.9 text');
ok(CM.GRADES.length === 9, '9 grades K–8');
ok(CM.path('8').some(d => d.proposed) && CM.path('8').some(d => d.official), 'grade 8 has official and proposed parts');
ok(CM.SCOPE.filter(r => r.marks['8']).length === 21, '21 scope rows with a grade 8 mark');
CM.MISSIONS.forEach(m => {
  m.standards.forEach(s => ok(CM.objective(s), `${m.id}: standard ${s} exists`));
  (m.scope || []).forEach(s => ok(CM.scopeRow(s), `${m.id}: scope row ${s} exists`));
  m.prereqs.forEach(p => ok(CM.mission(p), `${m.id}: prereq ${p} exists`));
  ok(CM.TYPES[m.type], `${m.id}: type ${m.type} exists`);
  [1, 2, 3].forEach(t => ok(m.items.some(i => i.tier === t), `${m.id}: has tier ${t}`));
  ok(CM.dispositions(m.grade === '8' ? '8' : m.grade).includes(m.disposition) || m.dispositionSource, `${m.id}: disposition is quoted from the document`);
  const g = m.grade === '8' ? 'ALG1' : m.grade;
  m.standards.forEach(s => ok(s.startsWith(g + '.') || s.startsWith('ALG1.'), `${m.id}: ${s} belongs to grade ${m.grade}`));
});

/* 2. Every item: the worked solution passes the checker, and a blank attempt does not */
CM.MISSIONS.forEach(m => m.items.forEach((item, k) => {
  const T = CM.TYPES[m.type];
  const r = { mission: m, item, tier: item.tier, attempts: 0, hint: 0, solved: false };
  T.init(r);
  const blank = T.check(r);
  ok(!blank.ok, `${m.id}#${k} blank attempt is not correct`);
  T.show(r);
  const res = T.check(r);
  ok(res.ok, `${m.id}#${k} worked solution passes (${JSON.stringify(res)})`);
  ok(typeof T.explain(r) === 'string' && T.explain(r).length > 20, `${m.id}#${k} has an explanation`);
  ok(typeof T.view(r) === 'string', `${m.id}#${k} renders`);
  [1, 2].forEach(lv => ok(typeof T.hint(r, lv) === 'string', `${m.id}#${k} hint ${lv}`));
}));

/* 3. Specific math and misconception checks */
const T = CM.TYPES;
function run(type, item, setup) { const m = { id: 't', type, items: [] }; const r = { mission: m, item, attempts: 0, hint: 0 }; T[type].init(r); setup(r); return T[type].check(r); }
ok(run('addRegroup', { x: 47, y: 25 }, r => r.answer = '62').err === 'nocarry', '47+25=62 → forgot to carry');
ok(run('addRegroup', { x: 47, y: 25 }, r => r.answer = '612').err === 'concat', '47+25=612 → concat');
ok(run('subRegroup', { x: 52, y: 27 }, r => r.answer = '35').err === 'flip', '52−27=35 → smaller from larger');
ok(run('subRegroup', { x: 400, y: 135 }, r => r.answer = '265').ok, '400−135=265');
ok(run('subRegroup', { x: 7000, y: 2385 }, r => r.answer = '4615').ok, '7000−2385=4615');
ok(CM.viz.subWork(5003, 1268).res.join('') === [5, 3, 7, 3].join(''), '5003−1268 digits (ones first) = 3735');
ok(run('arrays', { a: 3, b: 4 }, r => { r.rows = 3; r.cols = 4; r.answer = '7'; }).err === 'added', '3×4=7 → added');
ok(run('arrays', { a: 3, b: 4 }, r => { r.rows = 4; r.cols = 3; r.answer = '12'; }).ok, 'swapped array accepted');
ok(run('fractionCompare', { x: [1, 3], y: [1, 5] }, r => r.choice = 'y').err === 'bigger-bottom', '1/5 > 1/3 → bigger-bottom misconception');
ok(run('fractionCompare', { x: [1, 2], y: [2, 4] }, r => r.choice = 'same').ok, '1/2 = 2/4');
ok(run('fractionBuild', { a: 3, b: 4 }, r => { r.pieces = 8; r.shaded = CM.h.range(6); }).nudge, '6/8 for 3/4 → nudge, not error');
ok(run('fractionEquiv', { a: 4, b: 6, d: 3 }, r => { r.shaded = CM.h.range(2); }).ok, '4/6 = 2/3');
const garden = CM.mission('g5-garden').items[0];
ok(run('garden', garden, r => { T.garden.show(r); r.num = '7'; r.den = '12'; }).err === 'complement', 'garden 7/12 → planted fraction');
ok(run('garden', garden, r => { T.garden.show(r); r.num = '5'; r.den = '7'; }).err === 'part-part', 'garden 5/7 → part-to-part');
ok(run('garden', garden, r => { T.garden.show(r); }).ok, 'garden 5/12 correct');
const gExplain = (() => { const r = { mission: CM.mission('g5-garden'), item: garden, hint: 0 }; T.garden.init(r); T.garden.show(r); return T.garden.explain(r); })();
ok(gExplain.includes('12 − 3 − 4 = 5'), 'garden explanation shows 12 − 3 − 4 = 5');
const plan = CM.mission('g5-garden').items.find(i => i.plan && i.total === 12);
ok(run('garden', plan, r => { T.garden.show(r); r.num = '5'; r.den = '12'; }).ok, 'plan 1 − 1/4 − 1/3 = 5/12');
CM.mission('g5-garden').items.filter(i => !i.plan).forEach(i => {
  const L = i.layout.split('');
  ok(L.length === i.total && L.filter(c => c === 'f').length === i.flowers && L.filter(c => c === 'v').length === i.veg, `garden layout counts for ${i.total}/${i.flowers}/${i.veg}`);
});
CM.mission('g5-garden').items.filter(i => i.plan).forEach(i => {
  ok(Number.isInteger(i.total * i.plan.flowers[0] / i.plan.flowers[1]) && Number.isInteger(i.total * i.plan.veg[0] / i.plan.veg[1]), `plan fractions divide ${i.total} evenly`);
});
CM.mission('g8-balance').items.forEach(i => { const x = (i.d - i.b) / (i.a - i.c); ok(Number.isInteger(x) && x > 0 && i.a * x + i.b === i.c * x + i.d, `balance item has a positive whole solution: ${CM.balanceHelpers.eqText(i)}`); });
ok(run('balance', { a: 3, b: 4, c: 0, d: 19 }, r => r.answer = '15').err === 'nodivide', '3x+4=19, x=15 → forgot to divide');
// balance operations
(() => {
  const m = CM.mission('g8-balance'); const r = { mission: m, item: { a: 4, b: 6, c: 2, d: 14 }, hint: 0 };
  T.balance.init(r);
  r.op = 'x'; r.k = 2; T.balance.handle(r, 'both', { dataset: {} });
  r.op = 'w'; r.k = 6; T.balance.handle(r, 'both', { dataset: {} });
  r.op = 'div'; r.k = 2; T.balance.handle(r, 'both', { dataset: {} });
  ok(CM.balanceHelpers.isolated(r.eq) && r.eq.d === 4, 'balance ops solve 4x+6=2x+14 → x=4');
  const r2 = { mission: m, item: { a: 3, b: 4, c: 0, d: 19 }, hint: 0 }; T.balance.init(r2);
  r2.op = 'div'; r2.k = 3; const res = T.balance.handle(r2, 'both', { dataset: {} });
  ok(res.log && r2.eq.a === 3, 'dividing 3x+4=19 by 3 first is refused with a note');
})();
ok(run('tenframe', { mode: 'count', n: 6, thing: 'apple' }, r => { r.order = [0, 1, 2, 3]; r.answer = 4; }).err === 'skipped', 'counted 4 of 6 → skipped');
ok(run('tenframe', { mode: 'build', n: 14 }, r => { r.filled = CM.h.range(14); }).ok, 'build 14');

/* 4. Mastery rules */
(() => {
  CM.store.load(null);
  const m = CM.mission('g3-arrays'), p = CM.store.m(m.id);
  let tiers = [];
  for (let i = 0; i < 8; i++) { const { tier } = CM.pickItem(m, p); tiers.push(tier); CM.recordResult(m, p, tier, false); if (p.mastered) break; }
  ok(p.mastered, 'clean run reaches mastery');
  ok(tiers.includes(3), 'mastery required reaching tier 3 (' + tiers.join(',') + ')');
  const q = CM.store.m('g3-fraction-compare');
  const mc = CM.mission('g3-fraction-compare');
  CM.recordResult(mc, q, 1, true); const ev = CM.recordResult(mc, q, 1, true);
  ok(ev.some(e => e.startsWith('prereq:g3-fraction-build')), 'two helped answers flag the unmastered prerequisite');
  ok(CM.recommend('3', 5)[0].id === 'g3-fraction-build', 'flagged prerequisite is recommended first');
})();


/* 6. Picture missions: misconceptions */
ok(run('pattern', { unit: ['rc', 'bt'], shown: 4, blanks: 2 }, r => { r.fill = { 0: 'bt', 1: 'bt' }; }).err === 'copylast', 'pattern: copying the last car is detected');
ok(run('shapes', { scene: 'street', target: 'square' }, r => { r.sel = new Set([2, 5, 6]); }).err === 'turned', 'shapes: missing only the turned square is detected');
ok(run('shapes', { scene: 'street', target: 'square' }, r => { r.sel = new Set([2, 5, 6, 10, 7]); }).err === 'rect', 'shapes: picking a rectangle as a square is detected');
ok(run('shapes', { scene: 'park', target: 'circle' }, r => { r.sel = new Set([0, 4, 5]); }).err === 'oval', 'shapes: picking an oval as a circle is detected');
ok(run('numberHop', { mode: 'to', n: 6, max: 10, labels: 'ends' }, r => { r.pos = 7; r.touched = true; }).err === 'off1', 'hop: off by one on a sparse line');
ok(run('numberHop', { mode: 'after', n: 9, max: 10, labels: 'ends' }, r => { r.pos = 9; r.touched = true; }).err === 'same', 'hop: stopping on the given number');
ok(run('compareGroups', { a: 5, b: 7, ta: 'apple', tb: 'flower', layout: 'spreadA' }, r => { r.choice = 'a'; }).err === 'spread', 'compare: choosing the longer-looking row');
ok(run('compareGroups', { a: 6, b: 6, ta: 'star', tb: 'fish', layout: 'spreadB' }, r => { r.choice = 'same'; }).ok, 'compare: equal groups spread differently');
ok(run('clock', { mode: 'read', h: 6 }, r => { r.choice = 12; }).err === 'minute', 'clock: reading the minute hand as the hour');
ok(run('clock', { mode: 'set', h: 3 }, r => { r.hour = 4; r.touched = true; }).err === 'near', 'clock: hand one number off');
ok(CM.TYPES.clock.handle({ item: { mode: 'set', h: 3 }, hour: 12 }, 'dial', { dataset: { angle: '92' } }) && true, 'clock: dial handler accepts an angle');
(() => { const r = { item: { mode: 'set', h: 3 } }; CM.TYPES.clock.init(r); CM.TYPES.clock.handle(r, 'dial', { dataset: { angle: '355' } }); ok(r.hour === 12, 'clock: 355 degrees snaps to 12'); CM.TYPES.clock.handle(r, 'dial', { dataset: { angle: '88' } }); ok(r.hour === 3, 'clock: 88 degrees snaps to 3'); })();
ok(run('robot', { w: 5, h: 1, start: [0, 0], goal: [3, 0] }, r => { r.prog = ['R', 'R', 'R', 'R', 'R']; }).err === 'bump', 'robot: walking off the edge is a bump');
ok(run('robot', { w: 5, h: 1, start: [2, 0], goal: [4, 0] }, r => { r.prog = ['L', 'L']; }).err === 'lr', 'robot: left and right mixed up');
ok(run('robot', { w: 3, h: 4, start: [1, 3], goal: [1, 0] }, r => { r.prog = ['U']; }).err === 'miss', 'robot: stopping short');
CM.mission('k-robot-path').items.forEach(i => ok(CM.robot.solve(i) && CM.robot.solve(i).length <= 14, `robot item solvable within 14 steps (${i.w}x${i.h})`));
CM.mission('k-shape-hunt').items.forEach(i => ok(CM.SCENES[i.scene].parts.filter(p => p.k === i.target).length >= 2, `shape hunt ${i.scene}/${i.target} has at least 2 targets`));

/* 5. Family store */
(() => {
  const mem = {}; const storage = { getItem: k => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  mem['catholic-math-v1'] = JSON.stringify(Object.assign(CM.freshState(), { profile: { name: 'Ana', grade: '5' }, missions: { 'g5-garden': { done: 2 } } }));
  CM.store.load(storage);
  ok(CM.store.children().length === 1 && CM.store.active().name === 'Ana' && CM.store.active().grade === '5', 'v1 data migrates into a first child');
  const a = CM.store.active().id;
  const b = CM.store.addChild({ name: '  Luis ', grade: 'K' });
  ok(b.name === 'Luis' && CM.store.active().id === b.id && CM.store.state.profile.grade === 'K', 'add child selects it and trims the name');
  for (let i = 0; i < 8; i++) CM.store.addChild({ name: 'Kid ' + i, grade: '3' });
  ok(CM.store.children().length === 10, 'no limit on the number of children');
  CM.store.select(b.id); CM.store.m('k-count-build').done = 3; CM.store.save();
  ok(CM.store.withChild(a, () => !CM.store.peek('k-count-build')), 'progress is kept per child');
  ok(CM.store.state === CM.store.child(b.id).data, 'withChild restores the active child');
  CM.store.load(storage);
  ok(CM.store.active().id === b.id && CM.store.peek('k-count-build').done === 3, 'family persists across reloads');
  CM.store.updateChild(b.id, { grade: '1', name: 'Luisito' });
  ok(CM.store.state.profile.grade === '1' && CM.store.active().name === 'Luisito', 'edit child updates grade and name');
  CM.store.removeChild(b.id);
  ok(!CM.store.child(b.id) && CM.store.active() === null, 'delete child clears selection');
  CM.store.load(null);
})();

/* 5b. Family dashboard analytics */
(() => {
  const P = CM.Parents, H = 3600e3, now = new Date(2026, 10, 4, 18).getTime(), day = n => new Date(2026, 10, 4 - n, 17).getTime();
  ok(P.streak([{ t: day(0) }, { t: day(1) }, { t: day(2) }, { t: day(4) }], now) === 3, 'parents: streak counts days in a row');
  ok(P.streak([{ t: day(1) }, { t: day(2) }], now) === 2, 'parents: streak survives until the end of today');
  ok(P.streak([{ t: day(2) }], now) === 0, 'parents: a missed day ends the streak');
  ok(P.estimateSeconds([{ t: now - H }, { t: now - H + 60e3 }, { t: now - H + 30 * 60e3 }], now - 2 * H, now) === 30 + 60 + 30, 'parents: time estimate caps long gaps');
  const acts = [{ mission: 'x', tier: 3, helped: false, t: 1 }, { mission: 'x', tier: 3, helped: true, t: 2 }, { mission: 'x', tier: 2, helped: false, t: 3 }, { mission: 'y', tier: 1, helped: false, t: 4 }, { mission: 'x', tier: 3, helped: false, t: 5 }, { mission: 'x', tier: 3, helped: false, t: 6 }];
  ok(P.masteredAt(acts, 'x') === 6 && P.masteredAt(acts, 'y') === 0, 'parents: mastery time replays the mastery rule');
  const before = JSON.stringify(CM.store.family);
  const fam = P.demoFamily(now);
  ok(JSON.stringify(CM.store.family) === before, 'parents: the sample family never touches the real store');
  ok(fam.children.length === 2 && fam.children.every(c => c.data.activity.length > 50), 'parents: sample family has weeks of practice');
  const st = P.withFamily(fam, () => fam.children.map(c => CM.store.withChild(c.id, () => P.stats(c, now))));
  ok(st.every(s => s.ring.length && s.ring.some(m => m.status === 'mastered') && s.ring.some(m => m.status !== 'mastered')), 'parents: sample shows a mix of mastered and unmastered missions');
  ok(st.every(s => s.accuracy >= 0 && s.accuracy <= 100 && s.streak >= 0), 'parents: stats are in range');
  P._demo = fam;
  const html = P.render({ demo: true });
  ok(html.includes('Sample family') && !/undefined|NaN|\$\{/.test(html), 'parents: sample dashboard renders cleanly');
  ok(!P.render({}).includes('NaN'), 'parents: empty family renders');
  P._demo = null;
})();

/* 6. Read-aloud for pre-readers */
(() => {
  const S = CM.Speech, bad = /[<>&]|undefined|NaN|null|\$\{/;
  ok(S.plain(CM.h.frac(1, 2)) === '1 out of 2', 'read-aloud: fractions read by their label');
  ok(S.plain('Show <b class="big-inline">3</b> o’clock.') === "Show 3 o'clock.", 'read-aloud: strips tags and curly quotes');
  ok(S.plain('12 − 3 − 4 = 5') === '12 minus 3 minus 4 equals 5', 'read-aloud: math symbols become words');
  ok(S.plain('0–10') === '0 to 10', 'read-aloud: number ranges');
  ok(S.plain('10 + 4 = 14') === '10 plus 4 equals 14', 'read-aloud: plus');
  ok(S.plain('Tom &amp; Ana&#39;s') === "Tom & Ana's", 'read-aloud: decodes entities');
  ok(S.prompt('<p class="prompt">How many stars?</p><p class="sub">Touch each one as you count.</p><div>x</div>') === 'How many stars? Touch each one as you count.', 'read-aloud: prompt joins prompt and sub lines');
  ok(!S.supported(), 'read-aloud: no voice under Node, and nothing throws');
  const k = CM.MISSIONS.filter(m => S.offered(m));
  ok(CM.MISSIONS.filter(m => m.grade === 'K').every(m => S.offered(m)), 'read-aloud: offered on every Kindergarten mission');
  ok(S.offered(CM.mission('g3-arrays')), 'read-aloud: offered on stage missions above grade 2');
  ok(!S.offered({ grade: '3' }) && !S.offered({ grade: '8' }), 'read-aloud: not offered above grade 2 without a stage');
  ok(CM.MISSIONS.every(m => m.stage && S.offered(m)), 'every mission is on the stage and can read aloud');
  k.forEach(m => m.items.forEach((item, i) => {
    const T = CM.TYPES[m.type];
    const r = { mission: m, item, tier: item.tier, attempts: 0, hint: 0, solved: false, prog: [] };
    T.init(r);
    const p = S.prompt(T.view(r));
    ok(p.length >= 12 && !bad.test(p), `${m.id}#${i} prompt reads aloud: "${p}"`);
    [1, 2].forEach(lv => { const h = S.plain(T.hint(r, lv)); ok(h.length > 5 && !bad.test(h), `${m.id}#${i} hint ${lv} reads aloud: "${h}"`); });
    T.show(r);
    const e = S.plain(T.explain(r));
    ok(e.length > 20 && !bad.test(e), `${m.id}#${i} explanation reads aloud: "${e}"`);
  }));
  CM.store.load(null);
  ok(S.on(), 'read-aloud: on by default');
  S.setOn(false); ok(!S.on(), 'read-aloud: can be turned off');
  S.setOn(true); ok(S.on(), 'read-aloud: can be turned back on');
  const tf = { mission: CM.mission('k-count-build'), item: { mode: 'count', n: 4, thing: 'apple' } };
  CM.TYPES.tenframe.init(tf);
  ok(CM.TYPES.tenframe.handle(tf, 'tap', { dataset: { i: '2' } }).say === '1' && CM.TYPES.tenframe.handle(tf, 'tap', { dataset: { i: '0' } }).say === '2', 'read-aloud: counting says the next number');
  ok(CM.TYPES.tenframe.handle(tf, 'tap', { dataset: { i: '0' } }).say === '', 'read-aloud: untapping says nothing');
})();

/* 7. Stage missions */
(() => {
  CM.MISSIONS.filter(m => m.stage).forEach(m => ok(CM.Stage.THEMES.includes(m.stage.theme), `${m.id}: stage theme ${m.stage.theme} exists`));
  ok(CM.Stage.mascot('happy').includes('<svg') && CM.Stage.mascot('think').includes('pupil'), 'stage: guide draws every mood');
  CM.mission('g3-arrays').items.forEach(item => {
    const c = CM.TYPES.arrays.choices(item), { a, b } = item;
    ok(c.length === 3 && new Set(c).size === 3 && c.includes(a * b) && c.includes(a + b) && c.every(v => v > 0), `arrays ${a}x${b}: 3 choices with the product and the sum (${c})`);
    const r = { mission: CM.mission('g3-arrays'), item };
    CM.TYPES.arrays.init(r);
    ok(CM.TYPES.arrays.check(r).nudge, `arrays ${a}x${b}: DONE before building only nudges`);
    CM.TYPES.arrays.handle(r, 'sweep', { dataset: { r: String(b), c: String(a) } }); r.answer = String(a * b);
    ok(CM.TYPES.arrays.check(r).ok, `arrays ${a}x${b}: turned array (${b} rows of ${a}) is accepted`);
    r.answer = String(a + b);
    ok(CM.TYPES.arrays.check(r).err === 'added', `arrays ${a}x${b}: picking ${a + b} is caught as adding`);
  });
  const ar = { mission: CM.mission('g3-arrays'), item: { a: 3, b: 4 } }; CM.TYPES.arrays.init(ar);
  CM.TYPES.arrays.key(ar, 'ArrowDown'); CM.TYPES.arrays.key(ar, 'ArrowDown'); CM.TYPES.arrays.key(ar, 'ArrowRight');
  ok(ar.rows === 3 && ar.cols === 2, 'arrays: arrow keys move the corner');
  CM.mission('k-count-build').items.filter(i => i.mode === 'count').forEach(item => {
    const r = { mission: CM.mission('k-count-build'), item, hint: 0 }; CM.TYPES.tenframe.init(r);
    const tiles = [...CM.TYPES.tenframe.view(r).matchAll(/data-act="pick" data-n="(\d+)"/g)].map(x => +x[1]);
    ok(tiles.length === 4 && tiles.includes(item.n), `count ${item.n}: four answer cards include the answer (${tiles})`);
  });
})();

console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
