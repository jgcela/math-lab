/*
 * Curriculum layer: maps the official Denver standards (data/standards.js, data/scope.js)
 * onto the learning path, and defines the missions.
 *
 * Path model: Grade \u2192 Domain \u2192 Unit \u2192 Skill \u2192 Mission \u2192 Mastery
 *   Grade   = a grade section of the 2018 document (K\u20137), or the proposed Grade 8 pathway.
 *   Domain  = the document's Roman-numeral strand (I. Numbers and Operations, II. Measurement, ...).
 *   Unit    = the document's lettered subsection (A. Number Sense, ...) or the strand itself when it has none.
 *   Skill   = one numbered objective, identified as Grade.Strand.Sub.Number (e.g. 3.I.E.1).
 *   Mission = an interactive activity that practices one or more skills.
 *
 * Prerequisite links between missions are editorial decisions made for this prototype.
 * They are labeled as such in the UI and are not part of the official document.
 */
window.CM = window.CM || {};

CM.GRADES = [
  { id: 'K', label: 'Kindergarten', short: 'K', band: 'k2', source: 'K' },
  { id: '1', label: '1st Grade', short: '1', band: 'k2', source: '1' },
  { id: '2', label: '2nd Grade', short: '2', band: 'k2', source: '2' },
  { id: '3', label: '3rd Grade', short: '3', band: '35', source: '3' },
  { id: '4', label: '4th Grade', short: '4', band: '35', source: '4' },
  { id: '5', label: '5th Grade', short: '5', band: '35', source: '5' },
  { id: '6', label: '6th Grade', short: '6', band: '68', source: '6' },
  { id: '7', label: '7th Grade', short: '7', band: '68', source: '7' },
  { id: '8', label: '8th Grade', short: '8', band: '68', source: 'grade8', proposed: true }
];

/*
 * Grade 8. The document has no "8th Grade" standards section. Two parts of it do speak to grade 8:
 *   1. The Scope & Sequence table has a grade 8 column. Rows marked M (Master) in that column are official.
 *   2. Algebra I, Section 1 is titled "Algebra concepts for students who will take Algebra 1 in high school".
 *      Placing Section 1 in grade 8 is this prototype's proposal, not the document's.
 */
CM.GRADE8 = {
  officialNote: 'Skills marked \u201cMaster\u201d in the grade 8 column of the 2018 Scope & Sequence (pages 50\u201359).',
  proposedNote: 'Algebra I, Section 1 (\u201cAlgebra concepts for students who will take Algebra 1 in high school\u201d, pages 30\u201332). The document does not assign these objectives to grade 8.',
  algebraSection: 1
};

