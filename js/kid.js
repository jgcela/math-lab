/* Kid-facing art: round flat characters, the farm scene, and the guide owl.
 * All shapes are original and drawn in code. Colors are warm and saturated, with blush cheeks. */
(function (CM) {
  'use strict';
  const K = CM.Kid = {};
  const cheeks = (x1, x2, y, r) => `<ellipse cx="${x1}" cy="${y}" rx="${r}" ry="${r * .7}" fill="#ff9c8a" opacity=".55"/><ellipse cx="${x2}" cy="${y}" rx="${r}" ry="${r * .7}" fill="#ff9c8a" opacity=".55"/>`;

  /* Characters, each in a 100 x 100 box, standing on y = 96. */
  K.art = {
    sheep: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <g fill="#5b4038"><rect x="28" y="70" width="7" height="24" rx="3"/><rect x="40" y="72" width="7" height="22" rx="3"/><rect x="58" y="72" width="7" height="22" rx="3"/><rect x="70" y="70" width="7" height="24" rx="3"/></g>
      <g fill="#ffe6d6"><rect x="28" y="70" width="7" height="16" rx="3"/><rect x="40" y="72" width="7" height="14" rx="3"/><rect x="58" y="72" width="7" height="14" rx="3"/><rect x="70" y="70" width="7" height="16" rx="3"/></g>
      <g fill="#ffffff" stroke="#e9e3df" stroke-width="1.5">${[[30, 52, 16], [44, 44, 17], [60, 44, 17], [74, 52, 15], [52, 60, 20], [34, 66, 14], [70, 66, 14]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>
      <ellipse cx="52" cy="58" rx="28" ry="18" fill="#ffffff"/>
      <ellipse cx="22" cy="44" rx="9" ry="5" fill="#ffd2bd" transform="rotate(-25 22 44)"/><ellipse cx="62" cy="44" rx="9" ry="5" fill="#ffd2bd" transform="rotate(25 62 44)"/>
      <ellipse cx="42" cy="48" rx="16" ry="17" fill="#ffe6d6"/>
      <g fill="#ffffff"><circle cx="36" cy="30" r="8"/><circle cx="46" cy="28" r="9"/><circle cx="54" cy="33" r="7"/></g>
      <circle cx="36" cy="48" r="3" fill="#2b2230"/><circle cx="48" cy="48" r="3" fill="#2b2230"/><circle cx="37" cy="47" r="1" fill="#fff"/><circle cx="49" cy="47" r="1" fill="#fff"/>
      ${cheeks(32, 52, 54, 3.5)}
      <path d="M38 55 q4 5 8 0" fill="#e2626b"/><ellipse cx="42" cy="52.5" rx="2" ry="1.4" fill="#7a4a3a"/>
    </svg>`,
    chick: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <g stroke="#f08a24" stroke-width="4" stroke-linecap="round"><path d="M40 84 v10 M34 94 h12 M60 84 v10 M54 94 h12"/></g>
      <ellipse cx="50" cy="60" rx="32" ry="30" fill="#ffd43b"/>
      <path d="M22 58 q-10 8 2 16 q6 -6 6 -14z" fill="#ffc21a"/><path d="M78 58 q10 8 -2 16 q-6 -6 -6 -14z" fill="#ffc21a"/>
      <path d="M46 26 q4 -10 8 0 q6 -8 6 2" fill="none" stroke="#ffc21a" stroke-width="5" stroke-linecap="round"/>
      <circle cx="40" cy="52" r="4" fill="#2b2230"/><circle cx="60" cy="52" r="4" fill="#2b2230"/><circle cx="41.2" cy="50.6" r="1.3" fill="#fff"/><circle cx="61.2" cy="50.6" r="1.3" fill="#fff"/>
      ${cheeks(33, 67, 60, 5)}
      <path d="M44 58 L56 58 L50 66Z" fill="#f08a24"/>
    </svg>`
  };

  /* The guide owl. mood: calm | think | happy. */
  K.owl = function (mood, head) {
    const eye = cx => mood === 'happy'
      ? `<path d="M${cx - 9} 44 q9 -10 18 0" fill="none" stroke="#2b2230" stroke-width="4.5" stroke-linecap="round"/>`
      : `<circle cx="${cx}" cy="44" r="13" fill="#fff"/><g class="pupil"><circle cx="${cx + (mood === 'think' ? 3 : 1)}" cy="${44 - (mood === 'think' ? 4 : 0)}" r="7" fill="#2b2230"/><circle cx="${cx + (mood === 'think' ? 5 : 3)}" cy="${41 - (mood === 'think' ? 4 : 0)}" r="2.2" fill="#fff"/></g>`;
    const face = `<path d="M18 22 L28 6 L38 22Z M82 22 L72 6 L62 22Z" fill="#a8683e"/>
      <ellipse cx="50" cy="${head ? 50 : 52}" rx="38" ry="${head ? 38 : 40}" fill="#c47b46"/>
      <path d="M50 30 q-30 -6 -32 18 q0 22 32 30 q32 -8 32 -30 q-2 -24 -32 -18z" fill="#f6dcc0"/>
      ${eye(36)}${eye(64)}
      ${cheeks(26, 74, 58, 6)}
      <path d="M44 54 L56 54 L50 63Z" fill="#f59f1b"/>`;
    if (head) return `<svg class="owl-head" viewBox="0 0 100 92" aria-hidden="true">${face}</svg>`;
    return `<svg class="owl mood-${mood}" viewBox="0 0 100 130" aria-hidden="true">
      <ellipse cx="50" cy="88" rx="40" ry="38" fill="#c47b46"/>
      <ellipse cx="50" cy="96" rx="25" ry="27" fill="#f6dcc0"/>
      <g fill="#e3b892"><path d="M40 92 q5 5 10 0 M50 92 q5 5 10 0 M44 104 q5 5 10 0"/></g>
      <path class="wing" d="M12 80 q-12 26 10 40 q2 -22 6 -34z" fill="#a8683e"/>
      <path class="wing r" d="M88 80 q12 26 -10 40 q-2 -22 -6 -34z" fill="#a8683e"/>
      <g fill="#f59f1b"><path d="M36 122 l-6 7 h12z M48 124 l-4 5 h8z M58 122 l-6 7 h12z"/></g>
      <g transform="translate(0 4)">${face}</g>
    </svg>`;
  };

  /* Full-screen farm: sky, barn, fence, and a big field for the activity. */
  K.SCENES = {
    farm: `<svg class="pl-scene" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs><linearGradient id="kd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd0f5"/><stop offset="1" stop-color="#c9ecfb"/></linearGradient></defs>
      <rect width="1000" height="700" fill="url(#kd-sky)"/>
      <circle cx="120" cy="70" r="44" fill="#ffe170"/><circle cx="120" cy="70" r="64" fill="#ffe170" opacity=".25"/>
      <g fill="#fff">${[[320, 70, 1], [620, 110, .8], [860, 60, 1.1]].map(([x, y, k]) => `<g transform="translate(${x} ${y}) scale(${k})"><ellipse cx="0" cy="10" rx="56" ry="20"/><circle cx="-20" cy="0" r="22"/><circle cx="12" cy="-8" r="28"/><circle cx="36" cy="4" r="18"/></g>`).join('')}</g>
      <path d="M0 230 Q160 150 330 215 T680 205 T1000 190 L1000 300 L0 300Z" fill="#9ddc7a"/>
      <g transform="translate(790 130)"><path d="M0 70 L80 10 L160 70 L160 170 L0 170Z" fill="#e2483d"/><path d="M-8 74 L80 4 L168 74" fill="none" stroke="#a52f2a" stroke-width="10" stroke-linejoin="round"/>
        <rect x="52" y="96" width="56" height="74" fill="#fff4e0"/><path d="M52 96 L108 170 M108 96 L52 170" stroke="#e2483d" stroke-width="8"/><circle cx="80" cy="56" r="14" fill="#fff4e0"/></g>
      <g transform="translate(70 120)"><rect x="-10" y="60" width="20" height="120" fill="#8a5a35"/><circle cx="0" cy="40" r="60" fill="#5fbf4f"/><circle cx="-40" cy="74" r="38" fill="#5fbf4f"/><circle cx="42" cy="72" r="40" fill="#5fbf4f"/>
        <g fill="#ff6b6b"><circle cx="-20" cy="30" r="8"/><circle cx="24" cy="50" r="8"/><circle cx="-44" cy="70" r="8"/><circle cx="10" cy="14" r="7"/></g></g>
      <rect x="0" y="262" width="1000" height="40" fill="#f6cf4a"/>
      <g fill="#ffffff" stroke="#e1e1da" stroke-width="2">${Array.from({ length: 21 }, (_, i) => `<path d="M${i * 50 + 8} 300 V246 l12 -12 l12 12 V300Z"/>`).join('')}<rect x="0" y="258" width="1000" height="10"/><rect x="0" y="280" width="1000" height="10"/></g>
      <rect x="0" y="300" width="1000" height="400" fill="#7cd15c"/>
      <g fill="#64bb46">${[[90, 380], [260, 470], [520, 360], [700, 450], [900, 380], [380, 600], [800, 610], [150, 560]].map(([x, y]) => `<path d="M${x} ${y} q-6 -16 -2 -20 q4 8 6 14 q2 -14 8 -18 q2 10 -2 24z"/>`).join('')}</g>
      <g fill="#66c04a"><circle cx="40" cy="700" r="80"/><circle cx="140" cy="720" r="70"/><circle cx="900" cy="710" r="90"/><circle cx="990" cy="690" r="60"/></g>
    </svg>`
  };

  /* The farm joins the stage scenes, so any mission can use it. */
  if (CM.Stage) {
    const base = CM.Stage.scene;
    CM.Stage.scene = theme => K.SCENES[theme] || base(theme);
    Object.keys(K.SCENES).forEach(k => { if (!CM.Stage.THEMES.includes(k)) CM.Stage.THEMES.push(k); });
  }

  /* A burst of confetti for a correct answer. Hidden under reduced motion. */
  K.confetti = () => `<div class="confetti" aria-hidden="true">${Array.from({ length: 26 }, (_, i) => `<i style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 60}ms;--c:${['#ff6b6b', '#ffd43b', '#4dabf7', '#69db7c', '#b197fc', '#ff922b'][i % 6]};--r:${(i * 47) % 360}deg"></i>`).join('')}</div>`;

  /* Stained-glass rosette (shared with the parent dashboard): petals fill as missions are mastered. */
  K.rosette = function (done, total) {
    const n = Math.max(total, 1), petals = Array.from({ length: n }, (_, i) => {
      const a = (i / n) * 360;
      return `<path d="M0 -8 Q-10 -26 0 -44 Q10 -26 0 -8Z" transform="rotate(${a})" fill="${i < done ? ['#ffd43b', '#ff6b6b', '#4dabf7', '#69db7c', '#b197fc', '#ff922b'][i % 6] : 'rgba(255,255,255,.25)'}" stroke="#fff" stroke-width="1.5"/>`;
    }).join('');
    return `<svg class="rosette" viewBox="-50 -50 100 100" role="img" aria-label="${done} of ${total} missions mastered"><circle r="48" fill="rgba(255,255,255,.18)" stroke="#fff" stroke-width="2"/>${petals}<circle r="8" fill="#fff"/></svg>`;
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
