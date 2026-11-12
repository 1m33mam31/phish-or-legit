import base from "./data/scenarios.json";
import more from "./data/scenarios-more.json";

// All the game rules live in this file so they can be tested on their own.

export const scenarios = [...base, ...more];

export const TIME_LIMIT = 15;

export const MODES = {
  daily: {
    label: "Daily Challenge",
    desc: "5 questions, same for everyone today. One try.",
    size: 5,
    time: "~1 min",
  },
  classic: {
    label: "Classic",
    desc: "10 random scenarios. Play as often as you like.",
    size: 10,
    time: "~3 min",
  },
  timed: {
    label: "Timed Mode",
    desc: `${TIME_LIMIT} seconds per question across all 50 messages. Finish them all to win.`,
    size: 50,
    time: "~10 min",
  },
  hunt: {
    label: "Red Flag Hunt",
    desc: "Spot the real warning sign in 5 scams.",
    size: 5,
    time: "~1 min",
  },
};

export const DAILY_START = "2026-11-01";

// ---------- "What to do next" tips ----------
export const TIP_SETS = {
  link: [
    "Don't click links or reply. Delete the message.",
    "Check your account by opening the official app or typing the real website yourself.",
    "Report it to Scamwatch.",
  ],
  uni: [
    "Don't enter your login.",
    "Report it to your university IT or security team.",
    "If you already entered your password, change it now.",
  ],
  callback: [
    "Don't call the number in the message.",
    "Check your account in the official app or by typing the real website yourself.",
    "Report it to Scamwatch.",
  ],
  friend: [
    "Don't click the link or log in anywhere.",
    "Contact your friend another way so they can secure their account.",
    "Report the account to the platform and to Scamwatch.",
  ],
  support: [
    "Don't click the link or enter your login.",
    "Check your account settings inside the app itself.",
    "Report the account to the platform and to Scamwatch.",
  ],
  invest: [
    "Don't send money or move to a private chat.",
    "Block the account and report it to the platform.",
    "Report it to Scamwatch.",
  ],
  family: [
    "Don't send money.",
    "Call your family member on the number you already have.",
    "Block the new number and report it to Scamwatch.",
  ],
  stranger: [
    "Don't reply, even to be polite.",
    "Block the number.",
    "Report it to Scamwatch.",
  ],
  code: [
    "Never share verification codes with anyone.",
    "Block the buyer and report them to the marketplace.",
    "If you shared a code, secure your account and change your password.",
  ],
  deposit: [
    "Don't pay before you can verify it is real.",
    "Use official agents or ticket resale sites instead.",
    "Report it to the platform and Scamwatch.",
  ],
  bankchange: [
    "Don't send money to a new account.",
    "Call your agent on a number you already have to check.",
    "Report it to Scamwatch.",
  ],
  jobfee: [
    "Don't send money, ID or bank details.",
    "Check the company or organisation independently.",
    "Report it to Scamwatch.",
  ],
  giftcard: [
    "Don't buy gift cards or send codes.",
    "Check with the person in person or through official university channels.",
    "Report it to uni IT and Scamwatch.",
  ],
};

export const TIP_IDS = {
  link: [1, 2, 3, 11, 12, 14, 23, 24, 27, 29, 34, 35, 42, 47, 49],
  uni: [5, 15],
  callback: [18],
  friend: [8, 26],
  support: [36],
  invest: [17],
  family: [20],
  stranger: [44],
  code: [21],
  deposit: [7, 38],
  bankchange: [40],
  jobfee: [10, 30, 43],
  giftcard: [32],
};

export function getTips(item) {
  const key =
    Object.keys(TIP_IDS).find((k) => TIP_IDS[k].includes(item.id)) || "link";
  const steps = [...TIP_SETS[key]];
  if (item.type === "sms") {
    steps.push("Forward scam texts to 0429 999 888 (ACMA) to help block them.");
  }
  return steps;
}

// ---------- helpers ----------
export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(list, rand = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function todayKey() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

export function untilTomorrow() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.ceil((next - now) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable, ignore
  }
}

