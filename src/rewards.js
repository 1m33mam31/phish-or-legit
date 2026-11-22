// Rewards: cosmetic items, case odds, and the rules for earning, opening and crafting.
// Everything in here is plain code with no screens, so it can be tested on its own.
// Cosmetics never change the score. They only change how things look.

export const RARITIES = {
  common: { label: "Common", weight: 60, color: "#9aa7bd", craft: 20 },
  rare: { label: "Rare", weight: 28, color: "#5b9dff", craft: 60 },
  epic: { label: "Epic", weight: 9, color: "#b865ff", craft: 160 },
  legendary: { label: "Legendary", weight: 3, color: "#ffb84d", craft: 400 },
};
export const RARITY_ORDER = ["common", "rare", "epic", "legendary"];

// An epic or better is guaranteed on every 10th case without one.
export const PITY_LIMIT = 10;

export const SLOTS = {
  hat: "Hats",
  face: "Glasses",
  back: "Back",
  stamp: "Stamps",
  theme: "Card themes",
  title: "Titles",
};

// A duplicate turns into scrap worth 40% of what the item costs to craft.
export function scrapFor(rarity) {
  return Math.round(RARITIES[rarity].craft * 0.4);
}
export function craftCost(item) {
  return RARITIES[item.rarity].craft;
}

// ---------- mascot cosmetics ----------
// Shapes are drawn in a 100 x 100 box (the mascot sits in -14..114 so hats and wings fit).
const star = (x, y, r) =>
  `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28} Z`;

