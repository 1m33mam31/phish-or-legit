import { memo, useEffect, useRef, useState } from "react";
import Buddy, { Aura } from "./Buddy.jsx";
import {
  RARITIES,
  RARITY_ORDER,
  SLOTS,
  ITEMS,
  DROPS,
  PITY_LIMIT,
  ITEMS_BY_ID,
  rollCase,
  buildReel,
  equipItem,
  craftItem,
  craftCost,
  canCraft,
  isOwned,
  ownedCount,
  oddsTable,
  canClaimFreeCase,
} from "./rewards.js";
import { motionReduced, systemPrefersReducedMotion, getFx, setFx } from "./motion.js";
import "./rewards.css";

function Back() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}

// A small picture of one item, whatever kind it is.
// Legendary items get an aura (mascot items get theirs from the mascot itself).
export function ItemPreview({ item, size = 64 }) {
  if (["hat", "face", "back"].includes(item.slot)) {
    return <Buddy mood="happy" equipped={{ [item.slot]: item.id }} size={size} />;
  }
  let picture;
  if (item.slot === "stamp") {
    picture = <span className={`stamp-sample ${item.id}`}>Phish</span>;
  } else if (item.slot === "theme") {
    const p = item.palette;
    picture = (
      <span
        className="theme-swatch"
        style={{
          background: `radial-gradient(circle at 25% 20%, ${p.glow1}, transparent 60%), radial-gradient(circle at 80% 80%, ${p.glow3}, transparent 60%), linear-gradient(135deg, ${p.bg0}, ${p.bg1})`,
          borderColor: p.ring1,
        }}
      >
        <span style={{ background: `linear-gradient(90deg, ${p.ring0}, ${p.ring1})` }} />
      </span>
    );
  } else {
    picture = <span className="title-sample">{item.text}</span>;
  }
  return item.rarity === "legendary" ? <Aura size={size}>{picture}</Aura> : picture;
}

function CaseArt({ className = "" }) {
  return (
    <svg className={`case-art ${className}`} viewBox="0 0 160 140" width="160" height="140" aria-hidden="true">
      <defs>
        <linearGradient id="case-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6a8bff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <ellipse cx="80" cy="128" rx="58" ry="8" fill="rgba(0,0,0,0.4)" />
      <rect x="22" y="48" width="116" height="74" rx="14" fill="url(#case-body)" stroke="#3b2fb0" strokeWidth="3" />
      <rect x="18" y="30" width="124" height="30" rx="12" fill="#7f6bff" stroke="#3b2fb0" strokeWidth="3" />
      <rect x="70" y="52" width="20" height="26" rx="5" fill="#ffd166" stroke="#c9891a" strokeWidth="2.5" />
      <circle cx="80" cy="63" r="3.2" fill="#c9891a" />
      <path d="M80 82 l14 5.4 v8 c0 9-6 14-14 17-8-3-14-8-14-17v-8z" fill="none" stroke="#fff" strokeWidth="3" strokeLinejoin="round" opacity="0.9" />
      <path d="M74 95 l4.5 4.5 8-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
    </svg>
  );
}

// ---------- strip on the menu ----------
export function RewardsStrip({ rewards, dayKey, onOpen, onCollection, onClaim }) {
  const free = canClaimFreeCase(rewards, dayKey);
  return (
    <section className="rewards-strip" aria-labelledby="rewards-title">
      <div className="rs-buddy">
        <Buddy mood="happy" equipped={rewards.equipped} size={92} label="Your mascot" />
      </div>
      <div className="rs-text">
        <h2 id="rewards-title">Rewards</h2>
        <p>
          <strong>{rewards.cases}</strong> {rewards.cases === 1 ? "case" : "cases"} to open.
          Earn more by finishing rounds.
        </p>
        <p className="rs-sub">
          {ownedCount(rewards)} of {DROPS.length} items collected
        </p>
      </div>
      <div className="rs-actions">
        {free && (
          <button className="cta" onClick={onClaim}>
            Claim free case
          </button>
        )}
        <button
          className={free ? "ghost" : "cta"}
          onClick={onOpen}
          disabled={rewards.cases < 1}
        >
          Open a case
        </button>
        <button className="ghost" onClick={onCollection}>
          Collection
        </button>
      </div>
    </section>
  );
}

