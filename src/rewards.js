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
];

// ---------- stamps, card themes, titles ----------
const STAMPS = [
  { id: "stamp-classic", name: "Classic stamp", rarity: "common", builtin: true },
  { id: "stamp-ink", name: "Ink stamp", rarity: "common" },
  { id: "stamp-neon", name: "Neon stamp", rarity: "rare" },
  { id: "stamp-gold", name: "Gold stamp", rarity: "epic" },
  { id: "stamp-holo", name: "Holo stamp", rarity: "legendary" },
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
];

const TITLES = [
  { id: "title-defender", name: "Inbox Defender", text: "Inbox Defender", rarity: "common" },
  { id: "title-whisperer", name: "Link Whisperer", text: "Link Whisperer", rarity: "rare" },
  { id: "title-slayer", name: "Scam Slayer", text: "Scam Slayer", rarity: "epic" },
  { id: "title-legend", name: "Legend of the Inbox", text: "Legend of the Inbox", rarity: "legendary" },
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
