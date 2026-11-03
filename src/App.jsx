import { useState } from "react";
import scenarios from "./data/scenarios.json";
import "./App.css";

const MODES = {
  daily: {
    label: "Daily Challenge",
    emoji: "📅",
    desc: "5 questions, same for everyone today. One try.",
    size: 5,
  },
  classic: {
    label: "Classic",
    emoji: "🎣",
    desc: "All 10 scenarios in random order.",
    size: scenarios.length,
  },
  hunt: {
    label: "Red Flag Hunt",
    emoji: "🚩",
    desc: "Spot the real warning sign in 5 scams.",
    size: 5,
  },
};

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

function buildDeck(mode) {
  if (mode === "daily") {
    const rand = mulberry32(hashString(todayKey()));
    return shuffle(scenarios, rand)
      .slice(0, MODES.daily.size)
      .map((item) => ({ item }));
  }
  if (mode === "hunt") {
    const phish = scenarios.filter((s) => s.answer === "phish");
    const decoyPool = scenarios.flatMap((s) => s.safeSigns || []);
    return shuffle(phish)
      .slice(0, MODES.hunt.size)
      .map((item) => {
        const correct =
          item.redFlags[Math.floor(Math.random() * item.redFlags.length)];
        const decoys = shuffle(decoyPool).slice(0, 3);
        return { item, correct, options: shuffle([correct, ...decoys]) };
      });
  }
  return shuffle(scenarios).map((item) => ({ item }));
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

export default function App() {
  const [mode, setMode] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [best, setBest] = useState(() => load("pol-best", {}));
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
    if (mode === "daily") {
      const result = { date: todayKey(), score };
      save("pol-daily", result);
      setDaily(result);
    } else if (score > (best[mode] ?? 0)) {
      const updated = { ...best, [mode]: score };
      save("pol-best", updated);
      setBest(updated);
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

  // ---------- Menu ----------
  if (!mode) {
    return (
      <main className="app">
        <h1 className="title">🎣 Phish or Legit?</h1>
        <p className="subtitle">Pick a mode</p>
        <div className="modes">
          {Object.entries(MODES).map(([key, m]) => {
            let badge = "";
            if (key === "daily") {
              badge = playedToday
                ? `Today: ${daily.score}/${m.size} ✓`
                : "Not played today";
            } else if (best[key] != null) {
              badge = `Best: ${best[key]}/${m.size}`;
            }
            return (
              <button
                key={key}
                className="mode-card"
                onClick={() => startMode(key)}
              >
                <span className="mode-emoji">{m.emoji}</span>
                <span className="mode-text">
                  <strong>{m.label}</strong>
                  <span>{m.desc}</span>
                  {badge && <em>{badge}</em>}
                </span>
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
        <div className="results">
          <p className="tag">{label}</p>
          <div className="rank-emoji">{rank.emoji}</div>
          <h2 className="rank-title">{rank.title}</h2>
          <p>
            You scored {score} / {total}.
            {mode !== "hunt" && ` Best streak: ${bestStreak}`}
          </p>
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
          <p className="hunt-q">This is a scam. Which one is a real warning sign?</p>
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