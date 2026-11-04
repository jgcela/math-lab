/* Full-screen mission stage: themed scenery and the guide character.
 * All art is original, drawn in code as flat SVG shapes. */
(function (CM) {
  'use strict';
  const S = CM.Stage = {};

  /* Scenery sits behind the board. viewBox 1000 x 600, anchored to the bottom so it fills any screen. */
  const SCENES = {
    snow: `<svg class="st-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <rect width="1000" height="600" fill="url(#sky-snow)"/>
      <defs><linearGradient id="sky-snow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd8ef"/><stop offset="1" stop-color="#d9f1fa"/></linearGradient></defs>
      <g fill="#ffffff" opacity=".7">${[[80, 60], [220, 140], [400, 50], [560, 120], [720, 70], [880, 150], [140, 260], [640, 230], [940, 40], [320, 220]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${4 + (x % 4)}"/>`).join('')}</g>
      <path d="M0 420 L140 250 L230 340 L360 190 L500 380 L620 230 L760 360 L880 240 L1000 330 L1000 600 L0 600Z" fill="#c4e6f4"/>
      <path d="M360 190 L405 245 L380 240 L360 262 L338 238 L315 246Z M620 230 L660 280 L640 276 L620 296 L600 274 L582 280Z M880 240 L915 282 L896 280 L880 296 L864 280 L846 284Z" fill="#ffffff"/>
      <path d="M0 470 Q250 400 520 470 T1000 450 L1000 600 L0 600Z" fill="#eaf7fc"/>
      <g fill="#2f7f86">${[[70, 470, 1], [120, 486, .8], [880, 452, 1.1], [940, 470, .8]].map(([x, y, k]) => `<path transform="translate(${x} ${y}) scale(${k})" d="M0 -90 L30 -40 L16 -40 L40 0 L-40 0 L-16 -40 L-30 -40Z"/><rect transform="translate(${x} ${y}) scale(${k})" x="-6" y="0" width="12" height="16" fill="#6b4a33"/>`).join('')}</g>
      <path d="M0 520 Q300 480 600 525 T1000 510 L1000 600 L0 600Z" fill="#ffffff"/>
    </svg>`,
    meadow: `<svg class="st-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky-meadow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe3cf"/><stop offset="1" stop-color="#fff4ea"/></linearGradient></defs>
      <rect width="1000" height="600" fill="url(#sky-meadow)"/>
      <circle cx="840" cy="120" r="60" fill="#ffc861"/>
      <g fill="#ffffff" opacity=".85"><ellipse cx="200" cy="110" rx="70" ry="22"/><ellipse cx="240" cy="95" rx="40" ry="20"/><ellipse cx="560" cy="70" rx="60" ry="18"/></g>
      <path d="M0 430 Q200 340 430 420 T1000 380 L1000 600 L0 600Z" fill="#9fd48c"/>
      <path d="M0 500 Q300 440 620 500 T1000 480 L1000 600 L0 600Z" fill="#7cc06d"/>
      <g transform="translate(110 455)"><rect x="-9" y="-80" width="18" height="90" fill="#7a5234"/><circle cx="0" cy="-110" r="62" fill="#4f9e4c"/><circle cx="-38" cy="-80" r="38" fill="#4f9e4c"/><circle cx="40" cy="-82" r="36" fill="#4f9e4c"/>
        <g fill="#e1552c"><circle cx="-24" cy="-118" r="8"/><circle cx="22" cy="-130" r="8"/><circle cx="34" cy="-88" r="8"/><circle cx="-44" cy="-80" r="8"/><circle cx="2" cy="-90" r="8"/></g></g>
      <g fill="#ffffff">${[[300, 520], [700, 540], [860, 515]].map(([x, y]) => `<g transform="translate(${x} ${y})"><circle r="5" cx="-6"/><circle r="5" cx="6"/><circle r="5" cy="-6"/><circle r="5" cy="6"/><circle r="4" fill="#ffc861"/></g>`).join('')}</g>
    </svg>`,
    space: `<svg class="st-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky-space" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2470"/><stop offset="1" stop-color="#3a3f9e"/></linearGradient></defs>
      <rect width="1000" height="600" fill="url(#sky-space)"/>
      <g fill="#ffffff">${Array.from({ length: 46 }, (_, i) => `<circle cx="${(i * 211) % 1000}" cy="${(i * 97) % 520}" r="${1 + (i % 3) * .8}" opacity="${.5 + (i % 4) * .15}"/>`).join('')}</g>
      <circle cx="860" cy="120" r="70" fill="#f2b25c"/><ellipse cx="860" cy="120" rx="118" ry="22" fill="none" stroke="#ffd79a" stroke-width="8" transform="rotate(-18 860 120)"/>
      <circle cx="140" cy="160" r="26" fill="#8fd3ff"/><circle cx="132" cy="152" r="6" fill="#6bb9ea"/>
      <path d="M0 540 Q250 470 520 530 T1000 520 L1000 600 L0 600Z" fill="#4c4fb0"/>
      <g fill="#3c3f9a"><circle cx="220" cy="560" r="16"/><circle cx="700" cy="565" r="22"/><circle cx="880" cy="555" r="12"/></g>
    </svg>`,
    sea: `<svg class="st-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bfeaf0"/><stop offset=".55" stop-color="#e8f8f6"/><stop offset=".56" stop-color="#4fb3c2"/><stop offset="1" stop-color="#2a8ea3"/></linearGradient></defs>
      <rect width="1000" height="600" fill="url(#sky-sea)"/>
      <circle cx="150" cy="110" r="50" fill="#ffd36b"/>
      <g fill="#ffffff" opacity=".9"><ellipse cx="700" cy="90" rx="70" ry="20"/><ellipse cx="740" cy="76" rx="40" ry="18"/></g>
      <g transform="translate(820 300)"><path d="M-70 30 L70 30 L50 56 L-50 56Z" fill="#c4473a"/><rect x="-3" y="-80" width="6" height="110" fill="#6b4a33"/><path d="M4 -76 L60 20 L4 20Z" fill="#ffffff"/><path d="M-4 -60 L-46 20 L-4 20Z" fill="#ffe6a8"/></g>
      <g fill="none" stroke="#ffffff" stroke-width="4" opacity=".6" stroke-linecap="round">${[[80, 380], [320, 430], [560, 400], [260, 520], [640, 500], [880, 450]].map(([x, y]) => `<path d="M${x} ${y} q15 -10 30 0 t30 0"/>`).join('')}</g>
      <path d="M0 560 Q200 530 420 565 T1000 550 L1000 600 L0 600Z" fill="#f3dca6"/>
    </svg>`,
    sunset: `<svg class="st-scene" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs><linearGradient id="sky-sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffcfa8"/><stop offset=".6" stop-color="#ffe9c7"/><stop offset="1" stop-color="#fff3df"/></linearGradient></defs>
      <rect width="1000" height="600" fill="url(#sky-sunset)"/>
      <circle cx="500" cy="420" r="120" fill="#ffb36b" opacity=".8"/>
      <path d="M0 440 L120 380 L220 420 L330 360 L460 430 L600 370 L720 420 L860 360 L1000 410 L1000 600 L0 600Z" fill="#e7a07d"/>
      <path d="M0 500 Q260 450 520 500 T1000 490 L1000 600 L0 600Z" fill="#c9806a"/>
      <g transform="translate(860 470)" fill="#9b5f50"><rect x="-30" y="-60" width="60" height="60"/><path d="M-38 -60 L0 -96 L38 -60Z"/><rect x="-4" y="-130" width="8" height="40"/><rect x="-14" y="-118" width="28" height="7"/><rect x="-8" y="-30" width="16" height="30" fill="#7a4639"/></g>
      <path d="M0 550 Q300 520 640 555 T1000 545 L1000 600 L0 600Z" fill="#a8665a"/>
    </svg>`
  };
  S.THEMES = Object.keys(SCENES);
  S.scene = theme => SCENES[theme] || SCENES.meadow;

  /* The guide: a round owl. mood: calm | think | happy. */
  S.mascot = function (mood) {
    const eye = (cx) => mood === 'happy'
      ? `<path d="M${cx - 13} 70 Q${cx} 56 ${cx + 13} 70" fill="none" stroke="#1a2735" stroke-width="5" stroke-linecap="round"/>`
      : `<circle cx="${cx}" cy="68" r="17" fill="#ffffff"/><g class="pupil"><circle cx="${cx + (mood === 'think' ? 5 : 0)}" cy="${68 - (mood === 'think' ? 6 : 0)}" r="8" fill="#1a2735"/><circle cx="${cx + (mood === 'think' ? 7 : 3)}" cy="${65 - (mood === 'think' ? 6 : 0)}" r="2.5" fill="#ffffff"/></g>`;
    return `<svg class="mascot mood-${mood}" viewBox="0 0 160 170" aria-hidden="true">
      <path d="M40 30 L52 8 L66 34Z M120 30 L108 8 L94 34Z" fill="#8a5a3c"/>
      <ellipse cx="80" cy="96" rx="62" ry="70" fill="#8a5a3c"/>
      <ellipse cx="80" cy="118" rx="38" ry="44" fill="#f2d6b3"/>
      <g fill="#c99a76" opacity=".8"><path d="M66 112 q6 6 12 0 M84 112 q6 6 12 0 M70 128 q6 6 12 0 M88 128 q6 6 12 0 M74 144 q6 6 12 0"/></g>
      <path class="wing" d="M20 92 Q4 130 34 150 Q30 118 38 98Z" fill="#6f4630"/>
      <path class="wing r" d="M140 92 Q156 130 126 150 Q130 118 122 98Z" fill="#6f4630"/>
      <circle cx="56" cy="68" r="24" fill="#f2d6b3"/><circle cx="104" cy="68" r="24" fill="#f2d6b3"/>
      ${eye(56)}${eye(104)}
      <path d="M72 84 L88 84 L80 98Z" fill="#ee9d2c"/>
      <g fill="#ee9d2c"><path d="M58 162 l-6 8 h12z M70 164 l-4 6 h10z M92 164 l-4 6 h10z M104 162 l-6 8 h12z"/></g>
    </svg>`;
  };
})(typeof window !== 'undefined' ? window.CM : global.CM);
