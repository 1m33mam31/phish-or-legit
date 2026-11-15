import { describe, it, expect } from "vitest";
import {
  scenarios,
  MODES,
  DAILY_START,
  TIP_SETS,
  dailyIds,
  buildDeck,
  getRank,
  getTips,
  hashString,
  mulberry32,
  shuffle,
  parseSender,
  BADGES,
  emptyStats,
  updateStats,
  evaluateBadges,
} from "./logic.js";

// A list of dates starting at DAILY_START, as YYYY-MM-DD strings
function dateList(count) {
  const [y, m, d] = DAILY_START.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    new Date(Date.UTC(y, m - 1, d + i)).toISOString().slice(0, 10)
  );
}

describe("scenario data", () => {
  it("has 50 scenarios with unique ids", () => {
    expect(scenarios).toHaveLength(50);
    expect(new Set(scenarios.map((s) => s.id)).size).toBe(50);
  });

  it("has the fields the game needs on every scenario", () => {
    for (const s of scenarios) {
      expect(["email", "sms", "dm", "message"]).toContain(s.type);
      expect(["phish", "legit"]).toContain(s.answer);
      expect(s.from).toBeTruthy();
      expect(s.body).toBeTruthy();
      expect(s.explanation).toBeTruthy();
      if (s.answer === "phish") expect(s.redFlags.length).toBeGreaterThan(0);
      if (s.answer === "legit") expect(s.safeSigns.length).toBeGreaterThan(0);
    }
  });

  it("only uses fake links on reserved .example domains", () => {
    for (const s of scenarios.filter((x) => x.link)) {
      expect(s.link).toMatch(/^http:\/\/[a-z0-9.-]+\.example(\/|$)/);
    }
  });

  it("has a good mix of phish and legit", () => {
    const phish = scenarios.filter((s) => s.answer === "phish").length;
    expect(phish).toBeGreaterThan(20);
    expect(scenarios.length - phish).toBeGreaterThan(10);
  });
});

describe("random helpers", () => {
  it("shuffle keeps every item", () => {
    const list = [1, 2, 3, 4, 5, 6];
    expect([...shuffle(list)].sort()).toEqual(list);
  });

  it("the same seed gives the same shuffle", () => {
    const list = Array.from({ length: 20 }, (_, i) => i);
    const a = shuffle(list, mulberry32(hashString("2026-11-05")));
    const b = shuffle(list, mulberry32(hashString("2026-11-05")));
    const c = shuffle(list, mulberry32(hashString("2026-11-06")));
    expect(a).toEqual(b);
    expect(a).not.toEqual(c);
  });
});

describe("daily challenge", () => {
  it("gives 5 different, valid scenarios", () => {
    const ids = dailyIds("2026-11-10");
    expect(ids).toHaveLength(MODES.daily.size);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(scenarios.some((s) => s.id === id)).toBe(true);
    }
  });

  it("is the same for everyone on the same day", () => {
    expect(dailyIds("2026-11-10")).toEqual(dailyIds("2026-11-10"));
  });

  it("never repeats a scenario two days in a row", () => {
    const days = dateList(90);
    for (let i = 1; i < days.length; i++) {
      const yesterday = new Set(dailyIds(days[i - 1]));
      const today = dailyIds(days[i]);
      expect(today.filter((id) => yesterday.has(id))).toEqual([]);
    }
  });
});

describe("decks", () => {
  it("has the right number of questions for each mode", () => {
    for (const mode of Object.keys(MODES)) {
      expect(buildDeck(mode)).toHaveLength(MODES[mode].size);
    }
  });

  it("Timed Mode uses all 50 scenarios exactly once", () => {
    const deck = buildDeck("timed");
    expect(deck).toHaveLength(50);
    expect(new Set(deck.map((e) => e.item.id)).size).toBe(50);
  });

  it("Red Flag Hunt only uses scams, with 4 different options", () => {
    for (let i = 0; i < 20; i++) {
      for (const entry of buildDeck("hunt")) {
        expect(entry.item.answer).toBe("phish");
        expect(entry.options).toHaveLength(4);
        expect(new Set(entry.options).size).toBe(4);
        expect(entry.options).toContain(entry.correct);
        expect(entry.item.redFlags).toContain(entry.correct);
      }
    }
  });
});

