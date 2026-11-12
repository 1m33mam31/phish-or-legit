import { useState, useEffect, useMemo } from "react";
import "@fontsource-variable/bricolage-grotesque";
import {
  scenarios,
  MODES,
  TIME_LIMIT,
  hashString,
  mulberry32,
  shuffle,
  todayKey,
  untilTomorrow,
  load,
  save,
  buildDeck,
  parseSender,
  getRank,
  getTips,
  BADGES,
  emptyStats,
  updateStats,
  evaluateBadges,
} from "./logic.js";
import "./App.css";

const AUTHOR = "Ralph"; // shown in the About section, change it if you like
const REPO_URL = "https://github.com/1m33mam31/phish-or-legit";

const CONFETTI_COLORS = [
  "#7aa2ff",
  "#3ddc97",
  "#ff5d4f",
  "#ffb84d",
  "#f472b6",
  "#a78bfa",
];

const TYPE_LABELS = {
  sms: "Text message",
  dm: "Instagram DM",
  message: "Marketplace message",
};

// ---------- icons and logo ----------
const LINE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

const ICONS = {
  daily: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...LINE}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  ),
  classic: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...LINE}>
      <rect x="3" y="5.5" width="18" height="13" rx="3" />
      <path d="M4 8.5l8 5.5 8-5.5" />
    </svg>
  ),
  timed: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...LINE}>
      <circle cx="12" cy="13.5" r="7" />
      <path d="M12 13.5V9.8M9.5 3h5M12 3v3" />
    </svg>
  ),
  hunt: () => (
    <svg viewBox="0 0 24 24" width="22" height="22" {...LINE}>
      <path d="M6 21V4M6 5h11l-2.5 4L17 13H6" />
    </svg>
  ),
};

function Chevron() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" {...LINE}>
      <path d="M14 6l-6 6 6 6" />
    </svg>
  );
}

// The logo: a simple shield with a tick on a rounded badge.
function Mark({ size = 40 }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      <defs>
        <linearGradient id="mark-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5b7cff" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#mark-grad)" />
      <path
        d="M20 9l9 3.4v6.4c0 5.8-3.8 9.8-9 11.8-5.2-2-9-6-9-11.8v-6.4L20 9z"
        fill="none"
        stroke="#fff"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 19.8l3 3 5.4-6"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Flame({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} {...LINE}>
      <path d="M12 3c.6 3 4.5 4.6 4.5 9a4.5 4.5 0 0 1-9 0c0-2 .9-3.3 2-4.3.2 1.3.8 2 1.6 2.2C10.9 8.4 11 5.6 12 3z" />
    </svg>
  );
}

function ShieldIcon({ kind }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="26"
      height="26"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-3z" />
      {kind === "phish" ? (
        <>
          <path d="M12 8v4" />
          <path d="M12 15.5h.01" />
        </>
      ) : (
        <path d="M9 12l2 2 4-4" />
      )}
    </svg>
  );
}

// The inside of a Phish / Legit button (used by the real buttons and the intro demo)
function AnswerFace({ kind, showKey }) {
  const isPhish = kind === "phish";
  return (
    <>
      <span className="answer-icon">
        <ShieldIcon kind={kind} />
      </span>
      <span className="answer-text">
        <strong>{isPhish ? "Phish" : "Legit"}</strong>
        <span>{isPhish ? "It's a scam" : "It's safe"}</span>
      </span>
      {showKey && (
        <kbd className="answer-key" aria-hidden="true">
          {isPhish ? "P" : "L"}
        </kbd>
      )}
    </>
  );
}

// ---------- badges ----------
const BADGE_ICONS = {
  first: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...LINE}>
      <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9L12 3.5z" />
    </svg>
  ),
  perfect: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...LINE}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4" />
      <path d="M12 12h.01" />
    </svg>
  ),
  "daily-perfect": () => ICONS.daily(),
  streak5: () => <Flame size={24} />,
  clock: () => ICONS.timed(),
  hunt: () => ICONS.hunt(),
  regular: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...LINE}>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4M9 15l2 2 4-4" />
    </svg>
  ),
  sharp: () => (
    <svg viewBox="0 0 24 24" width="24" height="24" {...LINE}>
      <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  ),
};