const HATS = [
  {
    id: "hat-cap",
    name: "Red cap",
    rarity: "common",
    ops: [
      { t: "path", d: "M26 26 C28 6 72 6 74 26 Z", fill: "#ff5d4f", stroke: "#b8352b", w: 2.5 },
      { t: "path", d: "M60 24 Q84 22 90 30 Q72 31 58 28 Z", fill: "#d6402f", stroke: "#b8352b", w: 1.5 },
      { t: "circle", cx: 50, cy: 8, r: 2.6, fill: "#b8352b" },
    ],
  },
  {
    id: "hat-party",
    name: "Party hat",
    rarity: "common",
    ops: [
      { t: "path", d: "M50 -12 L70 24 L30 24 Z", fill: "#ffd166", stroke: "#d99a1b", w: 2 },
      { t: "path", d: "M42 8 L58 8 M37 16 L63 16", stroke: "#ff5d4f", w: 3 },
      { t: "circle", cx: 50, cy: -12, r: 5, fill: "#ff5d4f" },
    ],
  },
  {
    id: "hat-detective",
    name: "Detective hat",
    rarity: "rare",
    ops: [
      { t: "path", d: "M18 24 H82 Q82 29 76 29 H24 Q18 29 18 24 Z", fill: "#6b4f36", stroke: "#4a3523", w: 1.5 },
      { t: "path", d: "M28 24 C30 4 70 4 72 24 Z", fill: "#8b6b4a", stroke: "#5a4330", w: 2 },
      { t: "path", d: "M29 18 H71 V22 H29 Z", fill: "#3a2a1c" },
    ],
  },
  {
    id: "hat-crown",
    name: "Gold crown",
    rarity: "epic",
    ops: [
      { t: "path", d: "M26 26 L26 2 L38 14 L50 -4 L62 14 L74 2 L74 26 Z", fill: "#ffd166", stroke: "#d99a1b", w: 2.5 },
      { t: "circle", cx: 38, cy: 20, r: 2.6, fill: "#ff5d4f" },
      { t: "circle", cx: 50, cy: 19, r: 3.2, fill: "#5b9dff" },
      { t: "circle", cx: 62, cy: 20, r: 2.6, fill: "#3ddc97" },
    ],
  },
  {
    id: "hat-halo",
    name: "Angel halo",
    rarity: "legendary",
    ops: [
      { t: "ellipse", cx: 50, cy: -3, rx: 23, ry: 7, stroke: "rgba(255,224,138,0.35)", w: 10 },
      { t: "ellipse", cx: 50, cy: -3, rx: 22, ry: 6, stroke: "#ffe08a", w: 4 },
    ],
  },
  {
    id: "hat-beanie",
    name: "Blue beanie",
    rarity: "common",
    ops: [
      { t: "path", d: "M24 26 C24 4 76 4 76 26 Z", fill: "#3b82f6", stroke: "#1e4fb8", w: 2.5 },
      { t: "path", d: "M21 22 H79 Q82 22 82 25 V29 Q82 32 79 32 H21 Q18 32 18 29 V25 Q18 22 21 22 Z", fill: "#2f6fe0", stroke: "#1e4fb8", w: 2 },
      { t: "path", d: "M30 22 V32 M42 22 V32 M54 22 V32 M66 22 V32", stroke: "#1e4fb8", w: 1.5 },
      { t: "circle", cx: 50, cy: 2, r: 6.5, fill: "#e9eef8", stroke: "#b7c2d6", w: 1.5 },
    ],
  },
  {
    id: "hat-chef",
    name: "Chef hat",
    rarity: "common",
    ops: [
      { t: "circle", cx: 34, cy: 12, r: 12, fill: "#ffffff", stroke: "#cfd6e3", w: 2 },
      { t: "circle", cx: 66, cy: 12, r: 12, fill: "#ffffff", stroke: "#cfd6e3", w: 2 },
      { t: "circle", cx: 50, cy: 5, r: 14, fill: "#ffffff", stroke: "#cfd6e3", w: 2 },
      { t: "path", d: "M32 20 H68 V32 H32 Z", fill: "#ffffff", stroke: "#cfd6e3", w: 2 },
      { t: "path", d: "M32 28 H68", stroke: "#cfd6e3", w: 2 },
    ],
  },
  {
    id: "hat-wizard",
    name: "Wizard hat",
    rarity: "rare",
    ops: [
      { t: "path", d: "M50 -14 L72 24 L28 24 Z", fill: "#6d4bd8", stroke: "#432a9e", w: 2 },
      { t: "path", d: "M14 24 H86 Q86 31 78 31 H22 Q14 31 14 24 Z", fill: "#5638b8", stroke: "#432a9e", w: 2 },
      { t: "path", d: star(46, 6, 4.5), fill: "#ffd166" },
      { t: "path", d: star(57, 15, 3.5), fill: "#ffd166" },
      { t: "path", d: star(41, 17, 3), fill: "#ffe9a8" },
    ],
  },
  {
    id: "hat-tophat",
    name: "Top hat",
    rarity: "epic",
    ops: [
      { t: "path", d: "M18 24 H82 Q86 24 86 27 Q86 30 82 30 H18 Q14 30 14 27 Q14 24 18 24 Z", fill: "#14142b", stroke: "#000", w: 1.5 },
      { t: "path", d: "M30 25 V-6 Q30 -10 34 -10 H66 Q70 -10 70 -6 V25 Z", fill: "#1d1d3a", stroke: "#000", w: 1.5 },
      { t: "path", d: "M30 14 H70 V22 H30 Z", fill: "#c1273f" },
      { t: "path", d: "M36 -5 V9", stroke: "rgba(255,255,255,0.28)", w: 3 },
    ],
  },
  {
    id: "hat-flame",
    name: "Flame crown",
    rarity: "legendary",
    ops: [
      { t: "path", d: "M50 -12 C58 -2 64 6 60 24 H40 C36 6 42 -2 50 -12 Z", fill: "#ff7a2f", stroke: "#e0531a", w: 1.5 },
      { t: "path", d: "M31 24 C24 14 35 12 33 0 C42 7 45 16 41 24 Z", fill: "#ff7a2f", stroke: "#e0531a", w: 1.5 },
      { t: "path", d: "M69 24 C76 14 65 12 67 0 C58 7 55 16 59 24 Z", fill: "#ff7a2f", stroke: "#e0531a", w: 1.5 },
      { t: "path", d: "M50 2 C55 9 57 15 55 24 H45 C43 15 45 9 50 2 Z", fill: "#ffd166" },
      { t: "path", d: "M29 24 H71 V29 H29 Z", fill: "#b83a14", stroke: "#7e260c", w: 1.5 },
    ],
  },
];

