import { useState, useEffect } from "react";
import base from "./data/scenarios.json";
import more from "./data/scenarios-more.json";
import "./App.css";

const scenarios = [...base, ...more];

const MODES = {
  daily: {
    label: "Daily Challenge",
    emoji: "📅",
    desc: "5 questions, same for everyone today. One try.",
    size: 5,
    time: "~1 min",
    accent: "blue",
  },
  classic: {
    label: "Classic",
    emoji: "🎣",
    desc: "10 random scenarios. Play as often as you like.",
    size: 10,
    time: "~3 min",
    accent: "green",
  },
  hunt: {
    label: "Red Flag Hunt",
    emoji: "🚩",
    desc: "Spot the real warning sign in 5 scams.",
    size: 5,
    time: "~1 min",
    accent: "red",
  },
};

const DAILY_START = "2026-11-01";

const CONFETTI_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#ef4444",
  "#f59e0b",
  "#ec4899",
  "#a78bfa",
];

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
  return shuffle(scenarios)
    .slice(0, MODES.classic.size)
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

function Scenario({ item, revealed }) {
  const { name, address } = parseSender(item.from);
  const state = revealed ? (item.answer === "phish" ? "bad" : "ok") : "";
  const initial = name.trim().charAt(0).toUpperCase();
  const link = item.link ? (
    <span className={`fakelink ${state}`}>{item.link}</span>
  ) : null;

  if (item.type === "email") {
    return (
      <div className="window">
        <div className="window-bar">
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

// Rotating "Real or fake?" teaser. The set changes daily and never shows answers.
function Teaser() {
  const [items] = useState(() =>
    shuffle(
      scenarios.filter((s) => s.type !== "email" && s.body.length <= 95),
      mulberry32(hashString(todayKey()))
    ).slice(0, 6)
  );
  const [i, setI] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % items.length), 4500);
    return () => clearInterval(t);
  }, [items.length]);

  const item = items[i];

  return (
    <div className="teaser">
      <div className="teaser-label">
        <span>🤔 Would you fall for this?</span>
        <span className="teaser-live">● Live</span>
      </div>
      <div className="teaser-inner" key={item.id}>
        <div className="teaser-from">{item.from}</div>
        <p className="teaser-body">“{item.body}”</p>
        <div className="teaser-q">Real or fake? Pick a mode to find out 👇</div>
      </div>
      <div className="teaser-dots">
        {items.map((s, n) => (
          <i key={s.id} className={n === i ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

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

function Intro({ onStart }) {
  return (
    <main className="app intro">
      <div className="glow" />
      <div className="intro-badge">🛡️ Free · No sign-up · Takes 2 minutes</div>
      <h1 className="intro-title">
        Phish <span>or</span> Legit?
      </h1>
      <p className="intro-sub">
        Can you spot a scam before it spots you? Read realistic emails, texts
        and DMs, then decide if they're safe.
      </p>

      <div className="intro-demo" aria-hidden="true">
        <div className="chat sms">
          <div className="chat-head">
            <div className="avatar small">A</div>
            <div className="sender-name">AusPost</div>
            <div className="chat-type">Text message</div>
          </div>
          <div className="bubble">
            Your parcel is on hold. Pay a $2.95 fee within 24 hours.
          </div>
        </div>
        <div className="demo-pills">
          <span className="pill pill-phish">🎣 Phish</span>
          <span className="pill pill-legit">✅ Legit</span>
        </div>
      </div>

      <button className="cta" onClick={onStart}>
        Start playing →
      </button>

      <div className="steps">
        <div className="step">
          <strong>1</strong>
          <span>Read the message</span>
        </div>
        <div className="step">
          <strong>2</strong>
          <span>Decide: Phish or Legit</span>
        </div>
        <div className="step">
          <strong>3</strong>
          <span>Learn the red flags</span>
        </div>
      </div>

      <p className="intro-foot">
        Your scores stay in your browser. Every scam link in the game is fake.
      </p>
    </main>
  );
}

export default function App() {
  const [started, setStarted] = useState(false);
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
  const [daily, setDaily] = useState(() => load("pol-daily", null));

  const playedToday = daily && daily.date === todayKey();

  function startMode(m) {
    setMode(m);
    setDeck(buildDeck(m));
    setIndex(0);
    setPicked(null);
    setStreak(0);
    setBestStreak(0);
    setCopied(false);
    setCelebrate(false);
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
    setCelebrate(score === deck.length);
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
    }
  }

  // ---------- Intro ----------
  if (!started) {
    return <Intro onStart={() => setStarted(true)} />;
  }

  // ---------- Menu ----------
  if (!mode) {
    return (
      <main className="app menu">
        <div className="glow" />
        <span className="float f1" aria-hidden="true">🎣</span>
        <span className="float f2" aria-hidden="true">🛡️</span>
        <span className="float f3" aria-hidden="true">🚩</span>
        <span className="float f4" aria-hidden="true">📧</span>
        <span className="float f5" aria-hidden="true">🔒</span>

        <button className="back" onClick={() => setStarted(false)}>
          ← Home
        </button>
        <h1 className="menu-title">
          <span className="bounce">🎣</span> Phish <em>or</em> Legit?
        </h1>
        <p className="subtitle">Choose your challenge</p>

        <Teaser />

        <div className="modes">
          {Object.entries(MODES).map(([key, m], i) => {
            let status = null;
            if (key === "daily") {
              status = playedToday
                ? {
                    cls: "tag-done",
                    text: `✓ ${daily.score}/${m.size} · new set in ${untilTomorrow()}`,
                  }
                : { cls: "tag-new", text: "● Ready to play" };
            }
            return (
              <button
                key={key}
                className={`mode-card ${m.accent}`}
                style={{ animationDelay: `${i * 0.1 + 0.1}s` }}
                onClick={() => startMode(key)}
              >
                <span className="mode-icon">{m.emoji}</span>
                <span className="mode-text">
                  <strong>{m.label}</strong>
                  <span>{m.desc}</span>
                  <span className="mode-tags">
                    <i>{m.size} questions</i>
                    <i>{m.time}</i>
                    {status && <i className={status.cls}>{status.text}</i>}
                  </span>
                </span>
                <span className="mode-go">→</span>
              </button>
            );
          })}
        </div>
      </main>
    );
  }

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
      <main className="app">
        <h1 className="title">🎣 Phish or Legit?</h1>
        {celebrate && <Confetti />}
        <div className={`results pop ${celebrate ? "perfect" : ""}`}>
          <p className="tag">
            {celebrate ? "🎉 Perfect score! · " : ""}
            {label}
          </p>
          <div className="rank-emoji">{rank.emoji}</div>
          <h2 className="rank-title">{rank.title}</h2>
          <div className="big-score">
            <CountUp value={score} />
            <span>/ {total}</span>
          </div>
          {mode !== "hunt" && <p>Best streak: {bestStreak}</p>}
          {mode === "daily" && (
            <p className="tag">Come back tomorrow for a new set.</p>
          )}
          <div className="share">{shareText}</div>
          {mode !== "daily" && (
            <button className="primary" onClick={() => startMode(mode)}>
              Play again
            </button>
          )}
          <button className="secondary" onClick={copyShare}>
            {copied ? "Copied!" : "Copy score"}
          </button>
          <button className="secondary" onClick={backToMenu}>
            Menu
          </button>
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
  const progress = ((index + (picked ? 1 : 0)) / deck.length) * 100;

  return (
    <main className="app">
      <button className="back" onClick={backToMenu}>
        ← Menu
      </button>
      <h1 className="title">
        {MODES[mode].emoji} {MODES[mode].label}
      </h1>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="chips">
        <span>
          Question {index + 1} / {deck.length}
        </span>
        <span className="chip">Score {score}</span>
        {mode !== "hunt" && <span className="chip">🔥 Streak {streak}</span>}
      </div>

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
          <div className="buttons">
            <button className="btn-phish" onClick={() => choose("phish")}>
              🎣 Phish
            </button>
            <button className="btn-legit" onClick={() => choose("legit")}>
              ✅ Legit
            </button>
          </div>
        )
      )}

      {picked && (
        <div className={`feedback ${correct ? "good" : "wrong"}`}>
          <h3>
            {correct ? "Correct!" : "Not quite."}{" "}
            {mode === "hunt"
              ? "Here is the full picture."
              : `This was ${current.answer === "phish" ? "a phish." : "legit."}`}
          </h3>
          <p>{current.explanation}</p>
          <strong>
            {current.answer === "phish" ? "Red flags:" : "Safe signs:"}
          </strong>
          <ul>
            {hints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <button className="primary" onClick={next}>
            {index + 1 >= deck.length ? "See results" : "Next"}
          </button>
        </div>
      )}
    </main>
  );
}