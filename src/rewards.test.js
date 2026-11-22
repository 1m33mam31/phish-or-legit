import { describe, it, expect } from "vitest";
import { mulberry32 } from "./logic.js";
import {
  RARITIES,
  RARITY_ORDER,
  PITY_LIMIT,
  ITEMS,
  ITEMS_BY_ID,
  DROPS,
  emptyRewards,
  normalizeRewards,
  ownedCount,
  casesForRound,
  addCases,
  canClaimFreeCase,
  claimFreeCase,
  oddsTable,
  pickRarity,
  rollCase,
  buildReel,
  scrapFor,
  craftCost,
  canCraft,
  craftItem,
  equipItem,
  auraFor,
} from "./rewards.js";
import { buddyOps, moodForScore } from "./Buddy.jsx";

describe("items", () => {
  it("has 47 droppable items with unique ids", () => {
    expect(DROPS).toHaveLength(47);
    expect(new Set(ITEMS.map((i) => i.id)).size).toBe(ITEMS.length);
  });

  it("has items in every rarity", () => {
    for (const r of RARITY_ORDER) {
      expect(DROPS.filter((i) => i.rarity === r).length).toBeGreaterThan(0);
    }
  });

  it("gives every item a name, a valid rarity and a slot", () => {
    for (const item of ITEMS) {
      expect(item.name.length).toBeGreaterThan(2);
      expect(RARITIES[item.rarity]).toBeTruthy();
      expect(["hat", "face", "back", "stamp", "theme", "title"]).toContain(item.slot);
    }
  });

  it("draws every mascot item with at least one shape", () => {
    for (const item of ITEMS.filter((i) => ["hat", "face", "back"].includes(i.slot))) {
      expect(item.ops.length).toBeGreaterThan(0);
    }
  });

  it("gives every card theme a full palette", () => {
    for (const item of ITEMS.filter((i) => i.slot === "theme")) {
      for (const key of ["bg0", "bg1", "glow1", "glow2", "glow3", "ring0", "ring1"]) {
        expect(item.palette[key]).toBeTruthy();
      }
    }
  });
});

describe("drop rates", () => {
  it("add up to 100 percent and are shown in order", () => {
    const table = oddsTable();
    expect(table.map((t) => t.rarity)).toEqual(RARITY_ORDER);
    expect(table.reduce((sum, t) => sum + t.percent, 0)).toBeCloseTo(100, 5);
    expect(table[0].percent).toBe(60);
    expect(table[3].percent).toBe(3);
  });

  it("pickRarity follows the weights at the edges", () => {
    expect(pickRarity(0)).toBe("common");
    expect(pickRarity(0.599)).toBe("common");
    expect(pickRarity(0.6)).toBe("rare");
    expect(pickRarity(0.879)).toBe("rare");
    expect(pickRarity(0.88)).toBe("epic");
    expect(pickRarity(0.969)).toBe("epic");
    expect(pickRarity(0.97)).toBe("legendary");
    expect(pickRarity(0.9999)).toBe("legendary");
  });

  it("matches the advertised odds over many rolls", () => {
    const rand = mulberry32(12345);
    const counts = { common: 0, rare: 0, epic: 0, legendary: 0 };
    const N = 40000;
    for (let i = 0; i < N; i++) counts[pickRarity(rand())]++;
    expect(counts.common / N).toBeCloseTo(0.6, 1);
    expect(counts.rare / N).toBeCloseTo(0.28, 1);
    expect(counts.epic / N).toBeCloseTo(0.09, 1);
    expect(counts.legendary / N).toBeCloseTo(0.03, 1);
  });
});

