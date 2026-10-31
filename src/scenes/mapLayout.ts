/**
 * mapLayout — hand-authored tombstone positions in art pixels (world space).
 * World size: 2400 × 1800 art px.
 * The 5 resurrectable graves (sort_priority 1–5) are placed in a semicircle
 * around the central plaza near the wizard spawn (1200, 900).
 * The 35 decorative graves fill outer rows.
 */

export interface TombstoneLayout {
  id: string;
  x: number;
  y: number;
}

// ─── Resurrectable arc (around plaza centre ~1200, 850) ───────────────────
const RESURRECTABLES: TombstoneLayout[] = [
  { id: 'road-rash',      x: 1040, y: 760 },
  { id: 'google-reader',  x: 1150, y: 720 },
  { id: 'clippy',         x: 1280, y: 710 },
  { id: 'winamp',         x: 1400, y: 720 },
  { id: 'unmarked-grave', x: 1500, y: 760 },
];

// ─── Decorative rows (sort_priority 6–40) ────────────────────────────────
// Arranged in tidy rows with light jitter. IDs must match graves.json order.
const DECORATIVES: TombstoneLayout[] = [
  // Row 1 — upper-left cluster
  { id: 'orkut',            x: 380,  y: 380 },
  { id: 'msn-messenger',    x: 480,  y: 370 },
  { id: 'internet-explorer',x: 580,  y: 390 },
  { id: 'adobe-flash',      x: 680,  y: 375 },
  { id: 'vine',             x: 780,  y: 385 },
  { id: 'google-plus',      x: 880,  y: 370 },
  { id: 'yahoo-messenger',  x: 980,  y: 380 },
  { id: 'myspace-classic',  x: 1080, y: 375 },

  // Row 2 — upper-right cluster
  { id: 'friendster',       x: 1400, y: 390 },
  { id: 'google-stadia',    x: 1500, y: 375 },
  { id: 'picasa',           x: 1600, y: 385 },
  { id: 'ipod-classic',     x: 1700, y: 370 },
  { id: 'aim',              x: 1800, y: 390 },
  { id: 'icq',              x: 1900, y: 375 },
  { id: 'skype',            x: 2000, y: 385 },
  { id: 'geocities',        x: 2100, y: 370 },

  // Row 3 — mid left
  { id: 'napster',          x: 360,  y: 680 },
  { id: 'limewire',         x: 460,  y: 695 },
  { id: 'flappy-bird',      x: 560,  y: 680 },
  { id: 'club-penguin',     x: 660,  y: 695 },
  { id: 'farmville',        x: 760,  y: 680 },

  // Row 3 — mid right
  { id: 'bbm',              x: 1700, y: 690 },
  { id: 'hike',             x: 1800, y: 680 },
  { id: 'windows-phone',    x: 1900, y: 695 },
  { id: 'zune',             x: 2000, y: 680 },
  { id: 'google-wave',      x: 2100, y: 695 },

  // Row 4 — lower left
  { id: 'google-glass',     x: 380,  y: 1080 },
  { id: 'netscape-navigator',x: 480, y: 1065 },
  { id: 'altavista',        x: 580,  y: 1080 },
  { id: 'encarta',          x: 680,  y: 1065 },
  { id: 'windows-movie-maker',x: 780, y: 1080},

  // Row 4 — lower right
  { id: 'kinect',           x: 1700, y: 1080 },
  { id: 'google-hangouts',  x: 1800, y: 1065 },
  { id: 'igoogle',          x: 1900, y: 1080 },
  { id: 'pebble',           x: 2000, y: 1065 },
];

export const MAP_LAYOUT: TombstoneLayout[] = [
  ...RESURRECTABLES,
  ...DECORATIVES,
];

/** Path rectangles for footstep surface detection (art-px coords) */
export interface PathRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PATH_RECTS: PathRect[] = [
  // Central plaza (160×120 around spawn at 1200, 900)
  { x: 1120, y: 840, width: 160, height: 120 },
  // Central horizontal path extending from plaza
  { x: 200,  y: 870, width: 920,  height: 48 },  // left of plaza
  { x: 1280, y: 870, width: 920,  height: 48 },  // right of plaza
  // Central vertical path extending from plaza
  { x: 1176, y: 200, width: 48,   height: 640 },  // above plaza
  { x: 1176, y: 960, width: 48,   height: 640 },  // below plaza
  // Ring path (approximated as 4 segments)
  { x: 800,  y: 620, width: 400,  height: 48 },  // top-left of ring
  { x: 1200, y: 620, width: 400,  height: 48 },  // top-right of ring
  { x: 800,  y: 1080, width: 400, height: 48 },  // bottom-left of ring
  { x: 1200, y: 1080, width: 400, height: 48 },  // bottom-right of ring
  { x: 800,  y: 620, width: 48,   height: 460 },  // left of ring
  { x: 1552, y: 620, width: 48,   height: 460 },  // right of ring
];

/** Wizard spawn position in art pixels */
export const WIZARD_SPAWN = { x: 1200, y: 900 };