const FACES = [
  {
    id: "face-round",
    name: "Round glasses",
    rarity: "common",
    ops: [
      { t: "circle", cx: 40, cy: 46, r: 10.5, fill: "rgba(255,255,255,0.16)", stroke: "#1b1450", w: 3 },
      { t: "circle", cx: 60, cy: 46, r: 10.5, fill: "rgba(255,255,255,0.16)", stroke: "#1b1450", w: 3 },
      { t: "path", d: "M48 45 Q50 43 52 45", stroke: "#1b1450", w: 3 },
    ],
  },
  {
    id: "face-shades",
    name: "Cool shades",
    rarity: "rare",
    ops: [
      { t: "path", d: "M28 39 H49 V50 Q49 55 44 55 H33 Q28 55 28 50 Z", fill: "#14142b", stroke: "#000", w: 1 },
      { t: "path", d: "M51 39 H72 V50 Q72 55 67 55 H56 Q51 55 51 50 Z", fill: "#14142b", stroke: "#000", w: 1 },
      { t: "path", d: "M49 42 H51", stroke: "#14142b", w: 3 },
      { t: "path", d: "M32 43 L39 43 M55 43 L62 43", stroke: "rgba(255,255,255,0.55)", w: 2 },
    ],
  },
  {
    id: "face-visor",
    name: "Cyber visor",
    rarity: "epic",
    ops: [
      { t: "path", d: "M24 38 H76 Q80 38 80 42 V52 Q80 56 76 56 H24 Q20 56 20 52 V42 Q20 38 24 38 Z", fill: "rgba(45,212,191,0.88)", stroke: "#0f766e", w: 2 },
      { t: "path", d: "M26 47 H74", stroke: "#e6fffb", w: 2, o: 0.85 },
    ],
  },
  {
    id: "face-sparkle",
    name: "Star eyes",
    rarity: "legendary",
    ops: [
      { t: "path", d: star(40, 46, 10.5), fill: "#ffd166", stroke: "#d99a1b", w: 1.5 },
      { t: "path", d: star(60, 46, 10.5), fill: "#ffd166", stroke: "#d99a1b", w: 1.5 },
    ],
  },
  {
    id: "face-3d",
    name: "3D glasses",
    rarity: "common",
    ops: [
      { t: "path", d: "M26 39 H48 V53 H26 Z", fill: "rgba(255,59,59,0.8)" },
      { t: "path", d: "M52 39 H74 V53 H52 Z", fill: "rgba(61,230,255,0.8)" },
      { t: "path", d: "M24 37 H76 V55 H24 Z M50 37 V55", stroke: "#f5f5f5", w: 3 },
      { t: "path", d: "M24 44 H15 M76 44 H85", stroke: "#f5f5f5", w: 3 },
    ],
  },
  {
    id: "face-heart",
    name: "Heart glasses",
    rarity: "rare",
    ops: [
      { t: "path", d: "M40 55 C27 47 29 35 36 35 C39 35 40 38 40 40 C40 38 41 35 44 35 C51 35 53 47 40 55 Z", fill: "#ff4d9d", stroke: "#b3195f", w: 2 },
      { t: "path", d: "M60 55 C47 47 49 35 56 35 C59 35 60 38 60 40 C60 38 61 35 64 35 C71 35 73 47 60 55 Z", fill: "#ff4d9d", stroke: "#b3195f", w: 2 },
      { t: "path", d: "M48 43 Q50 41 52 43", stroke: "#b3195f", w: 2.5 },
      { t: "circle", cx: 35, cy: 41, r: 2, fill: "#ffd1e6" },
      { t: "circle", cx: 55, cy: 41, r: 2, fill: "#ffd1e6" },
    ],
  },
  {
    id: "face-laser",
    name: "Laser eyes",
    rarity: "legendary",
    ops: [
      { t: "path", d: "M36 46 L-12 38 L-12 54 Z", fill: "rgba(255,60,60,0.85)" },
      { t: "path", d: "M64 46 L112 38 L112 54 Z", fill: "rgba(255,60,60,0.85)" },
      { t: "path", d: "M36 46 L-12 45 L-12 47 Z", fill: "#fff3c4" },
      { t: "path", d: "M64 46 L112 45 L112 47 Z", fill: "#fff3c4" },
      { t: "circle", cx: 40, cy: 46, r: 10, fill: "rgba(255,45,45,0.35)" },
      { t: "circle", cx: 60, cy: 46, r: 10, fill: "rgba(255,45,45,0.35)" },
      { t: "circle", cx: 40, cy: 46, r: 5.5, fill: "#ff2d2d", stroke: "#fff3c4", w: 1.5 },
      { t: "circle", cx: 60, cy: 46, r: 5.5, fill: "#ff2d2d", stroke: "#fff3c4", w: 1.5 },
    ],
  },
];

