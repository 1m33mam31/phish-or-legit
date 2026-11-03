import { useState } from "react";
import scenarios from "./data/scenarios.json";
import "./App.css";

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
  const [deck, setDeck] = useState(() => shuffle(scenarios));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);

  const current = deck[index];
  const correct = picked === current.answer;

  function choose(choice) {
    if (picked) return;
    setPicked(choice);
    if (choice === current.answer) {
      const newStreak = streak + 1;
      setScore(score + 1);
      setStreak(newStreak);
      setBestStreak(Math.max(bestStreak, newStreak));
    } else {
      setStreak(0);
    }
  }

  function next() {
    if (index + 1 >= deck.length) {
      setFinished(true);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  }

  function restart() {
    setDeck(shuffle(scenarios));
    setIndex(0);
    setPicked(null);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setFinished(false);
    setCopied(false);
  }

  if (finished) {
    const rank = getRank(score, deck.length);
    const shareText = `I scored ${score}/${deck.length} on Phish or Legit? and earned the rank ${rank.title}. Can you beat me?`;

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
          <div className="rank-emoji">{rank.emoji}</div>
          <h2 className="rank-title">{rank.title}</h2>
          <p>
            You scored {score} / {deck.length}. Best streak: {bestStreak}
          </p>
          <div className="share">{shareText}</div>
          <button className="primary" onClick={restart}>
            Play again
          </button>
          <button className="secondary" onClick={copyShare}>
            {copied ? "Copied!" : "Copy score"}
          </button>
        </div>
      </main>
    );
  }

  const hints =
    current.answer === "phish" ? current.redFlags : current.safeSigns;
  const progress = ((index + (picked ? 1 : 0)) / deck.length) * 100;

  return (
    <main className="app">
      <h1 className="title">🎣 Phish or Legit?</h1>

      <div className="progress">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <div className="chips">
        <span>
          Question {index + 1} / {deck.length}
        </span>
        <span className="chip">Score {score}</span>
        <span className="chip">🔥 Streak {streak}</span>
      </div>

      <div className={`stage ${picked && !correct ? "shake" : ""}`}>
        <Scenario item={current} revealed={Boolean(picked)} />
      </div>

      {!picked && (
        <div className="buttons">
          <button className="btn-phish" onClick={() => choose("phish")}>
            🎣 Phish
          </button>
          <button className="btn-legit" onClick={() => choose("legit")}>
            ✅ Legit
          </button>
        </div>
      )}

      {picked && (
        <div className={`feedback ${correct ? "good" : "wrong"}`}>
          <h3>
            {correct ? "Correct!" : "Not quite."} This was{" "}
            {current.answer === "phish" ? "a phish." : "legit."}
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