describe("opening a case", () => {
  it("spends a case, adds the item and counts the opening", () => {
    const start = { ...emptyRewards(), cases: 3 };
    const res = rollCase(start, () => 0);
    expect(res.item.rarity).toBe("common");
    expect(res.duplicate).toBe(false);
    expect(res.rewards.cases).toBe(2);
    expect(res.rewards.opened).toBe(1);
    expect(res.rewards.owned[res.item.id]).toBe(true);
    expect(ownedCount(res.rewards)).toBe(1);
  });

  it("does not open anything with no cases", () => {
    expect(rollCase({ ...emptyRewards(), cases: 0 })).toBeNull();
  });

  it("turns a duplicate into scrap and keeps one copy", () => {
    let state = { ...emptyRewards(), cases: 5 };
    const first = rollCase(state, () => 0);
    state = first.rewards;
    const second = rollCase(state, () => 0);
    expect(second.duplicate).toBe(true);
    expect(second.scrapGained).toBe(scrapFor("common"));
    expect(second.rewards.scrap).toBe(scrapFor("common"));
    expect(ownedCount(second.rewards)).toBe(1);
  });

  it("guarantees an Epic or better on the 10th case without one", () => {
    let state = { ...emptyRewards(), cases: 30 };
    const rarities = [];
    // rand() of 0 would always give Common, so any Epic here comes from pity
    for (let i = 0; i < PITY_LIMIT; i++) {
      const res = rollCase(state, () => 0);
      rarities.push(res.rarity);
      state = res.rewards;
    }
    expect(rarities.slice(0, PITY_LIMIT - 1).every((r) => r === "common")).toBe(true);
    expect(["epic", "legendary"]).toContain(rarities[PITY_LIMIT - 1]);
    expect(state.pity).toBe(0);
  });

  it("resets the counter when an Epic comes up naturally", () => {
    const start = { ...emptyRewards(), cases: 5, pity: 4 };
    const res = rollCase(start, () => 0.9); // 0.9 is in the Epic range
    expect(res.rarity).toBe("epic");
    expect(res.rewards.pity).toBe(0);
  });

  it("never lets a bad roll pick a missing item", () => {
    const rand = mulberry32(99);
    let state = { ...emptyRewards(), cases: 500 };
    for (let i = 0; i < 500; i++) {
      const res = rollCase(state, rand);
      expect(ITEMS_BY_ID[res.item.id]).toBeTruthy();
      state = res.rewards;
    }
    expect(ownedCount(state)).toBeLessThanOrEqual(DROPS.length);
  });
});

describe("the spinning strip", () => {
  it("puts the winning item where the strip stops", () => {
    const winner = DROPS[3];
    const { items, winIndex } = buildReel(winner, mulberry32(7));
    expect(items).toHaveLength(44);
    expect(items[winIndex]).toBe(winner);
    expect(items.every((i) => ITEMS_BY_ID[i.id])).toBe(true);
  });
});

describe("earning cases", () => {
  it("gives 1 per round, 3 for Timed Mode, and 1 extra for a perfect score", () => {
    expect(casesForRound({ mode: "classic", score: 6, total: 10 })).toBe(1);
    expect(casesForRound({ mode: "classic", score: 10, total: 10 })).toBe(2);
    expect(casesForRound({ mode: "timed", score: 30, total: 50 })).toBe(3);
    expect(casesForRound({ mode: "timed", score: 50, total: 50 })).toBe(4);
    expect(casesForRound({ mode: "hunt", score: 5, total: 5 })).toBe(2);
  });

  it("adds cases", () => {
    expect(addCases(emptyRewards(), 2).cases).toBe(3);
  });

  it("gives one free case per day", () => {
    const start = emptyRewards();
    expect(canClaimFreeCase(start, "2026-11-12")).toBe(true);
    const once = claimFreeCase(start, "2026-11-12");
    expect(once.cases).toBe(start.cases + 1);
    expect(claimFreeCase(once, "2026-11-12")).toBe(once);
    expect(claimFreeCase(once, "2026-11-13").cases).toBe(start.cases + 2);
  });
});

describe("crafting and equipping", () => {
  const hat = ITEMS_BY_ID["hat-cap"];
  const crown = ITEMS_BY_ID["hat-crown"];

  it("charges scrap to craft a missing item", () => {
    const poor = { ...emptyRewards(), scrap: craftCost(hat) - 1 };
    expect(canCraft(poor, hat)).toBe(false);
    expect(craftItem(poor, hat.id)).toBe(poor);

    const rich = { ...emptyRewards(), scrap: craftCost(hat) + 5 };
    const crafted = craftItem(rich, hat.id);
    expect(crafted.owned[hat.id]).toBe(true);
    expect(crafted.scrap).toBe(5);
    expect(canCraft(crafted, hat)).toBe(false);
  });

  it("can only equip what you own, one per slot, and can take it off", () => {
    const start = emptyRewards();
    expect(equipItem(start, hat.id)).toBe(start);

    const owned = { ...start, owned: { [hat.id]: true, [crown.id]: true } };
    const wearingCap = equipItem(owned, hat.id);
    expect(wearingCap.equipped.hat).toBe(hat.id);
    expect(equipItem(wearingCap, crown.id).equipped.hat).toBe(crown.id);
    expect(equipItem(wearingCap, hat.id).equipped.hat).toBeNull();
  });

  it("always keeps a stamp and a theme equipped", () => {
    const owned = { ...emptyRewards(), owned: { "stamp-neon": true } };
    const neon = equipItem(owned, "stamp-neon");
    expect(neon.equipped.stamp).toBe("stamp-neon");
    expect(equipItem(neon, "stamp-neon").equipped.stamp).toBe("stamp-neon");
    expect(equipItem(neon, "stamp-classic").equipped.stamp).toBe("stamp-classic");
  });
});

