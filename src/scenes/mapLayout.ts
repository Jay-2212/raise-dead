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
  { id: 'space-cadet',    x: 1040, y: 760 },
  { id: 'google-reader',  x: 1150, y: 720 },
  { id: 'clippy',         x: 1280, y: 710 },
  { id: '3d-pipes',       x: 1400, y: 720 },
  { id: 'unmarked-grave', x: 1500, y: 760 },
  // N3: south arc — Muse-written tributes
  { id: 'road-rash',      x: 1110, y: 1045 },
  { id: 'winamp',         x: 1360, y: 1040 },
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
  // ── Central plaza (160×120 around spawn at 1200, 900) ──────────────────
  { x: 1120, y: 840,  width: 160, height: 120 },

  // ── Central horizontal spine ───────────────────────────────────────────
  { x: 200,  y: 870,  width: 920, height: 48 },   // left of plaza
  { x: 1280, y: 870,  width: 920, height: 48 },   // right of plaza

  // ── Central vertical spine ─────────────────────────────────────────────
  { x: 1176, y: 150,  width: 48,  height: 690 },  // above plaza (extended)
  { x: 1176, y: 960,  width: 48,  height: 690 },  // below plaza (extended)

  // ── Inner ring (around resurrectable arc) ──────────────────────────────
  { x: 800,  y: 620,  width: 400, height: 48 },   // top-left arc
  { x: 1200, y: 620,  width: 400, height: 48 },   // top-right arc
  { x: 800,  y: 1080, width: 400, height: 48 },   // bottom-left arc
  { x: 1200, y: 1080, width: 400, height: 48 },   // bottom-right arc
  { x: 800,  y: 620,  width: 48,  height: 460 },  // left arc side
  { x: 1552, y: 620,  width: 48,  height: 460 },  // right arc side

  // ── Outer horizontal perimeter — Row 1 & 2 (y ≈ 350–410) ──────────────
  // Runs the full world width so all 16 upper graves are on-path
  { x: 200,  y: 350,  width: 2000, height: 60 },

  // ── Outer horizontal perimeter — Row 3 mid (y ≈ 655–720) ──────────────
  // Left wing: napster→farmville cluster (x 340–810)
  { x: 320,  y: 655,  width: 520,  height: 60 },
  // Right wing: bbm→google-wave cluster (x 1670–2150)
  { x: 1670, y: 655,  width: 510,  height: 60 },

  // ── Outer horizontal perimeter — Row 4 lower (y ≈ 1040–1105) ──────────
  // Left wing: google-glass→windows-movie-maker cluster (x 340–820)
  { x: 320,  y: 1040, width: 520,  height: 60 },
  // Right wing: kinect→pebble cluster (x 1670–2050)
  { x: 1670, y: 1040, width: 430,  height: 60 },

  // ── Outer vertical connectors — left side (x ≈ 344) ───────────────────
  // Connects Row 1 (y≈380) → Row 3 (y≈680) → Row 4 (y≈1070) via left edge
  { x: 320,  y: 350,  width: 56,   height: 370 }, // y 350→720
  { x: 320,  y: 720,  width: 56,   height: 380 }, // y 720→1100

  // ── Outer vertical connectors — right side (x ≈ 2110) ─────────────────
  { x: 2080, y: 350,  width: 56,   height: 370 }, // y 350→720
  { x: 2080, y: 720,  width: 56,   height: 380 }, // y 720→1100

  // ── Left-spine connectors (ties left outer ring to central spine) ──────
  // From Row 1 left down to central horizontal (y≈870) via x≈344 column
  // Already covered by vertical connectors above + central horizontal.
  // Extra spur: Row-1 left cluster → inner ring left side
  { x: 320,  y: 350,  width: 532,  height: 48 },  // Row 1 left → left-arc entry (x=852)
  { x: 320,  y: 1040, width: 532,  height: 48 },  // Row 4 left → left-arc entry (x=852)

  // ── Right-spine connectors ─────────────────────────────────────────────
  { x: 1548, y: 350,  width: 588,  height: 48 },  // Row 1 right → right-arc entry (x=1548)
  { x: 1548, y: 1040, width: 588,  height: 48 },  // Row 4 right → right-arc entry (x=1548)

  // ── South path extension (below plaza, reaching bottom decoratives) ────
  // The south-spine already reaches y=1650; add a lower terrace path
  { x: 800,  y: 1580, width: 800,  height: 60 },  // lower terrace

  // ── Mid-left / mid-right cross-spurs (Row 3 wings → central) ──────────
  // Horizontal spur from left row-3 cluster (x≈760) to left-arc (x≈800)
  { x: 760,  y: 655,  width: 88,   height: 60 },
  // Horizontal spur from right row-3 cluster (x≈1670) to right-arc (x≈1600)
  { x: 1550, y: 655,  width: 160,  height: 60 },

  // ── A2: Path strips (32 px tall horizontal bands) ──────────────────────
  // Row 1 strip at y≈440
  { x: 340,  y: 424,  width: 780,  height: 32 },   // left wing
  { x: 1380, y: 424,  width: 760,  height: 32 },   // right wing
  // Row 2 strip at y≈740
  { x: 340,  y: 724,  width: 780,  height: 32 },   // left wing
  { x: 1380, y: 724,  width: 760,  height: 32 },   // right wing
  // Row 3 strip at y≈1135
  { x: 340,  y: 1119, width: 780,  height: 32 },   // left wing
  { x: 1380, y: 1119, width: 760,  height: 32 },   // right wing

  // ── A2: Moonlit-clearing link ─────────────────────────────────────────
  // Horizontal path to clearing at y≈1680 (x 1000→1176)
  { x: 1000, y: 1664, width: 176,  height: 32 },
  // Vertical path up from clearing (x≈1176, y 1600→1700)
  { x: 1160, y: 1600, width: 32,   height: 100 },
];

/** Wizard spawn position in art pixels */
export const WIZARD_SPAWN = { x: 1200, y: 900 };