const BACKS = [
  {
    id: "back-scarf",
    name: "Red scarf",
    rarity: "common",
    ops: [
      { t: "path", d: "M66 82 L74 102 L62 99 L60 86 Z", fill: "#e04435", stroke: "#b8352b", w: 1.5 },
      { t: "path", d: "M20 70 Q50 86 80 70 L82 78 Q50 96 18 78 Z", fill: "#ff5d4f", stroke: "#b8352b", w: 2 },
    ],
  },
  {
    id: "back-cape",
    name: "Hero cape",
    rarity: "rare",
    layer: "behind",
    ops: [
      { t: "path", d: "M16 28 L0 100 Q50 86 100 100 L84 28 Z", fill: "#c1273f", stroke: "#7f1426", w: 2 },
      { t: "path", d: "M22 44 L13 90 Q50 80 87 90 L78 44 Z", fill: "#d83a52" },
    ],
  },
  {
    id: "back-wings",
    name: "Feather wings",
    rarity: "epic",
    layer: "behind",
    ops: [
      { t: "path", d: "M18 38 C-10 20 -16 58 6 78 C10 66 16 60 22 58 Z", fill: "#ffffff", stroke: "#c9c3f5", w: 2 },
      { t: "path", d: "M82 38 C110 20 116 58 94 78 C90 66 84 60 78 58 Z", fill: "#ffffff", stroke: "#c9c3f5", w: 2 },
      { t: "path", d: "M6 52 L18 52 M4 62 L16 60 M12 70 L20 64", stroke: "#c9c3f5", w: 1.5 },
      { t: "path", d: "M94 52 L82 52 M96 62 L84 60 M88 70 L80 64", stroke: "#c9c3f5", w: 1.5 },
    ],
  },
  {
    id: "back-bag",
    name: "School backpack",
    rarity: "common",
    layer: "behind",
    ops: [
      { t: "path", d: "M40 38 Q50 22 60 38", stroke: "#1b6a44", w: 4 },
      { t: "path", d: "M10 38 H90 Q97 38 97 45 V92 Q97 99 90 99 H10 Q3 99 3 92 V45 Q3 38 10 38 Z", fill: "#2f9e6b", stroke: "#1b6a44", w: 2.5 },
      { t: "path", d: "M22 76 H78 Q82 76 82 80 V92 Q82 96 78 96 H22 Q18 96 18 92 V80 Q18 76 22 76 Z", fill: "#247e55", stroke: "#1b6a44", w: 2 },
      { t: "circle", cx: 50, cy: 86, r: 3, fill: "#ffd166" },
    ],
  },
  {
    id: "back-jet",
    name: "Jetpack",
    rarity: "epic",
    layer: "behind",
    ops: [
      { t: "path", d: "M2 38 H22 V80 H2 Z", fill: "#aab3c5", stroke: "#5b667a", w: 2.5 },
      { t: "path", d: "M78 38 H98 V80 H78 Z", fill: "#aab3c5", stroke: "#5b667a", w: 2.5 },
      { t: "path", d: "M2 50 H22 M78 50 H98", stroke: "#e04435", w: 4 },
      { t: "path", d: "M4 82 Q12 112 20 82 Z", fill: "#ff9a3d" },
      { t: "path", d: "M80 82 Q88 112 96 82 Z", fill: "#ff9a3d" },
      { t: "path", d: "M8 82 Q12 100 16 82 Z", fill: "#ffe08a" },
      { t: "path", d: "M84 82 Q88 100 92 82 Z", fill: "#ffe08a" },
    ],
  },
  {
    id: "back-dragon",
    name: "Dragon wings",
    rarity: "legendary",
    layer: "behind",
    ops: [
      { t: "path", d: "M18 38 C-8 12 -12 54 4 86 C8 68 14 62 20 60 Z", fill: "#3a1230", stroke: "#170614", w: 2 },
      { t: "path", d: "M82 38 C108 12 112 54 96 86 C92 68 86 62 80 60 Z", fill: "#3a1230", stroke: "#170614", w: 2 },
      { t: "path", d: "M17 46 C2 30 -2 54 7 74 C10 64 14 58 19 56 Z", fill: "#c1273f" },
      { t: "path", d: "M83 46 C98 30 102 54 93 74 C90 64 86 58 81 56 Z", fill: "#c1273f" },
      { t: "path", d: "M4 86 L-6 98 L8 92 Z M96 86 L106 98 L92 92 Z", fill: "#170614" },
    ],
  },
];