describe("saved state", () => {
  it("starts with one case and the default look", () => {
    const fresh = emptyRewards();
    expect(fresh.cases).toBe(1);
    expect(fresh.equipped.stamp).toBe("stamp-classic");
    expect(fresh.equipped.theme).toBe("theme-default");
  });

  it("survives missing, broken and tampered values", () => {
    expect(normalizeRewards(null)).toEqual(emptyRewards());
    expect(normalizeRewards("junk")).toEqual(emptyRewards());

    const messy = normalizeRewards({
      cases: -5,
      scrap: "lots",
      owned: { "hat-cap": true, "not-a-real-item": true },
      equipped: { hat: "hat-crown", stamp: "hat-cap", theme: "theme-gold" },
      pity: 99,
      opened: 2.7,
      freeCase: 42,
    });
    expect(messy.cases).toBe(0);
    expect(messy.scrap).toBe(0);
    expect(messy.owned).toEqual({ "hat-cap": true });
    expect(messy.equipped.hat).toBeNull(); // crown is not owned
    expect(messy.equipped.stamp).toBe("stamp-classic"); // wrong slot
    expect(messy.equipped.theme).toBe("theme-default"); // not owned
    expect(messy.pity).toBe(PITY_LIMIT - 1);
    expect(messy.opened).toBe(2);
    expect(messy.freeCase).toBe("");
  });

  it("keeps a real saved state as it was", () => {
    const saved = {
      ...emptyRewards(),
      cases: 4,
      scrap: 12,
      owned: { "hat-crown": true },
      equipped: { ...emptyRewards().equipped, hat: "hat-crown" },
    };
    expect(normalizeRewards(saved)).toEqual(saved);
  });
});

describe("mascot", () => {
  it("draws different faces for different moods", () => {
    const happy = JSON.stringify(buddyOps("happy"));
    expect(JSON.stringify(buddyOps("cheer"))).not.toBe(happy);
    expect(JSON.stringify(buddyOps("wince"))).not.toBe(happy);
  });

  it("adds shapes for the items it wears", () => {
    const bare = buddyOps("happy").length;
    const dressed = buddyOps("happy", { hat: "hat-crown", face: "face-shades", back: "back-cape" }).length;
    expect(dressed).toBeGreaterThan(bare);
  });

  it("picks a mood from the score", () => {
    expect(moodForScore(9, 10)).toBe("cheer");
    expect(moodForScore(5, 10)).toBe("happy");
    expect(moodForScore(1, 10)).toBe("wince");
  });
});

describe("legendary aura", () => {
  it("only comes from legendary hats, glasses and back items", () => {
    expect(auraFor({})).toBeNull();
    expect(auraFor({ hat: "hat-cap", face: "face-shades", back: "back-wings" })).toBeNull();
    expect(auraFor({ hat: "hat-halo" })).toBe("legendary");
    expect(auraFor({ face: "face-sparkle" })).toBe("legendary");
    // legendary stamps, themes and titles do not change the mascot
    expect(auraFor({ stamp: "stamp-holo", theme: "theme-aurora", title: "title-legend" })).toBeNull();
  });
});

describe("the full item list", () => {
  it("has the right number of items in each type", () => {
    const count = (slot) => DROPS.filter((i) => i.slot === slot).length;
    expect(count("hat")).toBe(10);
    expect(count("face")).toBe(7);
    expect(count("back")).toBe(6);
    expect(count("stamp")).toBe(7);
    expect(count("theme")).toBe(8);
    expect(count("title")).toBe(9);
  });

  it("has the right number of items in each rarity", () => {
    const count = (r) => DROPS.filter((i) => i.rarity === r).length;
    expect(count("common")).toBe(14);
    expect(count("rare")).toBe(12);
    expect(count("epic")).toBe(11);
    expect(count("legendary")).toBe(10);
  });

  it("gives an aura for every legendary mascot item", () => {
    for (const id of ["hat-halo", "hat-flame", "face-sparkle", "face-laser", "back-dragon"]) {
      const slot = ITEMS_BY_ID[id].slot;
      expect(auraFor({ [slot]: id })).toBe("legendary");
    }
  });
});
