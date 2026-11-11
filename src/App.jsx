import { useState, useEffect, useMemo } from "react";
import "@fontsource-variable/bricolage-grotesque";
import base from "./data/scenarios.json";
import more from "./data/scenarios-more.json";
import "./App.css";

const scenarios = [...base, ...more];

const AUTHOR = "Ralph"; // shown in the About section, change it if you like
const REPO_URL = "https://github.com/1m33mam31/phish-or-legit";

const TIME_LIMIT = 15;

const MODES = {
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
    desc: `${TIME_LIMIT} seconds per question. Run out of time and it counts as wrong.`,
    size: 10,
    time: "~2 min",
  },
  hunt: {
    label: "Red Flag Hunt",
    desc: "Spot the real warning sign in 5 scams.",
    size: 5,
    time: "~1 min",
  },
};

const DAILY_START = "2026-11-01";

const CONFETTI_COLORS = [
  "#7aa2ff",
  "#3ddc97",
  "#ff5d4f",
  "#ffb84d",
  "#f472b6",
  "#a78bfa",
];

// ---------- "What to do next" tips ----------
const TIP_SETS = {
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

const TIP_IDS = {
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

function getTips(item) {
  const key =
    Object.keys(TIP_IDS).find((k) => TIP_IDS[k].includes(item.id)) || "link";
  const steps = [...TIP_SETS[key]];
  if (item.type === "sms") {
    steps.push("Forward scam texts to 0429 999 888 (ACMA) to help block them.");
  }
  return steps;
}

// ---------- helpers ----------
function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand = Math.random) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
}

function untilTomorrow() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const mins = Math.ceil((next - now) / 60000);
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable, ignore
  }
}

// Replays every day since DAILY_START, so each day skips the previous day's 5
function dailyIds(dateStr) {
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

function buildDeck(mode) {
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

function parseSender(from) {
  const match = from.match(/^(.*?)\s*<(.+)>$/);
  return match
    ? { name: match[1], address: match[2] }
    : { name: from, address: null };
}

function getRank(score, total) {
  const pct = score / total;
  if (pct >= 0.9) return { title: "Cyber Legend", emoji: "🛡️" };
  if (pct >= 0.7) return { title: "Phish Hunter", emoji: "🎣" };
  if (pct >= 0.4) return { title: "Scam Spotter", emoji: "🔍" };
  return { title: "Easy Catch", emoji: "🐟" };
}

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

function Flame() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" {...LINE}>
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
            The only thing saved is your Daily Challenge result, in your own
            browser.
          </li>
          <li>Every scam link in the game is fake and can't be clicked.</li>
        </ul>

        <h3>About</h3>
        <p>
          Phish or Legit? is a free game to make scam awareness more fun and make everyone more understanding on phising and keeping safe. The messages are fictional,
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
};

function Intro({ onStart, onInfo }) {
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

        <div className="intro-demo" aria-hidden="true">
          <div className="deck">
            <div className="layer layer-3" />
            <div className="layer layer-2" />
            <div className="front">
              <Scenario item={DEMO_ITEM} revealed={false} />
              <span className="stamp">Phish</span>
            </div>
          </div>
          <div className="answers demo-answers">
            <span className="answer phish demo">
              <AnswerFace kind="phish" />
            </span>
            <span className="answer legit demo">
              <AnswerFace kind="legit" />
            </span>
          </div>
        </div>
      </div>

      <p className="intro-foot">Every scam link in the game is fake.</p>
    </main>
  );
}

// ---------- menu screen ----------
function Menu({ daily, playedToday, onSelect, onHome, onInfo }) {
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
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [results, setResults] = useState([]);
  const [daily, setDaily] = useState(() => load("pol-daily", null));

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
    setCopied(false);
    setCelebrate(false);
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
    setFinished(true);
    setCelebrate(score >= Math.ceil(deck.length * 0.8));
    if (mode === "daily") {
      const result = { date: todayKey(), score };
      save("pol-daily", result);
      setDaily(result);
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

    async function copyShare() {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
      } catch {
        setCopied(false);
      }
    }

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
          <div className="share">{shareText}</div>
          <div className="results-actions">
            {mode !== "daily" && (
              <button className="cta" onClick={() => startMode(mode)}>
                Play again
              </button>
            )}
            <button className="ghost" onClick={copyShare}>
              {copied ? "Copied" : "Copy score"}
            </button>
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
                onClick={() => choose("phish")}
              >
                <AnswerFace kind="phish" showKey />
              </button>
              <button
                className="answer legit"
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