// ---------- stamps, card themes, titles ----------
const STAMPS = [
  { id: "stamp-classic", name: "Classic stamp", rarity: "common", builtin: true },
  { id: "stamp-ink", name: "Ink stamp", rarity: "common" },
  { id: "stamp-neon", name: "Neon stamp", rarity: "rare" },
  { id: "stamp-gold", name: "Gold stamp", rarity: "epic" },
  { id: "stamp-holo", name: "Holo stamp", rarity: "legendary" },
  { id: "stamp-pixel", name: "Pixel stamp", rarity: "common" },
  { id: "stamp-glitch", name: "Glitch stamp", rarity: "rare" },
  { id: "stamp-fire", name: "Fire stamp", rarity: "epic" },
];

const THEMES = [
  {
    id: "theme-default",
    name: "Midnight card",
    rarity: "common",
    builtin: true,
    palette: { bg0: "#090d16", bg1: "#1a1243", glow1: "rgba(91,124,255,0.35)", glow2: "rgba(139,92,246,0.3)", glow3: "rgba(255,77,157,0.22)", ring0: "#3ddc97", ring1: "#5b7cff" },
  },
  {
    id: "theme-mint",
    name: "Mint card",
    rarity: "common",
    palette: { bg0: "#06130f", bg1: "#0c3b2c", glow1: "rgba(61,220,151,0.35)", glow2: "rgba(45,212,191,0.28)", glow3: "rgba(91,157,255,0.2)", ring0: "#7dffc3", ring1: "#2dd4bf" },
  },
  {
    id: "theme-sunset",
    name: "Sunset card",
    rarity: "rare",
    palette: { bg0: "#1a0a1f", bg1: "#4a1530", glow1: "rgba(255,184,77,0.35)", glow2: "rgba(255,77,157,0.3)", glow3: "rgba(139,92,246,0.25)", ring0: "#ffb84d", ring1: "#ff4d9d" },
  },
  {
    id: "theme-gold",
    name: "Gold card",
    rarity: "epic",
    palette: { bg0: "#120d03", bg1: "#3a2a05", glow1: "rgba(255,209,102,0.38)", glow2: "rgba(255,154,61,0.3)", glow3: "rgba(255,93,79,0.2)", ring0: "#ffe08a", ring1: "#ff9a3d" },
  },
  {
    id: "theme-aurora",
    name: "Aurora card",
    rarity: "legendary",
    palette: { bg0: "#04121a", bg1: "#14143f", glow1: "rgba(45,212,191,0.38)", glow2: "rgba(184,101,255,0.34)", glow3: "rgba(255,77,157,0.26)", ring0: "#2dd4bf", ring1: "#b865ff" },
  },
  {
    id: "theme-ocean",
    name: "Ocean card",
    rarity: "common",
    palette: { bg0: "#041320", bg1: "#073b5c", glow1: "rgba(45,212,191,0.35)", glow2: "rgba(56,189,248,0.3)", glow3: "rgba(30,64,175,0.3)", ring0: "#38bdf8", ring1: "#2dd4bf" },
  },
  {
    id: "theme-neon",
    name: "Neon card",
    rarity: "rare",
    palette: { bg0: "#0a0414", bg1: "#200a3a", glow1: "rgba(255,45,170,0.4)", glow2: "rgba(45,212,255,0.35)", glow3: "rgba(139,92,246,0.3)", ring0: "#ff2daa", ring1: "#2dd4ff" },
  },
  {
    id: "theme-volcano",
    name: "Volcano card",
    rarity: "epic",
    palette: { bg0: "#120505", bg1: "#3d0f0a", glow1: "rgba(255,122,47,0.4)", glow2: "rgba(255,59,47,0.32)", glow3: "rgba(255,209,102,0.25)", ring0: "#ffb84d", ring1: "#ff3b2f" },
  },
  {
    id: "theme-galaxy",
    name: "Galaxy card",
    rarity: "legendary",
    palette: { bg0: "#05031a", bg1: "#1b0f4a", glow1: "rgba(139,92,246,0.45)", glow2: "rgba(236,72,153,0.35)", glow3: "rgba(56,189,248,0.3)", ring0: "#c4b5fd", ring1: "#f472b6", stars: true },
  },
];