// ---------- opening a case ----------
const CARD_W = 124;
const GAP = 10;
const STEP = CARD_W + GAP;

// How long the reel holds on the winner before the reveal (more tension for rarer items)
const HOLD = { common: 450, rare: 800, epic: 1200, legendary: 1700 };
const SPARKS = { common: 0, rare: 12, epic: 26, legendary: 46 };

function Odds() {
  return (
    <ul className="odds" aria-label="Drop rates">
      {oddsTable().map((o) => (
        <li key={o.rarity} style={{ "--rc": o.color }}>
          <span>{o.label}</span>
          <strong>{o.percent}%</strong>
        </li>
      ))}
    </ul>
  );
}

const ReelCard = memo(function ReelCard({ item, state }) {
  return (
    <div
      className={`reel-card ${item.rarity} ${state}`}
      style={{ "--rc": RARITIES[item.rarity].color }}
    >
      <ItemPreview item={item} size={72} />
      <span>{item.name}</span>
    </div>
  );
});

// Sparks that fly out from the middle when a prize is revealed
function Burst({ count, color }) {
  const pieces = Array.from({ length: count }, (_, i) => ({
    angle: (i / count) * 360 + (i % 3) * 9,
    dist: 110 + (i % 5) * 38,
    delay: (i % 7) * 0.035,
    size: 4 + (i % 3) * 3,
  }));
  return (
    <div className="burst" aria-hidden="true" style={{ "--bc": color }}>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            "--a": `${p.angle}deg`,
            "--d": `${p.dist}px`,
            "--dl": `${p.delay}s`,
            width: p.size,
            height: p.size,
          }}
        />
      ))}
    </div>
  );
}

// Shown only when the device asks for less motion (or when the player chose full animations).
function FxToggle() {
  const [fx, setFxState] = useState(getFx);
  const full = fx === "full";
  if (!full && !systemPrefersReducedMotion()) return null;
  return (
    <div className="fx-toggle">
      <p>
        {full
          ? "Full animations are on for this game."
          : "Your device has animations turned off, so cases open instantly."}
      </p>
      <button
        className="ghost small"
        onClick={() => {
          const next = full ? "auto" : "full";
          setFx(next);
          setFxState(next);
        }}
      >
        {full ? "Use my device setting" : "Play full animations"}
      </button>
    </div>
  );
}