function Badges({ earned }) {
  const count = BADGES.filter((b) => earned[b.id]).length;
  return (
    <section className="badges" aria-labelledby="badges-title">
      <div className="badges-head">
        <h2 id="badges-title" className="section-label">
          Badges
        </h2>
        <span className="badges-count">
          {count} of {BADGES.length}
        </span>
      </div>
      <ul className="badge-grid">
        {BADGES.map((b) => {
          const Icon = BADGE_ICONS[b.id];
          const on = Boolean(earned[b.id]);
          return (
            <li key={b.id} className={`badge ${on ? "on" : "off"}`}>
              <span className="badge-icon">
                <Icon />
              </span>
              <span className="badge-text">
                <strong>
                  {b.name}
                  <span className="sr-only">{on ? " (earned)" : " (locked)"}</span>
                </strong>
                <span>{b.hint}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function NewBadges({ ids }) {
  if (!ids.length) return null;
  return (
    <div className="newbadges" role="status">
      {ids.map((id) => {
        const b = BADGES.find((x) => x.id === id);
        const Icon = BADGE_ICONS[id];
        return (
          <div key={id} className="newbadge">
            <span className="badge-icon">
              <Icon />
            </span>
            <span className="badge-text">
              <span className="newbadge-label">Badge unlocked</span>
              <strong>{b.name}</strong>
              <span>{b.hint}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ---------- share card image ----------
// Draws a 1080 x 1080 picture of your score on a canvas. Nothing is uploaded.
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function drawShareCard({ score, total, label, rankTitle, sub, perfect }) {
  const W = 1080;
  const H = 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  try {
    await document.fonts.load('800 100px "Bricolage Grotesque Variable"');
    await document.fonts.load('600 40px "Bricolage Grotesque Variable"');
  } catch {
    // no font loading support, the system font is used instead
  }
  const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif';

  // background
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#090d16");
  bg.addColorStop(1, "#1a1243");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  };
  glow(180, 120, 620, "rgba(91,124,255,0.35)");
  glow(960, 300, 560, "rgba(139,92,246,0.3)");
  glow(760, 1040, 640, "rgba(255,77,157,0.22)");
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1;
  for (let p = 0; p <= W; p += 60) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, H);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(W, p);
    ctx.stroke();
  }

  // logo badge and title
  ctx.save();
  ctx.translate(80, 76);
  ctx.scale(2.4, 2.4);
  const lg = ctx.createLinearGradient(0, 0, 40, 40);
  lg.addColorStop(0, "#5b7cff");
  lg.addColorStop(1, "#8b5cf6");
  ctx.fillStyle = lg;
  roundRect(ctx, 0, 0, 40, 40, 11);
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.stroke(new Path2D("M20 9l9 3.4v6.4c0 5.8-3.8 9.8-9 11.8-5.2-2-9-6-9-11.8v-6.4L20 9z"));
  ctx.lineWidth = 2.4;
  ctx.stroke(new Path2D("M16 19.8l3 3 5.4-6"));
  ctx.restore();

  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.font = `800 54px ${FONT}`;
  ctx.fillText("Phish or Legit?", 204, 152);
  ctx.textAlign = "right";
  ctx.fillStyle = "#aab6cd";
  ctx.font = `600 38px ${FONT}`;
  ctx.fillText(label, W - 80, 148);

  // score ring
  const cx = 540;
  const cy = 470;
  const r = 240;
  const pct = total ? score / total : 0;
  ctx.lineWidth = 46;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (pct > 0) {
    const rg = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    if (perfect) {
      rg.addColorStop(0, "#ffd166");
      rg.addColorStop(1, "#ff7a2f");
    } else {
      rg.addColorStop(0, "#3ddc97");
      rg.addColorStop(1, "#5b7cff");
    }
    ctx.strokeStyle = rg;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
    ctx.stroke();
  }
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff";
  ctx.font = `800 240px ${FONT}`;
  ctx.fillText(String(score), cx, cy + 70);
  ctx.fillStyle = "#aab6cd";
  ctx.font = `600 46px ${FONT}`;
  ctx.fillText(`out of ${total}`, cx, cy + 142);

  // rank and extra line
  ctx.fillStyle = "#fff";
  ctx.font = `800 104px ${FONT}`;
  ctx.fillText(rankTitle, cx, 850);
  if (sub) {
    ctx.fillStyle = perfect ? "#ffb84d" : "#aab6cd";
    ctx.font = `600 40px ${FONT}`;
    ctx.fillText(sub, cx, 922);
  }

  // footer
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80, 975);
  ctx.lineTo(W - 80, 975);
  ctx.stroke();
  ctx.textAlign = "left";
  ctx.fillStyle = "#fff";
  ctx.font = `800 46px ${FONT}`;
  ctx.fillText("Can you beat me?", 80, 1040);
  ctx.textAlign = "right";
  ctx.fillStyle = "#aab6cd";
  ctx.font = `600 34px ${FONT}`;
  ctx.fillText(window.location.host, W - 80, 1038);

  return canvas;
}

function ShareCard({ score, total, label, rankTitle, sub, perfect, shareText }) {
  const [canvas, setCanvas] = useState(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const canShareFiles = useMemo(() => {
    try {
      return (
        typeof navigator !== "undefined" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({
          files: [new File([""], "a.png", { type: "image/png" })],
        })
      );
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    let alive = true;
    drawShareCard({ score, total, label, rankTitle, sub, perfect }).then((c) => {
      if (!alive || !c) return;
      setCanvas(c);
      setUrl(c.toDataURL("image/png"));
    });
    return () => {
      alive = false;
    };
  }, [score, total, label, rankTitle, sub, perfect]);

  async function shareImage() {
    if (!canvas) return;
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;
    const file = new File([blob], "phish-or-legit-score.png", {
      type: "image/png",
    });
    if (canShareFiles) {
      try {
        await navigator.share({ files: [file], text: shareText });
        return;
      } catch (e) {
        if (e && e.name === "AbortError") return;
      }
    }
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    setStatus("Saved to your downloads");
  }

  async function copyText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="sharecard">
      <p className="share-title">Share your score</p>
      {url ? (
        <img
          className="sharecard-img"
          src={url}
          alt={`Score card: ${score} out of ${total}, ${rankTitle}`}
        />
      ) : (
        <div className="sharecard-skel" aria-hidden="true" />
      )}
      <div className="sharecard-actions">
        <button className="ghost" onClick={shareImage} disabled={!canvas}>
          {canShareFiles ? "Share image" : "Save image"}
        </button>
        <button className="ghost" onClick={copyText}>
          {copied ? "Copied" : "Copy text"}
        </button>
      </div>
      {status && (
        <p className="results-sub" role="status">
          {status}
        </p>
      )}
    </div>
  );
}

// ---------- scenario cards ----------
function Scenario({ item, revealed }) {
  const { name, address } = parseSender(item.from);
  const state = revealed ? (item.answer === "phish" ? "bad" : "ok") : "";
  const initial = name.trim().charAt(0).toUpperCase();
  const link = item.link ? (
    <span className={`fakelink ${state}`}>{item.link}</span>
  ) : null;

  if (item.type === "email") {
    return (
      <div className="mail">
        <div className="mail-bar">
          <span />
          <span />
          <span />
          <em>Inbox</em>
        </div>
        <div className="mail-head">
          <div className="avatar">{initial}</div>
          <div>
            <div className="sender-name">{name}</div>
            {address && (
              <div className={`sender-addr ${state}`}>{address}</div>
            )}
          </div>
        </div>
        <h2 className="mail-subject">{item.subject}</h2>
        <p className="mail-body">{item.body}</p>
        {link && <div className="mail-link">{link}</div>}
      </div>
    );
  }

  return (
    <div className={`chat ${item.type}`}>
      <div className="chat-head">
        <div className="avatar small">{initial}</div>
        <div className={`sender-name ${state}`}>{item.from}</div>
        <div className="chat-type">{TYPE_LABELS[item.type] || "Message"}</div>
      </div>
      {item.type === "message" && item.subject && (
        <div className="listing-title">{item.subject}</div>
      )}
      <div className="bubble">
        {item.body}
        {link}
      </div>
    </div>
  );
}

// ---------- rotating example messages (menu hero) ----------
function InboxStack({ items }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      Boolean(window.matchMedia) &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (paused || reduceMotion || items.length < 2) return;
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 5000);
    return () => clearInterval(t);
  }, [paused, reduceMotion, items.length, i]);

  const item = items[i];

  return (
    <div
      className="stack"
      role="group"
      aria-label="Example messages"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="deck">
        <div className="layer layer-3" aria-hidden="true" />
        <div className="layer layer-2" aria-hidden="true" />
        <article className="front note" key={item.id}>
          <header className="note-head">
            <span className="note-app" aria-hidden="true" />
            <span>Inbox</span>
            <span className="note-time">now</span>
          </header>
          <p className="note-from">{item.from}</p>
          <p className="note-body">{item.body}</p>
        </article>
      </div>

      <div className="stack-foot">
        <p className="ask">Real or fake? You decide.</p>
        <div className="dots">
          {items.map((s, n) => (
            <button
              key={s.id}
              className="dot"
              aria-label={`Show example ${n + 1} of ${items.length}`}
              aria-current={n === i}
              onClick={() => setI(n)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- results extras ----------
// Confetti pieces use fixed values (no randomness), so every burst looks lively
function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 12) * 0.1,
    duration: 2.4 + (i % 5) * 0.4,
    size: 6 + (i % 4) * 3,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    spin: (i % 2 ? 1 : -1) * (360 + (i % 5) * 120),
  }));

  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--spin": `${p.spin}deg`,
          }}
        />
      ))}
    </div>
  );
}

// Counts the score up from 0 on the results screen
function CountUp({ value }) {
  const [n, setN] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let current = 0;
    const t = setInterval(
      () => {
        current += 1;
        setN(current);
        if (current >= value) clearInterval(t);
      },
      Math.max(80, Math.floor(1000 / value))
    );
    return () => clearInterval(t);
  }, [value]);

  return <>{n}</>;
}