const TITLES = [
  { id: "title-defender", name: "Inbox Defender", text: "Inbox Defender", rarity: "common" },
  { id: "title-whisperer", name: "Link Whisperer", text: "Link Whisperer", rarity: "rare" },
  { id: "title-slayer", name: "Scam Slayer", text: "Scam Slayer", rarity: "epic" },
  { id: "title-legend", name: "Legend of the Inbox", text: "Legend of the Inbox", rarity: "legendary" },
  { id: "title-clicker", name: "Careful Clicker", text: "Careful Clicker", rarity: "common" },
  { id: "title-radar", name: "Scam Radar", text: "Scam Radar", rarity: "rare" },
  { id: "title-detective", name: "Domain Detective", text: "Domain Detective", rarity: "rare" },
  { id: "title-master", name: "Red Flag Master", text: "Red Flag Master", rarity: "epic" },
  { id: "title-unphishable", name: "The Unphishable", text: "The Unphishable", rarity: "legendary" },
];

const tag = (list, slot) => list.map((i) => ({ ...i, slot }));

export const ITEMS = [
  ...tag(HATS, "hat"),
  ...tag(FACES, "face"),
  ...tag(BACKS, "back"),
  ...tag(STAMPS, "stamp"),
  ...tag(THEMES, "theme"),
  ...tag(TITLES, "title"),
];
export const ITEMS_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

// Items that can come out of a case (the built-in defaults are always owned)
export const DROPS = ITEMS.filter((i) => !i.builtin);

// ---------- saved state ----------
export function emptyRewards() {
  return {
    cases: 1, // one starter case so people can try it straight away
    scrap: 0,
    owned: {},
    equipped: {
      hat: null,
      face: null,
      back: null,
      stamp: "stamp-classic",
      theme: "theme-default",
      title: null,
    },
    pity: 0,
    opened: 0,
    freeCase: "",
  };
}

const whole = (n) => Math.max(0, Math.floor(Number(n) || 0));

// Cleans up whatever was saved in the browser so a bad value can't break the game.
export function normalizeRewards(raw) {
  const base = emptyRewards();
  if (!raw || typeof raw !== "object") return base;

  const owned = {};
  for (const id of Object.keys(raw.owned || {})) {
    if (ITEMS_BY_ID[id] && !ITEMS_BY_ID[id].builtin && raw.owned[id]) owned[id] = true;
  }
  const equipped = { ...base.equipped };
  for (const slot of Object.keys(equipped)) {
    const id = raw.equipped && raw.equipped[slot];
    const item = ITEMS_BY_ID[id];
    if (item && item.slot === slot && (item.builtin || owned[id])) equipped[slot] = id;
  }
  return {
    cases: raw.cases === undefined ? base.cases : whole(raw.cases),
    scrap: whole(raw.scrap),
    owned,
    equipped,
    pity: Math.min(PITY_LIMIT - 1, whole(raw.pity)),
    opened: whole(raw.opened),
    freeCase: typeof raw.freeCase === "string" ? raw.freeCase : "",
  };
}

export function ownedCount(rewards) {
  return DROPS.filter((i) => rewards.owned[i.id]).length;
}

export function isOwned(rewards, item) {
  return Boolean(item.builtin || rewards.owned[item.id]);
}

// ---------- earning cases ----------
// One case per round, three for the long Timed Mode run, plus one for a perfect score.
export function casesForRound({ mode, score, total }) {
  const base = mode === "timed" ? 3 : 1;
  return base + (score === total ? 1 : 0);
}