CM.MISSIONS = [
  {
    id: 'k-count-build', grade: 'K', type: 'tenframe',
    title: 'Count and Build',
    goal: 'Touch and count objects, then build a group of a given size.',
    standards: ['K.I.A.4', 'K.I.A.9'], scope: ['SS-I-2', 'SS-I-7'],
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, mode: 'count', n: 4, thing: 'apple' }, { tier: 1, mode: 'count', n: 6, thing: 'star' },
      { tier: 1, mode: 'build', n: 5 },
      { tier: 2, mode: 'count', n: 8, thing: 'apple' }, { tier: 2, mode: 'build', n: 9 }, { tier: 2, mode: 'count', n: 10, thing: 'star' },
      { tier: 3, mode: 'build', n: 14 }, { tier: 3, mode: 'build', n: 17 }, { tier: 3, mode: 'build', n: 12 },
      { tier: 4, mode: 'build', n: 26 }, { tier: 4, mode: 'build', n: 30 }
    ]
  },
  {
    id: 'k-pattern-train', grade: 'K', type: 'pattern', art: true,
    title: 'Pattern Train',
    goal: 'Find the part that repeats and finish the train.',
    standards: ['K.V.2'], scope: ['SS-V-109'],
    disposition: 'Develop lines of inquiry (as developmentally appropriate) to understand why things are true and why they are false.',
    prereqs: [],
    items: [
      { tier: 1, unit: ['rc', 'bt'], shown: 4, blanks: 2, extra: ['os'] }, { tier: 1, unit: ['gs', 'ph'], shown: 4, blanks: 2, extra: ['bt'] },
      { tier: 2, unit: ['rc', 'rc', 'bt'], shown: 6, blanks: 3, extra: ['gs'] }, { tier: 2, unit: ['os', 'gs', 'gs'], shown: 6, blanks: 3, extra: ['rc'] }, { tier: 2, unit: ['bt', 'ph', 'pd'], shown: 6, blanks: 3 },
      { tier: 3, unit: ['rc', 'bt', 'os'], shown: 5, blanks: 4, extra: ['gs'] }, { tier: 3, unit: ['gs', 'gs', 'ph', 'ph'], shown: 6, blanks: 4, extra: ['bt'] }, { tier: 3, unit: ['pd', 'rc', 'rc'], shown: 7, blanks: 4 },
      { tier: 4, unit: ['rc', 'bt', 'bt', 'os'], shown: 6, blanks: 5, extra: ['gs'] }, { tier: 4, unit: ['ph', 'gs', 'os', 'gs'], shown: 7, blanks: 5 }
    ]
  },
  {
    id: 'k-shape-hunt', grade: 'K', type: 'shapes', art: true,
    title: 'Shape Hunt',
    goal: 'Find every shape of one kind hiding in a picture.',
    standards: ['K.III.1'], scope: ['SS-III-82'],
    alignNote: 'Uses the 2-D shapes named in K.III.1. Rectangles are never the target, because every square is also a rectangle. Some shapes are turned so children learn that turning a shape does not change it.',
    disposition: 'Survey the truths about mathematical objects that are interesting in their own right and independent of human opinions.',
    prereqs: [],
    items: [
      { tier: 1, scene: 'street', target: 'circle' }, { tier: 1, scene: 'park', target: 'circle' },
      { tier: 2, scene: 'church', target: 'triangle' }, { tier: 2, scene: 'street', target: 'oval' }, { tier: 2, scene: 'park', target: 'oval' },
      { tier: 3, scene: 'street', target: 'triangle' }, { tier: 3, scene: 'street', target: 'square' }, { tier: 3, scene: 'church', target: 'square' }, { tier: 3, scene: 'park', target: 'square' }, { tier: 3, scene: 'park', target: 'triangle' },
      { tier: 4, scene: 'church', target: 'circle' }, { tier: 4, scene: 'church', target: 'oval' }
    ]
  },
  {
    id: 'k-number-hop', grade: 'K', type: 'numberHop', art: true,
    title: 'Hop to the Number',
    goal: 'Move the rabbit to the right place on a number line.',
    standards: ['K.I.A.6'], scope: ['SS-I-4'],
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, mode: 'to', n: 4, max: 10, labels: 'all' }, { tier: 1, mode: 'to', n: 8, max: 10, labels: 'all' },
      { tier: 2, mode: 'to', n: 6, max: 10, labels: 'ends' }, { tier: 2, mode: 'after', n: 9, max: 10, labels: 'ends' }, { tier: 2, mode: 'to', n: 3, max: 10, labels: 'ends' },
      { tier: 3, mode: 'between', a: 12, b: 14, max: 20, labels: 'fives' }, { tier: 3, mode: 'to', n: 17, max: 20, labels: 'fives' }, { tier: 3, mode: 'before', n: 11, max: 20, labels: 'fives' },
      { tier: 4, mode: 'to', n: 23, max: 30, labels: 'tens' }, { tier: 4, mode: 'between', a: 27, b: 29, max: 30, labels: 'tens' }
    ]
  },
  {
    id: 'k-which-more', grade: 'K', type: 'compareGroups', art: true,
    title: 'Which Has More?',
    goal: 'Compare two groups by matching them one to one.',
    standards: ['K.I.A.10'], scope: ['SS-I-8'],
    alignNote: 'Level 3 spreads the smaller group out so it looks longer. Matching one to one shows that spreading things out does not change how many there are.',
    disposition: 'Develop lines of inquiry (as developmentally appropriate) to understand why things are true and why they are false.',
    prereqs: [],
    items: [
      { tier: 1, a: 3, b: 6, ta: 'apple', tb: 'flower', layout: 'even' }, { tier: 1, a: 7, b: 2, ta: 'star', tb: 'fish', layout: 'even' },
      { tier: 2, a: 5, b: 7, ta: 'fish', tb: 'apple', layout: 'even' }, { tier: 2, a: 8, b: 6, ta: 'flower', tb: 'star', layout: 'even' }, { tier: 2, a: 4, b: 4, ta: 'apple', tb: 'star', layout: 'even' },
      { tier: 3, a: 5, b: 7, ta: 'apple', tb: 'flower', layout: 'spreadA' }, { tier: 3, a: 6, b: 6, ta: 'star', tb: 'fish', layout: 'spreadB' }, { tier: 3, a: 9, b: 8, ta: 'fish', tb: 'flower', layout: 'spreadB' },
      { tier: 4, a: 12, b: 13, ta: 'apple', tb: 'star', layout: 'spreadA' }, { tier: 4, a: 10, b: 10, ta: 'flower', tb: 'apple', layout: 'spreadA' }
    ]
  },
  {
    id: 'k-clock', grade: 'K', type: 'clock', art: true,
    title: 'What Time Is It?',
    goal: 'Read and show each hour on a clock.',
    standards: ['K.II.B.4'], scope: ['SS-II-73'],
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, mode: 'set', h: 3 }, { tier: 1, mode: 'read', h: 6 }, { tier: 1, mode: 'set', h: 12 },
      { tier: 2, mode: 'set', h: 8 }, { tier: 2, mode: 'read', h: 9 }, { tier: 2, mode: 'set', h: 10 }, { tier: 2, mode: 'read', h: 2 },
      { tier: 3, mode: 'set', h: 7 }, { tier: 3, mode: 'read', h: 11 }, { tier: 3, mode: 'set', h: 4 }, { tier: 3, mode: 'read', h: 5 },
      { tier: 4, mode: 'set', h: 9 }, { tier: 4, mode: 'read', h: 1 }
    ]
  },
  {
    id: 'k-robot-path', grade: 'K', type: 'robot', art: true,
    title: 'Robot Path',
    goal: 'Plan steps with up, down, left, and right to reach the flower.',
    standards: ['K.III.2'], scope: [],
    alignNote: 'Practices the spatial words up, down, left, and right (K.III.2) by giving a robot step-by-step directions. Planning steps in order is also an early algorithm; the 2018 document does not name algorithms for Kindergarten.',
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, w: 5, h: 1, start: [0, 0], goal: [3, 0] }, { tier: 1, w: 3, h: 4, start: [1, 3], goal: [1, 0] },
      { tier: 2, w: 4, h: 4, start: [0, 3], goal: [3, 1] }, { tier: 2, w: 5, h: 3, start: [4, 2], goal: [0, 0], rocks: [[2, 2]] }, { tier: 2, w: 4, h: 4, start: [3, 0], goal: [0, 3], rocks: [[1, 1]] },
      { tier: 3, w: 5, h: 4, start: [0, 3], goal: [4, 0], rocks: [[1, 2], [2, 2], [3, 1], [3, 2]] }, { tier: 3, w: 5, h: 5, start: [2, 4], goal: [2, 0], rocks: [[1, 2], [2, 2], [3, 2]] }, { tier: 3, w: 5, h: 4, start: [0, 0], goal: [4, 3], rocks: [[1, 0], [1, 1], [3, 2], [3, 3]] },
      { tier: 4, w: 6, h: 5, start: [0, 4], goal: [5, 0], rocks: [[1, 4], [1, 3], [1, 2], [3, 0], [3, 1], [3, 2], [4, 2]] }, { tier: 4, w: 6, h: 4, start: [0, 0], goal: [5, 3], rocks: [[1, 1], [2, 1], [3, 1], [4, 1], [4, 3], [2, 3]] }
    ]
  },
  {
    id: 'g3-fraction-build', grade: '3', type: 'fractionBuild',
    title: 'Build a Fraction',
    goal: 'Cut a whole into equal pieces and color the right number of them.',
    standards: ['3.I.E.2'], scope: ['SS-I-51'],
    alignNote: 'Practices proper fractions with a model (3.I.E.2) and the Scope & Sequence row \u201cIdentify unit/simple fractions\u201d, which is in its Develop stage in grade 3.',
    disposition: 'Develop lines of inquiry (as developmentally appropriate) to understand why things are true and why they are false.',
    prereqs: [],
    items: [
      { tier: 1, a: 1, b: 2 }, { tier: 1, a: 1, b: 4 }, { tier: 2, a: 3, b: 4 }, { tier: 2, a: 2, b: 3 },
      { tier: 3, a: 5, b: 6 }, { tier: 3, a: 3, b: 8 }, { tier: 3, a: 2, b: 5 }, { tier: 4, a: 7, b: 10 }, { tier: 4, a: 5, b: 12 }
    ]
  },
  {
    id: 'g3-fraction-compare', grade: '3', type: 'fractionCompare',
    title: 'Which Is More?',
    goal: 'Compare two fractions using same-size fraction bars.',
    standards: ['3.I.E.3'], scope: ['SS-I-54'],
    disposition: 'Develop lines of inquiry (as developmentally appropriate) to understand why things are true and why they are false.',
    prereqs: ['g3-fraction-build'],
    items: [
      { tier: 1, x: [2, 5], y: [4, 5] }, { tier: 1, x: [5, 8], y: [3, 8] },
      { tier: 2, x: [1, 3], y: [1, 5] }, { tier: 2, x: [1, 4], y: [1, 2] }, { tier: 2, x: [1, 6], y: [1, 3] },
      { tier: 3, x: [2, 3], y: [3, 4] }, { tier: 3, x: [1, 2], y: [2, 4] }, { tier: 3, x: [3, 5], y: [2, 3] },
      { tier: 4, x: [5, 6], y: [7, 8] }, { tier: 4, x: [2, 6], y: [1, 3] }
    ]
  },
  {
    id: 'g3-fraction-equiv', grade: '3', type: 'fractionEquiv',
    title: 'Same Amount, New Pieces',
    goal: 'Find an equivalent fraction by matching the amount on a fraction bar.',
    standards: ['3.I.E.1'], scope: ['SS-I-52'],
    disposition: 'Survey the truths about mathematical objects that are interesting in their own right and independent of human opinions.',
    prereqs: ['g3-fraction-build'],
    items: [
      { tier: 1, a: 1, b: 2, d: 4 }, { tier: 1, a: 1, b: 2, d: 6 }, { tier: 2, a: 1, b: 3, d: 6 }, { tier: 2, a: 1, b: 4, d: 8 },
      { tier: 3, a: 3, b: 4, d: 8 }, { tier: 3, a: 2, b: 3, d: 6 }, { tier: 3, a: 2, b: 5, d: 10 }, { tier: 4, a: 3, b: 4, d: 12 }, { tier: 4, a: 4, b: 6, d: 3 }
    ]
  },
  {
    id: 'g3-arrays', grade: '3', type: 'arrays',
    title: 'Array Builder',
    goal: 'Show multiplication as equal rows, then find the total.',
    standards: ['3.I.C.1', '3.I.C.2'], scope: ['SS-I-32', 'SS-I-33'],
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, a: 2, b: 5 }, { tier: 1, a: 3, b: 4 }, { tier: 2, a: 4, b: 4 }, { tier: 2, a: 5, b: 3 }, { tier: 2, a: 2, b: 7 },
      { tier: 3, a: 3, b: 7 }, { tier: 3, a: 4, b: 6 }, { tier: 3, a: 6, b: 5 }, { tier: 4, a: 7, b: 8 }, { tier: 4, a: 9, b: 6 }
    ]
  },
  {
    id: 'g3-add-regroup', grade: '3', type: 'addRegroup',
    title: 'Add with Trades',
    goal: 'Add multi-digit numbers, trading 10 ones for a ten when needed.',
    standards: ['3.I.B.1', '3.I.B.2'], scope: ['SS-I-24', 'SS-I-27'],
    disposition: 'Develop the mental habits of precise, determined, careful, and accurate questioning, inquiry, and reasoning.',
    prereqs: [],
    items: [
      { tier: 1, x: 24, y: 13 }, { tier: 1, x: 47, y: 25 }, { tier: 2, x: 38, y: 46 }, { tier: 2, x: 156, y: 27 },
      { tier: 3, x: 265, y: 148 }, { tier: 3, x: 329, y: 52 }, { tier: 3, x: 408, y: 275 }, { tier: 4, x: 3586, y: 2747 }, { tier: 4, x: 6095, y: 1907 }
    ]
  },
  {
    id: 'g3-sub-regroup', grade: '3', type: 'subRegroup',
    title: 'Subtract with Trades',
    goal: 'Subtract multi-digit numbers, breaking a ten or hundred when a place runs short, including across zeros.',
    standards: ['3.I.B.1', '3.I.B.2'], scope: ['SS-I-24', 'SS-I-27'],
    disposition: 'The natural virtues of self-discipline and fortitude.',
    dispositionSource: 'Philosophy, page 4',
    prereqs: ['g3-add-regroup'],
    items: [
      { tier: 1, x: 58, y: 23 }, { tier: 1, x: 52, y: 27 }, { tier: 2, x: 81, y: 46 }, { tier: 2, x: 143, y: 28 },
      { tier: 3, x: 325, y: 162 }, { tier: 3, x: 452, y: 187 }, { tier: 3, x: 400, y: 135 }, { tier: 4, x: 5003, y: 1268 }, { tier: 4, x: 7000, y: 2385 }
    ]
  },
  {
    id: 'g5-garden', grade: '5', type: 'garden',
    title: 'The Garden Challenge',
    goal: 'Find what fraction of a community garden is still available.',
    standards: ['5.I.E.3'], scope: ['SS-I-58'],
    alignNote: 'Early items use like denominators; the planning items use unlike denominators (1/4 and 1/3 of the same garden), which is the grade 5 objective.',
    disposition: 'Survey the truths about mathematical objects that are interesting in their own right and independent of human opinions.',
    prereqs: ['g3-fraction-equiv'],
    items: [
      { tier: 1, total: 12, cols: 4, flowers: 3, veg: 4, layout: 'fveevfeevfve' },
      { tier: 1, total: 8, cols: 4, flowers: 2, veg: 3, layout: 'fevvefve' },
      { tier: 2, total: 10, cols: 5, flowers: 3, veg: 2, layout: 'fevfeeevef' },
      { tier: 2, total: 12, cols: 4, flowers: 5, veg: 3, layout: 'ffvefevfeevf' },
      { tier: 3, total: 12, cols: 4, plan: { flowers: [1, 4], veg: [1, 3] } },
      { tier: 3, total: 20, cols: 5, plan: { flowers: [1, 5], veg: [1, 2] } },
      { tier: 4, total: 24, cols: 6, plan: { flowers: [1, 6], veg: [3, 8] } }
    ]
  },
  {
    id: 'g8-balance', grade: '8', type: 'balance',
    title: 'Balance the Equation',
    goal: 'Solve linear equations by doing the same thing to both sides of a balance.',
    standards: ['ALG1.III.1', 'ALG1.III.2'], scope: ['SS-V-114'],
    alignNote: 'Official: the Scope & Sequence marks \u201cUse inverse operations, solve for unknown variables\u201d as Master in grade 8. The Algebra I objectives are linked through the proposed grade 8 mapping. Builds on 7.V.1.',
    buildsOn: ['7.V.1'],
    disposition: 'Develop lines of inquiry to understand why things are true and why they are false.',
    prereqs: [],
    items: [
      { tier: 1, a: 1, b: 5, c: 0, d: 12 }, { tier: 1, a: 2, b: 0, c: 0, d: 14 },
      { tier: 2, a: 3, b: 4, c: 0, d: 19 }, { tier: 2, a: 2, b: 7, c: 0, d: 15 }, { tier: 2, a: 5, b: 3, c: 0, d: 28 },
      { tier: 3, a: 4, b: 6, c: 2, d: 14 }, { tier: 3, a: 5, b: 2, c: 3, d: 10 }, { tier: 3, a: 3, b: 1, c: 1, d: 13 },
      { tier: 4, a: 6, b: 4, c: 2, d: 24 }, { tier: 4, a: 7, b: 3, c: 4, d: 21 }
    ]
  }
];