// ---------- "How it works" and About panel ----------
function InfoPanel({ onClose }) {
  return (
    <div className="info-backdrop" onClick={onClose}>
      <div
        className="info-panel"
        role="dialog"
        aria-modal="true"
        aria-label="How it works"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="info-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
        <h2>How it works</h2>

        <h3>How to play</h3>
        <ol>
          <li>Read the message. It could be an email, text, DM or listing.</li>
          <li>Decide if it's a phish (a scam) or legit.</li>
          <li>
            See the red flags, learn what to do next, and build your streak.
          </li>
        </ol>

        <h3>Game modes</h3>
        <ul className="info-modes">
          {Object.entries(MODES).map(([key, m]) => {
            const Icon = ICONS[key];
            return (
              <li key={key}>
                <Icon />
                <span>
                  <strong>{m.label}.</strong> {m.desc}
                </span>
              </li>
            );
          })}
        </ul>

        <h3>Privacy</h3>
        <ul>
          <li>No account or sign-up.</li>
          <li>There is no analytics or tracking code in the game.</li>
          <li>
            Your Daily Challenge result, badges and round totals are saved in
            your own browser, and nowhere else.
          </li>
          <li>Every scam link in the game is fake and can't be clicked.</li>
        </ul>

        <h3>About</h3>
        <p>
          Phish or Legit? is a free project by {AUTHOR}, a cyber security
          student, to make scam awareness more fun. The messages are fictional,
          written from common scam types seen in Australia. It's for learning
          and isn't professional advice.
        </p>

        <h3>Real help if you've been scammed</h3>
        <p>Contact your bank first, then report it:</p>
        <div className="info-links">
          <a
            href="https://www.scamwatch.gov.au/report-a-scam"
            target="_blank"
            rel="noopener noreferrer"
          >
            Scamwatch
          </a>
          <a
            href="https://www.cyber.gov.au"
            target="_blank"
            rel="noopener noreferrer"
          >
            ReportCyber
          </a>
          <a
            href="https://www.idcare.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            IDCARE
          </a>
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
            Source code
          </a>
        </div>
      </div>
    </div>
  );
}