export function addCases(rewards, count) {
  return { ...rewards, cases: rewards.cases + count };
}

// One free case per day.
export function canClaimFreeCase(rewards, dayKey) {
  return rewards.freeCase !== dayKey;
}

export function claimFreeCase(rewards, dayKey) {
  if (!canClaimFreeCase(rewards, dayKey)) return rewards;
  return { ...rewards, cases: rewards.cases + 1, freeCase: dayKey };
}

// ---------- opening a case ----------
export function oddsTable() {
  const total = RARITY_ORDER.reduce((sum, r) => sum + RARITIES[r].weight, 0);
  return RARITY_ORDER.map((r) => ({
    rarity: r,
    label: RARITIES[r].label,
    percent: Math.round((RARITIES[r].weight / total) * 1000) / 10,
    color: RARITIES[r].color,
  }));
}

// roll is a number from 0 up to (not including) 1
export function pickRarity(roll) {
  const total = RARITY_ORDER.reduce((sum, r) => sum + RARITIES[r].weight, 0);
  let acc = 0;
  for (const r of RARITY_ORDER) {
    acc += RARITIES[r].weight;
    if (roll * total < acc) return r;
  }
  return "common";
}

export function randomItem(rarity, rand = Math.random) {
  const pool = DROPS.filter((i) => i.rarity === rarity);
  return pool[Math.floor(rand() * pool.length)];
}

// Spends one case. Returns null if there are none left.
// Otherwise returns { item, rarity, duplicate, scrapGained, guaranteed, rewards }.
export function rollCase(rewards, rand = Math.random) {
  if (rewards.cases < 1) return null;

  const guaranteed = rewards.pity >= PITY_LIMIT - 1;
  const rarity = guaranteed
    ? rand() < 0.75
      ? "epic"
      : "legendary"
    : pickRarity(rand());
  const item = randomItem(rarity, rand);
  const duplicate = Boolean(rewards.owned[item.id]);
  const scrapGained = duplicate ? scrapFor(rarity) : 0;
  const strong = rarity === "epic" || rarity === "legendary";

  return {
    item,
    rarity,
    duplicate,
    scrapGained,
    guaranteed,
    rewards: {
      ...rewards,
      cases: rewards.cases - 1,
      scrap: rewards.scrap + scrapGained,
      owned: duplicate ? rewards.owned : { ...rewards.owned, [item.id]: true },
      pity: strong ? 0 : rewards.pity + 1,
      opened: rewards.opened + 1,
    },
  };
}

// The spinning strip of items: random filler with the winner placed at winIndex.
export function buildReel(winner, rand = Math.random, length = 44, winIndex = 36) {
  const items = Array.from({ length }, (_, i) =>
    i === winIndex ? winner : randomItem(pickRarity(rand()), rand)
  );
  return { items, winIndex };
}

// ---------- crafting and equipping ----------
export function canCraft(rewards, item) {
  return !isOwned(rewards, item) && rewards.scrap >= craftCost(item);
}

export function craftItem(rewards, id) {
  const item = ITEMS_BY_ID[id];
  if (!item || !canCraft(rewards, item)) return rewards;
  return {
    ...rewards,
    scrap: rewards.scrap - craftCost(item),
    owned: { ...rewards.owned, [id]: true },
  };
}

// Hats, glasses, back items and titles can be taken off again; stamps and themes always have one.
export function equipItem(rewards, id) {
  const item = ITEMS_BY_ID[id];
  if (!item || !isOwned(rewards, item)) return rewards;
  const removable = ["hat", "face", "back", "title"].includes(item.slot);
  const already = rewards.equipped[item.slot] === id;
  return {
    ...rewards,
    equipped: {
      ...rewards.equipped,
      [item.slot]: already && removable ? null : id,
    },
  };
}

// A legendary hat, glasses or back item gives the mascot a gold aura.
export function auraFor(equipped = {}) {
  const worn = ["hat", "face", "back"].map((slot) => ITEMS_BY_ID[equipped[slot]]);
  return worn.some((item) => item && item.rarity === "legendary") ? "legendary" : null;
}
