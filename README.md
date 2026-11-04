# Catholic Math — K–8 prototype

Interactive mathematics aligned to the **Archdiocese of Denver Catholic Schools 2018 Math Standards**.

## Stack

Plain HTML, CSS, and JavaScript with no build step. Chosen so the app runs as a static site (and as a claude.ai artifact) and can be opened on any tablet browser. The code is split so it can move to React/TypeScript later without changing the curriculum data:

```
data/standards.js     Generated. Every objective PK–7 and Algebra I with ID, text, and PDF page.
data/scope.js         Generated. The Scope & Sequence table (I/D/M by grade, PK–8).
data/curriculum.js    Grades, the grade 8 mapping, missions, challenges, Math Lab tools.
js/core.js            Curriculum index, learning-path builder, progress store, mastery rules, recommendations.
js/stage.js           Full-screen mission stage: themed scenery and the owl guide (original SVG art).
js/speech.js          Read-aloud for K–2 missions (browser voice, Web Speech API). Pure text helpers are tested under Node.
js/types/*.js         One file per mission type. Each exports init, view, handle, check, hint, show, explain.
js/engine.js          Runs any mission type: challenge → check → hints → worked solution → explanation → mastery.
js/lab.js             Math Lab tools.
js/challenges.js      Challenges.
js/app.js             Routing and screens (dashboard, path, lab, challenges, parents and teachers).
tools/                Python scripts that rebuild the data files from the PDF.
tests/run-tests.js    Node tests (`node tests/run-tests.js`).
```

## Rebuilding the standards data

```
pdftotext -layout standards.pdf standards.txt
python3 tools/parse.py standards.txt standards.json
pdftotext -bbox -f 50 -l 61 standards.pdf ss_bbox.html
python3 tools/parse_ss.py ss_bbox.html scope.json
python3 tools/build_data.py standards.json scope.json
```

`build_data.py` restores five objectives whose symbols were lost in text extraction (stacked fractions, superscripts). Each is flagged `corrected` and keeps the raw text.

## Skill IDs

`Grade.Strand.Section.Number`, following the document: `3.I.E.1` is 3rd Grade, I. Numbers and Operations, E. Fractions…, objective 1. Strands without lettered sections omit the letter (`5.III.9`). Algebra I keeps its own numbering (`ALG1.III.1`). Where the document repeats a number (1st Grade I.D lists 5 and 6 twice), the second copy gets a `b` suffix and a note.

## Grade 8

The document has no 8th Grade section. The app's grade 8 path has two clearly labeled parts:

1. **Official:** the 21 Scope & Sequence rows with a mark in the grade 8 column (all are “M”).
2. **Proposed:** Algebra I, Section 1 (“Algebra concepts for students who will take Algebra 1 in high school”). This placement is the app's proposal.

## Adaptive rules (rule-based, transparent)

- Items are in tiers 1–3, plus tier 4 stretch problems offered after mastery.
- 2 clean answers in a row at a tier move up one tier. A helped answer (a wrong attempt or a hint) moves down one tier and queues a review.
- Mastery: 3 clean answers in a row, including one at tier 3.
- 2 helped answers in a row on a mission whose suggested prerequisites are not mastered: the app recommends the prerequisite first.
- Prerequisite links between missions are editorial and labeled as such in the UI.

## What is built

| Area | Status |
|---|---|
| Curriculum data for K–7, Algebra I, Scope & Sequence | Built, traceable to page numbers |
| Learning path for every grade, K–8, with all skills | Built |
| Student dashboard, recommendations, continue learning | Built |
| Mission engine with hints, worked solutions, explanations, mastery, review | Built |
| Missions | 15: K (7, six of them picture-first), Grade 3 (6), Grade 5 Garden Challenge (1), Grade 8 balance (1) |
| Picture-first interactions | Drag and drop with tap fallback, clock dial, animated robot run, tappable SVG scenes (`js/types/visual.js`) |
| Math Lab | 4 of 10 tools: fraction bars, base-ten blocks, number line, balance |
| Challenges | 1: magic square |
| Family profiles (unlimited children) and family dashboard | Built, stored in this browser (localStorage) |
| Per-child report for parents and teachers | Built |
| Accounts, classes, sync, teacher roster | Not built |
| Read-aloud for pre-readers (K–2) | Built: instructions, hints, feedback and explanations, with Hear it and an on/off toggle per child. Uses the device's built-in voice, so quality depends on the device. |

Missions cover 19 of the 480 skills on the K–8 path. The rest of the path lists skills with “No mission yet.”

## Read-aloud

Missions in the K–2 band read themselves aloud with the browser's own voice (`speechSynthesis`). Nothing is downloaded or sent anywhere.

- A new problem reads its instructions. Hints, feedback, and the explanation are read when they appear.
- In Count and Build, each tap says the next number, so the child hears one number per object.
- **Hear it** repeats; the speaker button turns reading off or on for that child (saved with the child's progress).
- iPad and iPhone only start speech from a tap, so the first tap anywhere in the app unlocks the voice.
- The voice is picked from the device's US English voices, preferring natural ones (Samantha, Ava, Google US English, Microsoft Aria/Jenny).

Not tested on a real iPad yet: the tests use a stand-in voice.

## Full-screen stage (sample)

Missions with `stage: { theme }` in `data/curriculum.js` open full screen: a themed scene, a white board with the activity, and a side panel with the instruction, the speaker, an owl guide whose face reacts (calm, thinking, happy), the tutor's words, and a big DONE button. On phones and portrait tablets the panel moves above the board.

Two missions use it so far, as samples: **Count and Build** (K, meadow) and **Array Builder** (grade 3, snow). Array Builder was rebuilt for it: the child sweeps a finger across a 10 × 10 field of snowballs to frame the rows and columns, then picks the total from three cards. One card is always a + b, so adding instead of multiplying is still caught. Arrow keys move the frame for keyboard users.

All art is drawn in code as flat shapes. It is original and simple; it does not match hand-made illustration.
