/* Read-aloud for pre-readers (K\u20132 band).
 * Uses the browser's built-in voice (Web Speech API): no audio files, no network, nothing leaves the device.
 * The text helpers are pure so they can be tested under Node. */
(function (CM) {
  'use strict';
  const S = CM.Speech = {};
  const g = typeof window !== 'undefined' ? window : {};
  const synth = g.speechSynthesis || null;
  const Utter = g.SpeechSynthesisUtterance || null;

  /* ---------- text ---------- */
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: "'", lsquo: "'", ldquo: '"', rdquo: '"', ndash: '\u2013', mdash: '\u2014', times: '\u00d7', divide: '\u00f7', minus: '\u2212' };
  /* Turns the HTML the app renders into a sentence a voice can read. */
  S.plain = function (html) {
    let s = String(html == null ? '' : html);
    // A fraction is drawn as two stacked numbers; read its label ("1 out of 2") instead.
    s = s.replace(/<span class="frac"[^>]*aria-label="([^"]*)"[^>]*>(?:<span[^>]*>[^<]*<\/span>)*<\/span>/g, ' $1 ');
    s = s.replace(/<(br|\/p|\/li|\/div)\b[^>]*>/gi, '. ');
    s = s.replace(/<[^>]*>/g, '');
    s = s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e) => {
      if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return isNaN(n) ? '' : String.fromCharCode(n); }
      return ENT[e.toLowerCase()] !== undefined ? ENT[e.toLowerCase()] : '';
    });
    s = s.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"');
    s = s.replace(/(\d)\s*\u2013\s*(\d)/g, '$1 to $2');
    s = s.replace(/\s*\u2212\s*/g, ' minus ').replace(/\s*\u00d7\s*/g, ' times ').replace(/\s*\u00f7\s*/g, ' divided by ').replace(/\s+=\s+/g, ' equals ').replace(/(\d)\s*\+\s*(\d)/g, '$1 plus $2');
    s = s.replace(/[\u2013\u2014]/g, ', ').replace(/\u2192/g, ' ');
    s = s.replace(/\s+/g, ' ').replace(/\s+([.,!?])/g, '$1').replace(/([.!?])(\s*[.])+/g, '$1').replace(/^[\s.,]+/, '').trim();
    return s;
  };
  /* The instructions of a problem: the type's .prompt and .sub paragraphs, in order. */
  S.prompt = function (html) {
    const out = [], re = /<p class="(?:prompt|sub)"[^>]*>([\s\S]*?)<\/p>/g;
    let m;
    while ((m = re.exec(String(html)))) { const t = S.plain(m[1]); if (t) out.push(/[.!?]$/.test(t) ? t : t + '.'); }
    return out.join(' ');
  };

  /* ---------- settings ---------- */
  /* Read-aloud is offered where children may not read yet: the K\u20132 band. */
  /* and on every full-screen stage mission, where the speaker sits next to the instruction. */
  S.offered = mission => !!mission && (!!mission.stage || (CM.grade(mission.grade) || {}).band === 'k2');
  /* Per child, on by default. Stored with the child's progress. */
  S.on = () => CM.store.state.audio !== false;
  S.setOn = v => { CM.store.state.audio = !!v; if (!v) S.stop(); CM.store.save(); };
  S.supported = () => !!(synth && Utter);
  S.active = mission => S.supported() && S.offered(mission) && S.on();

  /* ---------- voice ---------- */
  // Natural-sounding US English voices on iPad, Mac, Chrome, and Windows, best first.
  const PREFERRED = ['Samantha', 'Ava', 'Allison', 'Susan', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira'];
  let voice = null;
  S.pickVoice = function (voices) {
    const en = (voices || []).filter(v => /^en[-_]US/i.test(v.lang));
    const pool = en.length ? en : (voices || []).filter(v => /^en/i.test(v.lang));
    const score = v => {
      const i = PREFERRED.findIndex(p => v.name.indexOf(p) > -1);
      return (i > -1 ? 100 - i : 0) + (/premium|enhanced|natural/i.test(v.name) ? 20 : 0) + (v.localService ? 5 : 0) - (/novelty|whisper|bad news|bells|boing|bubbles|cellos|zarvox|trinoids|organ|jester|albert|fred/i.test(v.name) ? 200 : 0);
    };
    return pool.slice().sort((a, b) => score(b) - score(a))[0] || null;
  };
  function loadVoice() { if (synth) voice = S.pickVoice(synth.getVoices()); }
  if (synth) { loadVoice(); if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoice); }

  S.say = function (text) {
    if (!S.supported()) return false;
    const t = S.plain(text);
    if (!t) return false;
    synth.cancel();
    const u = new Utter(t);
    if (!voice) loadVoice();
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-US';
    u.rate = 0.9; u.pitch = 1.05;
    try { synth.speak(u); } catch (e) { return false; }
    return true;
  };
  S.stop = () => { if (synth) synth.cancel(); };

  /* iPad and iPhone only allow speech that starts from a tap. Opening a mission goes through a page change,
   * so an empty utterance on the first tap unlocks the voice for the rest of the visit. */
  if (synth && Utter && typeof document !== 'undefined') {
    const unlock = () => {
      document.removeEventListener('pointerdown', unlock, true);
      document.removeEventListener('keydown', unlock, true);
      try { const u = new Utter(' '); u.volume = 0; synth.speak(u); } catch (e) { }
    };
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }
})(typeof window !== 'undefined' ? window.CM : global.CM);