CM.CHALLENGES = [
  {
    id: 'magic-square', type: 'magicSquare', grades: ['3', '4', '5', '6', '7', '8'],
    title: 'The Magic Square',
    goal: 'Place 1 through 9 so every row, column, and diagonal adds to the same total.',
    standards: ['3.V.3', '3.V.4'],
    note: 'There is more than one correct square. After you find one, try to find another.'
  }
];

CM.LAB_TOOLS = [
  { id: 'fraction-bars', title: 'Fraction Bars', bands: ['k2', '35', '68'], ready: true, blurb: 'Cut wholes into equal pieces and compare amounts.' },
  { id: 'base-ten', title: 'Base-Ten Blocks', bands: ['k2', '35'], ready: true, blurb: 'Build numbers with hundreds, tens, and ones. Trade between places.' },
  { id: 'number-line', title: 'Number Line', bands: ['k2', '35', '68'], ready: true, blurb: 'Place whole numbers, fractions, and integers.' },
  { id: 'balance', title: 'Balance Model', bands: ['68'], ready: true, blurb: 'Build any equation and keep it balanced.' },
  { id: 'clock', title: 'Clock', bands: ['k2', '35'], ready: false },
  { id: 'shapes', title: 'Geometric Shapes', bands: ['k2', '35', '68'], ready: false },
  { id: 'measure', title: 'Measurement Tools', bands: ['k2', '35'], ready: false },
  { id: 'coordinate', title: 'Coordinate Plane', bands: ['35', '68'], ready: false },
  { id: 'graphs', title: 'Graphs', bands: ['k2', '35', '68'], ready: false },
  { id: 'patterns', title: 'Pattern Builder', bands: ['k2', '35'], ready: false }
];