describe("rank", () => {
  it("matches the score", () => {
    expect(getRank(10, 10).title).toBe("Cyber Legend");
    expect(getRank(7, 10).title).toBe("Phish Hunter");
    expect(getRank(4, 10).title).toBe("Scam Spotter");
    expect(getRank(1, 10).title).toBe("Easy Catch");
  });
});

describe("what to do next tips", () => {
  it("every scam has at least 3 steps", () => {
    for (const s of scenarios.filter((x) => x.answer === "phish")) {
      expect(getTips(s).length).toBeGreaterThanOrEqual(3);
    }
  });

  it("only text messages get the forwarding step", () => {
    const sms = scenarios.find((s) => s.answer === "phish" && s.type === "sms");
    const email = scenarios.find(
      (s) => s.answer === "phish" && s.type === "email"
    );
    expect(getTips(sms).join(" ")).toMatch(/Forward/);
    expect(getTips(email).join(" ")).not.toMatch(/Forward/);
  });

  it("uses a known tip set for every scenario id it lists", () => {
    expect(Object.keys(TIP_SETS).length).toBeGreaterThan(5);
  });
});

describe("sender parsing", () => {
  it("splits a name and an address", () => {
    expect(parseSender("PayPal <a@b.example>")).toEqual({
      name: "PayPal",
      address: "a@b.example",
    });
    expect(parseSender("AusPost")).toEqual({ name: "AusPost", address: null });
  });
});

describe("badges", () => {
  const round = (over) => ({
    mode: "classic",
    score: 5,
    total: 10,
    bestStreak: 2,
    date: "2026-11-10",
    ...over,
  });

  it("awards First catch after any round", () => {
    const r = round();
    const stats = updateStats(emptyStats(), r);
    expect(evaluateBadges(stats, r, {})).toContain("first");
  });

  it("awards Flawless and Daily champion for a perfect Daily", () => {
    const r = round({ mode: "daily", score: 5, total: 5, bestStreak: 5 });
    const ids = evaluateBadges(updateStats(emptyStats(), r), r, {});
    expect(ids).toEqual(
      expect.arrayContaining(["perfect", "daily-perfect", "streak5"])
    );
  });

  it("does not count Red Flag Hunt towards the streak badge", () => {
    const r = round({ mode: "hunt", score: 5, total: 5, bestStreak: 5 });
    const ids = evaluateBadges(updateStats(emptyStats(), r), r, {});
    expect(ids).toContain("hunt");
    expect(ids).not.toContain("streak5");
  });

  it("awards Beat the clock for 80% or more in Timed Mode", () => {
    const good = round({ mode: "timed", score: 40, total: 50 });
    const bad = round({ mode: "timed", score: 39, total: 50 });
    expect(evaluateBadges(updateStats(emptyStats(), good), good, {})).toContain(
      "clock"
    );
    expect(
      evaluateBadges(updateStats(emptyStats(), bad), bad, {})
    ).not.toContain("clock");
  });

  it("awards Regular after the Daily on 3 different days", () => {
    let stats = emptyStats();
    for (const date of ["2026-11-01", "2026-11-03", "2026-11-03", "2026-11-07"]) {
      stats = updateStats(
        stats,
        round({ mode: "daily", score: 3, total: 5, date })
      );
    }
    expect(stats.dailyDays).toHaveLength(3);
    expect(
      evaluateBadges(stats, round({ mode: "daily" }), {})
    ).toContain("regular");
  });

  it("awards Sharp eye at 50 correct answers in total", () => {
    const stats = { rounds: 6, correct: 50, answered: 60, dailyDays: [] };
    expect(evaluateBadges(stats, round(), {})).toContain("sharp");
  });

  it("never awards a badge twice", () => {
    const r = round({ score: 10, total: 10 });
    const stats = updateStats(emptyStats(), r);
    const first = evaluateBadges(stats, r, {});
    const earned = Object.fromEntries(first.map((id) => [id, "2026-11-10"]));
    expect(evaluateBadges(stats, r, earned)).toEqual([]);
  });

  it("has unique ids and a hint for every badge", () => {
    expect(new Set(BADGES.map((b) => b.id)).size).toBe(BADGES.length);
    for (const b of BADGES) expect(b.hint.length).toBeGreaterThan(5);
  });
});