export function CaseScreen({ rewards, onChange, onBack, onCollection }) {
  // ready, charging, spinning, landed, revealed
  const [phase, setPhase] = useState("ready");
  const [result, setResult] = useState(null);
  const [reel, setReel] = useState(null);
  const [go, setGo] = useState(false);
  const [target, setTarget] = useState(0);
  const [under, setUnder] = useState(-1);
  const [flash, setFlash] = useState(null);
  const viewport = useRef(null);
  const track = useRef(null);
  function openCase() {
    const res = rollCase(rewards);
    if (!res) return;
    onChange(res.rewards); // saved straight away, so closing the page can't lose the prize
    setResult(res);
    setGo(false);
    setUnder(-1);
    setPhase(motionReduced() ? "revealed" : "charging");
  }

  function skip() {
    if (result) setFlash({ color: RARITIES[result.rarity].color, n: Date.now() });
    setPhase("revealed");
  }

  // 1. the case shakes and glows, then bursts
  useEffect(() => {
    if (phase !== "charging" || !result) return;
    const t = setTimeout(() => {
      setReel({ ...buildReel(result.item), jitter: (Math.random() - 0.5) * 70 });
      setFlash({ color: "#ffffff", n: Date.now() });
      setPhase("spinning");
    }, 1800);
    return () => clearTimeout(t);
  }, [phase, result]);

  // 2. the strip spins and slows down
  useEffect(() => {
    if (phase !== "spinning" || !reel) return;
    const width = viewport.current ? viewport.current.offsetWidth : 600;
    const start = setTimeout(() => {
      setTarget(-(reel.winIndex * STEP + CARD_W / 2 - width / 2 + reel.jitter));
      setGo(true);
    }, 80);
    const end = setTimeout(() => {
      setUnder(reel.winIndex);
      setPhase("landed");
    }, 5400);

    // watch which card is under the marker, so the marker can change colour as cards pass
    let raf;
    let last = -1;
    const loop = () => {
      const el = track.current;
      if (el) {
        const m = /matrix\(([^)]+)\)/.exec(getComputedStyle(el).transform || "");
        const tx = m ? parseFloat(m[1].split(",")[4]) : 0;
        const idx = Math.floor((-tx + width / 2) / STEP);
        if (idx !== last) {
          last = idx;
          setUnder(idx);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      clearTimeout(start);
      clearTimeout(end);
      cancelAnimationFrame(raf);
    };
  }, [phase, reel]);

  // 3. a short pause on the winner, longer for rarer prizes
  useEffect(() => {
    if (phase !== "landed" || !result) return;
    const t = setTimeout(() => {
      setFlash({ color: RARITIES[result.rarity].color, n: Date.now() });
      setPhase("revealed");
    }, HOLD[result.rarity]);
    return () => clearTimeout(t);
  }, [phase, result]);

  const pityLeft = PITY_LIMIT - rewards.pity;
  const rarity = result ? result.rarity : "common";
  const color = RARITIES[rarity].color;
  const strong = rarity === "epic" || rarity === "legendary";
  const underItem = reel && under >= 0 ? reel.items[under] : null;
  const underColor = underItem ? RARITIES[underItem.rarity].color : "#ffffff";
  const shaking = phase === "revealed" && strong ? `shake-${rarity}` : "";

  return (
    <main className={`screen narrow cases ${shaking}`}>
      {flash && (
        <div
          key={flash.n}
          className={`flash-burst ${rarity === "legendary" ? "big" : ""}`}
          style={{ "--fc": flash.color }}
          aria-hidden="true"
        />
      )}

      <header className="topbar">
        <button className="link" onClick={onBack}>
          <Back />
          Back
        </button>
        <span className="modechip">
          {rewards.cases} {rewards.cases === 1 ? "case" : "cases"}
        </span>
      </header>

      <h1 className="cases-title">Phish Case</h1>

      {phase === "ready" && (
        <div className="case-ready">
          <CaseArt />
          <p className="case-note">
            Prizes are cosmetic only. They never change your score.
          </p>
          <button className="cta" onClick={openCase} disabled={rewards.cases < 1}>
            {rewards.cases > 0 ? "Open case" : "No cases left"}
          </button>
          {rewards.cases < 1 && (
            <p className="case-note">Finish a round or claim your free daily case to earn more.</p>
          )}
          <FxToggle />
          <p className="pity">
            {pityLeft === 1
              ? "Your next case is guaranteed to be Epic or better."
              : `An Epic or better is guaranteed within ${pityLeft} cases.`}
          </p>
          <h2 className="odds-title">Drop rates</h2>
          <Odds />
        </div>
      )}

      {phase === "charging" && (
        <div className="case-charge">
          <div className="charge-stage">
            <div className="charge-rays" aria-hidden="true" />
            <CaseArt className="charging" />
          </div>
          <p className="case-note" role="status">Cracking it open...</p>
          <div className="charge-bar" aria-hidden="true">
            <span />
          </div>
          <button className="ghost" onClick={skip}>
            Skip
          </button>
        </div>
      )}

      {(phase === "spinning" || phase === "landed") && reel && (
        <div className="case-spin">
          <div
            className={`reel ${phase}`}
            ref={viewport}
            aria-hidden="true"
            style={{ "--uc": underColor }}
          >
            <div className="reel-marker" />
            <div
              className="reel-track"
              ref={track}
              style={{
                transform: `translateX(${go ? target : 0}px)`,
                transition: go ? "transform 5.2s cubic-bezier(0.08, 0.72, 0.1, 1)" : "none",
              }}
            >
              {reel.items.map((it, i) => (
                <ReelCard
                  key={i}
                  item={it}
                  state={
                    phase === "landed" && i === reel.winIndex
                      ? "won"
                      : i === under
                        ? "under"
                        : ""
                  }
                />
              ))}
            </div>
          </div>
          <p className="reel-now" aria-hidden="true" style={{ color: underColor }}>
            {underItem ? underItem.name : "\u00a0"}
          </p>
          <p className="case-note" role="status">
            {phase === "landed" ? "Here it comes..." : "Opening your case..."}
          </p>
          <button className="ghost" onClick={skip}>
            Skip
          </button>
        </div>
      )}

      {phase === "revealed" && result && (
        <div className={`reveal r-${rarity}`} style={{ "--rc": color }}>
          <div className="reveal-glow" aria-hidden="true" />
          {strong && <div className="rays" aria-hidden="true" />}
          {SPARKS[rarity] > 0 && <Burst count={SPARKS[rarity]} color={color} />}
          {strong && (
            <p className="reveal-banner">{RARITIES[rarity].label.toUpperCase()}!</p>
          )}
          <p className="reveal-rarity">{RARITIES[rarity].label}</p>
          <div className="reveal-item">
            <ItemPreview item={result.item} size={150} />
          </div>
          <h2 className="reveal-name">{result.item.name}</h2>
          <p className="reveal-note" role="status">
            {result.duplicate
              ? `Duplicate. You got ${result.scrapGained} scrap instead.`
              : "New item added to your collection."}
          </p>
          {result.guaranteed && (
            <p className="reveal-note">Guaranteed drop from your pity counter.</p>
          )}
          <div className="reveal-actions">
            {!result.duplicate && rewards.equipped[result.item.slot] !== result.item.id && (
              <button className="cta" onClick={() => onChange(equipItem(rewards, result.item.id))}>
                Equip now
              </button>
            )}
            <button
              className={result.duplicate ? "cta" : "ghost"}
              onClick={() => setPhase("ready")}
              disabled={rewards.cases < 1}
            >
              {rewards.cases > 0 ? `Open another (${rewards.cases} left)` : "No cases left"}
            </button>
            <button className="ghost" onClick={onCollection}>
              Collection
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

// ---------- collection ----------
const TABS = ["all", ...Object.keys(SLOTS)];

export function CollectionScreen({ rewards, onChange, onBack, onOpen }) {
  const [tab, setTab] = useState("all");
  const list = ITEMS.filter((i) => tab === "all" || i.slot === tab);
  const title = ITEMS_BY_ID[rewards.equipped.title];

  return (
    <main className="screen narrow collection">
      <header className="topbar">
        <button className="link" onClick={onBack}>
          <Back />
          Back
        </button>
        <span className="modechip">
          {rewards.scrap} scrap
        </span>
      </header>

      <div className="col-hero">
        <Buddy mood="cheer" equipped={rewards.equipped} size={150} label="Your mascot" />
        <div>
          <h1 className="cases-title">Collection</h1>
          <p className="rs-sub">
            {ownedCount(rewards)} of {DROPS.length} items collected
          </p>
          {title && <p className="col-title">{title.text}</p>}
          <button className="ghost small" onClick={onOpen}>
            Open a case ({rewards.cases})
          </button>
        </div>
      </div>

      <p className="case-note left">
        Duplicates turn into scrap. Spend scrap to craft any item you are missing.
      </p>

      <div className="tabs" role="tablist" aria-label="Item types">
        {TABS.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tab ${tab === t ? "on" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "all" ? "All" : SLOTS[t]}
          </button>
        ))}
      </div>

      <ul className="items">
        {list.map((item) => {
          const owned = isOwned(rewards, item);
          const equipped = rewards.equipped[item.slot] === item.id;
          const removable = ["hat", "face", "back", "title"].includes(item.slot);
          return (
            <li
              key={item.id}
              className={`item ${owned ? "owned" : "locked"} ${item.rarity}`}
              style={{ "--rc": RARITIES[item.rarity].color }}
            >
              <div className="item-preview">
                <ItemPreview item={item} size={72} />
              </div>
              <strong className="item-name">{item.name}</strong>
              <span className="item-rarity">{item.builtin ? "Default" : RARITIES[item.rarity].label}</span>
              {owned ? (
                <button
                  className="ghost small"
                  onClick={() => onChange(equipItem(rewards, item.id))}
                  disabled={equipped && !removable}
                >
                  {equipped ? (removable ? "Remove" : "Equipped") : "Equip"}
                </button>
              ) : (
                <button
                  className="ghost small"
                  onClick={() => onChange(craftItem(rewards, item.id))}
                  disabled={!canCraft(rewards, item)}
                >
                  Craft ({craftCost(item)} scrap)
                </button>
              )}
              {!owned && <span className="item-lock">Locked</span>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}