// ---------- intro screen ----------
const DEMO_ITEM = {
  id: 0,
  type: "sms",
  from: "AusPost",
  subject: null,
  body: "Your parcel is on hold. Pay a $2.95 fee within 24 hours.",
  link: null,
  answer: "phish",
  explanation:
    "Delivery scams use small fees to steal card details. Check your parcel in the official app instead.",
  redFlags: [
    "Asks you to pay a fee by message",
    "Urgent 24 hour deadline",
    "No tracking number or delivery details",
  ],
};

function Intro({ onStart, onInfo }) {
  const [pick, setPick] = useState(null);
  const gotIt = pick === DEMO_ITEM.answer;

  return (
    <main className="screen intro">
      <header className="topbar">
        <Mark size={32} />
        <button className="pill" onClick={onInfo}>
          How it works
        </button>
      </header>

      <div className="intro-grid">
        <div className="intro-copy">
          <p className="intro-note">Free. No sign-up. About two minutes.</p>
          <h1 className="intro-title">Phish or Legit?</h1>
          <p className="intro-sub">
            Can you spot a scam before it spots you? Read realistic emails,
            texts and DMs, then decide if they're safe.
          </p>

          <div className="intro-actions">
            <button className="cta" onClick={onStart}>
              Start playing
            </button>
            <span className="cta-note">
              Your scores stay in your browser.
            </span>
          </div>

          <ol className="how">
            <li>Read the message</li>
            <li>Decide: phish or legit</li>
            <li>See the red flags and what to do next</li>
          </ol>
        </div>

        <div className="intro-demo">
          <p className="try-label">
            <span>Try it</span> Is this message a phish or legit?
          </p>
          <div className={`deck ${pick ? "hit" : ""}`}>
            <div className="layer layer-3" aria-hidden="true" />
            <div className="layer layer-2" aria-hidden="true" />
            <div className="front">
              <Scenario item={DEMO_ITEM} revealed={Boolean(pick)} />
              {pick && <span className="stamp">Phish</span>}
            </div>
          </div>

          {!pick ? (
            <div className="answers demo-answers">
              <button
                className="answer phish"
                aria-label="Phish: it's a scam"
                onClick={() => setPick("phish")}
              >
                <AnswerFace kind="phish" />
              </button>
              <button
                className="answer legit"
                aria-label="Legit: it's safe"
                onClick={() => setPick("legit")}
              >
                <AnswerFace kind="legit" />
              </button>
            </div>
          ) : (
            <div
              className={`demo-feedback ${gotIt ? "good" : "wrong"}`}
              aria-live="polite"
            >
              <h3>{gotIt ? "Correct." : "Not quite."} This was a phish.</h3>
              <p>{DEMO_ITEM.explanation}</p>
              <ul className="flags">
                {DEMO_ITEM.redFlags.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <p className="demo-ask">That's the whole game. Ready for more?</p>
              <div className="demo-actions">
                <button className="cta nudge" onClick={onStart}>
                  Start playing
                </button>
                <button className="ghost small" onClick={() => setPick(null)}>
                  Try again
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="intro-foot">Every scam link in the game is fake.</p>
    </main>
  );
}

// ---------- menu screen ----------
function Menu({ daily, playedToday, earned, onSelect, onHome, onInfo }) {
  const items = useMemo(
    () =>
      shuffle(
        scenarios.filter((s) => s.type !== "email" && s.body.length <= 95),
        mulberry32(hashString(todayKey()))
      ).slice(0, 5),
    []
  );
  const dailySize = MODES.daily.size;
  const practice = [
    { key: "classic", blurb: "Ten random messages. Play as often as you like." },
    {
      key: "timed",
      blurb: "Beat the clock. Running out of time counts as wrong.",
    },
    { key: "hunt", blurb: "It's a scam. Pick the real warning sign." },
  ];

  return (
    <main className="screen menu">
      <header className="topbar">
        <button className="link" onClick={onHome}>
          <Chevron />
          Home
        </button>
        <button className="pill" onClick={onInfo}>
          How it works
        </button>
      </header>

      <div className="brand">
        <Mark />
        <div>
          <h1 className="title">Phish or Legit?</h1>
          <p className="brand-sub">Read the message. Decide if it's a scam.</p>
        </div>
      </div>

      <section className="hero" aria-labelledby="daily-title">
        <div className="hero-copy">
          <h2 id="daily-title" className="hero-title">
            {MODES.daily.label}
          </h2>
          <p className="hero-text">
            Five messages, the same for everyone today. You get one try.
          </p>

          <div className="actions">
            <button className="cta" onClick={() => onSelect("daily")}>
              {playedToday ? "See today's result" : "Play today's set"}
            </button>

            {playedToday ? (
              <div className="status">
                <div
                  className="score-bar"
                  role="img"
                  aria-label={`You scored ${daily.score} out of ${dailySize} today`}
                >
                  {Array.from({ length: dailySize }, (_, n) => (
                    <span key={n} className={n < daily.score ? "on" : ""} />
                  ))}
                </div>
                <span>
                  {daily.score} of {dailySize}. New set in {untilTomorrow()}
                </span>
              </div>
            ) : (
              <span className="status">New set every midnight</span>
            )}
          </div>
        </div>

        <InboxStack items={items} />
      </section>

      <h2 className="section-label">Practice</h2>
      <div className="tiles">
        {practice.map(({ key, blurb }) => {
          const m = MODES[key];
          const Icon = ICONS[key];
          return (
            <button
              key={key}
              className={`tile tile-${key}`}
              onClick={() => onSelect(key)}
            >
              <span className="tile-icon">
                <Icon />
              </span>
              <span className="tile-name">{m.label}</span>
              <span className="tile-blurb">{blurb}</span>
              <span className="tile-meta">
                <span>{m.size} questions</span>
                <span>{m.time}</span>
              </span>
            </button>
          );
        })}
      </div>

      <Badges earned={earned} />

      <p className="foot">No account needed. Every link in the game is fake.</p>
    </main>
  );
}

// ---------- the app ----------
export default function App() {
  const [started, setStarted] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [mode, setMode] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [results, setResults] = useState([]);
  const [daily, setDaily] = useState(() => load("pol-daily", null));
  const [stats, setStats] = useState(() => load("pol-stats", emptyStats()));
  const [badges, setBadges] = useState(() => load("pol-badges", {}));
  const [newBadges, setNewBadges] = useState([]);

  const playedToday = daily && daily.date === todayKey();

  // Escape key closes the How it works panel
  useEffect(() => {
    if (!showInfo) return;
    const onKey = (e) => {
      if (e.key === "Escape") setShowInfo(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showInfo]);

  // Keyboard shortcuts: P = Phish, L = Legit (not in Red Flag Hunt)
  useEffect(() => {
    if (!started || !mode || mode === "hunt" || finished || picked || showInfo) {
      return;
    }
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "p") choose("phish");
      else if (k === "l") choose("legit");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Timed mode countdown: one tick per second, running out counts as wrong
  useEffect(() => {
    if (mode !== "timed" || finished || picked || deck.length === 0) return;
    const t = setTimeout(() => {
      if (timeLeft <= 1) {
        setTimeLeft(0);
        setPicked("timeout");
        setResults((r) => [...r, false]);
        setStreak(0);
      } else {
        setTimeLeft(timeLeft - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [mode, finished, picked, deck.length, timeLeft]);

  function startMode(m) {
    setMode(m);
    setDeck(buildDeck(m));
    setIndex(0);
    setPicked(null);
    setStreak(0);
    setBestStreak(0);
    setCelebrate(false);
    setNewBadges([]);
    setTimeLeft(TIME_LIMIT);
    setResults([]);
    if (m === "daily" && playedToday) {
      setScore(daily.score);
      setFinished(true);
    } else {
      setScore(0);
      setFinished(false);
    }
  }

  function backToMenu() {
    setMode(null);
  }

  function choose(choice) {
    if (picked) return;
    const entry = deck[index];
    const right =
      mode === "hunt" ? choice === entry.correct : choice === entry.item.answer;
    setPicked(choice);
    setResults((r) => [...r, right]);
    if (right) {
      const newStreak = streak + 1;
      setScore(score + 1);
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
    } else {
      setStreak(0);
    }
  }

  function finish() {
    const total = deck.length;
    setFinished(true);
    setCelebrate(score >= Math.ceil(total * 0.8));
    if (mode === "daily") {
      const result = { date: todayKey(), score };
      save("pol-daily", result);
      setDaily(result);
    }

    // running totals and badges
    const round = { mode, score, total, bestStreak, date: todayKey() };
    const nextStats = updateStats(stats, round);
    const fresh = evaluateBadges(nextStats, round, badges);
    setStats(nextStats);
    save("pol-stats", nextStats);
    setNewBadges(fresh);
    if (fresh.length) {
      const nextBadges = { ...badges };
      fresh.forEach((id) => {
        nextBadges[id] = todayKey();
      });
      setBadges(nextBadges);
      save("pol-badges", nextBadges);
    }
  }

  function next() {
    if (index + 1 >= deck.length) {
      finish();
    } else {
      setIndex(index + 1);
      setPicked(null);
      setTimeLeft(TIME_LIMIT);
    }
  }

  const info = showInfo && <InfoPanel onClose={() => setShowInfo(false)} />;

  // ---------- Intro ----------
  if (!started) {
    return (
      <>
        <Intro
          onStart={() => setStarted(true)}
          onInfo={() => setShowInfo(true)}
        />
        {info}
      </>
    );
  }

  // ---------- Menu ----------
  if (!mode) {
    return (
      <>
        <Menu
          daily={daily}
          playedToday={playedToday}
          earned={badges}
          onSelect={startMode}
          onHome={() => setStarted(false)}
          onInfo={() => setShowInfo(true)}
        />
        {info}
      </>
    );
  }

  const ModeIcon = ICONS[mode];

  // ---------- Results ----------
  if (finished) {
    const total = deck.length;
    const rank = getRank(score, total);
    const label = MODES[mode].label;
    const shareText =
      mode === "daily"
        ? `Phish or Legit? Daily ${todayKey()}: ${score}/${total}. Can you beat me? ${window.location.href}`
        : `I scored ${score}/${total} in ${label} on Phish or Legit? (${rank.title}). Can you beat me? ${window.location.href}`;

    const perfect = score === total;
    const dateText = new Date().toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const sub = perfect
      ? "Perfect score"
      : mode === "daily"
        ? `Daily challenge, ${dateText}`
        : mode !== "hunt"
          ? `Best streak ${bestStreak}`
          : "";

    return (
      <main className="screen narrow">
        <header className="topbar">
          <button className="link" onClick={backToMenu}>
            <Chevron />
            Menu
          </button>
          <span className="modechip">
            <ModeIcon />
            {label}
          </span>
        </header>
        {celebrate && <Confetti />}
        <div className={`results pop ${celebrate ? "perfect" : ""}`}>
          {celebrate && (
            <p className="tag">
              {score === total ? "Perfect score" : "Great round"}
            </p>
          )}
          <div className="rank-emoji">{rank.emoji}</div>
          <h2 className="rank-title">{rank.title}</h2>
          <div className="big-score">
            <CountUp value={score} />
            <span>/ {total}</span>
          </div>
          {mode !== "hunt" && <p className="results-sub">Best streak: {bestStreak}</p>}
          {mode === "daily" && (
            <p className="results-sub">Come back tomorrow for a new set.</p>
          )}
          <NewBadges ids={newBadges} />
          <ShareCard
            score={score}
            total={total}
            label={label}
            rankTitle={rank.title}
            sub={sub}
            perfect={perfect}
            shareText={shareText}
          />
          <div className="results-actions">
            {mode !== "daily" && (
              <button className="cta" onClick={() => startMode(mode)}>
                Play again
              </button>
            )}
            <button className="ghost" onClick={backToMenu}>
              Menu
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ---------- Question ----------
  const entry = deck[index];
  const current = entry.item;
  const correct =
    mode === "hunt" ? picked === entry.correct : picked === current.answer;
  const hints =
    current.answer === "phish" ? current.redFlags : current.safeSigns;

  return (
    <main className="screen narrow">
      <header className="topbar">
        <button className="link" onClick={backToMenu}>
          <Chevron />
          Menu
        </button>
        <span className="modechip">
          <ModeIcon />
          {MODES[mode].label}
        </span>
      </header>

      {picked && (
        <div
          key={index}
          className={`flash ${correct ? "good" : "bad"}`}
          aria-hidden="true"
        />
      )}
      <div
        className="segments"
        role="img"
        aria-label={`Question ${index + 1} of ${deck.length}`}
      >
        {deck.map((_, n) => (
          <span
            key={n}
            className={
              n < results.length
                ? results[n]
                  ? "right"
                  : "wrong"
                : n === index
                  ? "now"
                  : ""
            }
          />
        ))}
      </div>
      <div className="meta">
        <span>
          Question {index + 1} of {deck.length}
        </span>
        <span className="meta-stats">
          <span key={`score-${score}`} className="score-pop">
            Score {score}
          </span>
          {mode !== "hunt" && (
            <span key={`streak-${streak}`} className={`streak ${streak >= 3 ? "hot" : ""}`}>
              <Flame />
              {streak}
            </span>
          )}
        </span>
      </div>

      {mode === "timed" && (
        <div
          className={`timer ${timeLeft <= 5 ? "urgent" : ""} ${
            picked ? "frozen" : ""
          }`}
        >
          <div className="timer-track">
            <div
              className="timer-fill"
              style={{ width: `${(timeLeft / TIME_LIMIT) * 100}%` }}
            />
          </div>
          <span className="timer-num">{timeLeft}s</span>
        </div>
      )}

      <div className={`stage ${picked && !correct ? "shake" : ""}`}>
        <Scenario item={current} revealed={Boolean(picked)} />
      </div>

      {mode === "hunt" ? (
        <div className="hunt">
          <p className="hunt-q">
            This is a scam. Which one is a real warning sign?
          </p>
          {entry.options.map((opt) => {
            let cls = "option";
            if (picked) {
              if (opt === entry.correct) cls += " correct";
              else if (opt === picked) cls += " wrong";
            }
            return (
              <button
                key={opt}
                className={cls}
                onClick={() => choose(opt)}
                disabled={Boolean(picked)}
              >
                {opt}
              </button>
            );
          })}
        </div>
      ) : (
        !picked && (
          <>
            <div className="answers">
              <button
                className="answer phish"
                aria-label="Phish: it's a scam"
                onClick={() => choose("phish")}
              >
                <AnswerFace kind="phish" showKey />
              </button>
              <button
                className="answer legit"
                aria-label="Legit: it's safe"
                onClick={() => choose("legit")}
              >
                <AnswerFace kind="legit" showKey />
              </button>
            </div>
            <p className="key-hint">
              Tip: press <kbd>P</kbd> for Phish or <kbd>L</kbd> for Legit
            </p>
          </>
        )
      )}

      {picked && (
        <div className={`feedback ${correct ? "good" : "wrong"}`}>
          <h3>
            {picked === "timeout"
              ? "Time's up."
              : correct
                ? "Correct."
                : "Not quite."}{" "}
            {mode === "hunt"
              ? "Here is the full picture."
              : `This was ${current.answer === "phish" ? "a phish." : "legit."}`}
          </h3>
          <p>{current.explanation}</p>
          <p className="label">
            {current.answer === "phish" ? "Red flags" : "Safe signs"}
          </p>
          <ul className="flags">
            {hints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {current.answer === "phish" && (
            <div className="next-steps">
              <p className="label">What to do next</p>
              <ol>
                {getTips(current).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ol>
              <p className="next-note">
                Already clicked, shared details or paid? Contact your bank
                first, then get help below.
              </p>
              <div className="help-links">
                <a
                  href="https://www.scamwatch.gov.au/report-a-scam"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report to Scamwatch
                </a>
                <a
                  href="https://www.cyber.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ReportCyber
                </a>
                <a
                  href="https://www.idcare.org"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  IDCARE support
                </a>
              </div>
            </div>
          )}

          <button className="cta" onClick={next}>
            {index + 1 >= deck.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </main>
  );
}