// Replays every day since DAILY_START, so each day skips the previous day's 5
export function dailyIds(dateStr) {
  const last = dateStr < DAILY_START ? DAILY_START : dateStr;
  const d = new Date(DAILY_START + "T12:00:00");
  const end = new Date(last + "T12:00:00");
  let prev = new Set();
  let ids = [];
  while (d <= end) {
    const rand = mulberry32(hashString(d.toLocaleDateString("en-CA")));
    ids = shuffle(
      scenarios.filter((s) => !prev.has(s.id)),
      rand
    )
      .slice(0, MODES.daily.size)
      .map((s) => s.id);
    prev = new Set(ids);
    d.setDate(d.getDate() + 1);
  }
  return ids;
}

export function buildDeck(mode) {
  if (mode === "daily") {
    return dailyIds(todayKey()).map((id) => ({
      item: scenarios.find((s) => s.id === id),
    }));
  }
  if (mode === "hunt") {
    const phish = scenarios.filter((s) => s.answer === "phish");
    const decoyPool = [...new Set(scenarios.flatMap((s) => s.safeSigns || []))];
    return shuffle(phish)
      .slice(0, MODES.hunt.size)
      .map((item) => {
        const correct =
          item.redFlags[Math.floor(Math.random() * item.redFlags.length)];
        const decoys = shuffle(decoyPool.filter((d) => d !== correct)).slice(
          0,
          3
        );
        return { item, correct, options: shuffle([correct, ...decoys]) };
      });
  }
  // classic and timed
  return shuffle(scenarios)
    .slice(0, MODES[mode].size)
    .map((item) => ({ item }));
}

export function parseSender(from) {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  return match
    ? { name: match[1], address: match[2] }
    : { name: from, address: null };
}

export function getRank(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return { title: "Cyber Legend", emoji: "🛡️" };
  if (pct >= 0.7) return { title: "Phish Hunter", emoji: "🎣" };
  if (pct >= 0.4) return { title: "Scam Spotter", emoji: "🔍" };
  return { title: "Easy Catch", emoji: "🐟" };
}


// ---------- badges ----------
// Each badge has a test that runs after a round finishes.
// "stats" are the running totals, "round" is the round that just ended.
export const BADGES = [
  {
    id: "first",
    name: "First catch",
    hint: "Finish your first round",
    earned: (stats) => stats.rounds >= 1,
  },
  {
    id: "perfect",
    name: "Flawless",
    hint: "Get every message right in a round",
    earned: (stats, round) => round.score === round.total,
  },
  {
    id: "daily-perfect",
    name: "Daily champion",
    hint: "Score 5 out of 5 in the Daily Challenge",
    earned: (stats, round) =>
      round.mode === "daily" && round.score === round.total,
  },
  {
    id: "streak5",
    name: "On fire",
    hint: "Get 5 right in a row",
    earned: (stats, round) => round.mode !== "hunt" && round.bestStreak >= 5,
  },
  {
    id: "clock",
    name: "Beat the clock",
    hint: "Score 80% or more in Timed Mode",
    earned: (stats, round) =>
      round.mode === "timed" && round.score >= Math.ceil(round.total * 0.8),
  },
  {
    id: "hunt",
    name: "Flag finder",
    hint: "Find every red flag in Red Flag Hunt",
    earned: (stats, round) =>
      round.mode === "hunt" && round.score === round.total,
  },
  {
    id: "regular",
    name: "Regular",
    hint: "Play the Daily Challenge on 3 different days",
    earned: (stats) => stats.dailyDays.length >= 3,
  },
  {
    id: "sharp",
    name: "Sharp eye",
    hint: "Get 50 answers right in total",
    earned: (stats) => stats.correct >= 50,
  },
];

export function emptyStats() {
  return { rounds: 0, correct: 0, answered: 0, dailyDays: [] };
}

// Adds one finished round to the running totals.
export function updateStats(stats, round) {
  const days = stats.dailyDays || [];
  const dailyDays =
    round.mode === "daily" && !days.includes(round.date)
      ? [...days, round.date].slice(-60)
      : days;
  return {
    rounds: (stats.rounds || 0) + 1,
    correct: (stats.correct || 0) + round.score,
    answered: (stats.answered || 0) + round.total,
    dailyDays,
  };
}

// Returns the ids of badges that were just earned (not already in `earned`).
export function evaluateBadges(stats, round, earned) {
  return BADGES.filter((b) => !earned[b.id] && b.earned(stats, round)).map(
    (b) => b.id
  );
}
