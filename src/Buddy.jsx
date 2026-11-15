import { ITEMS_BY_ID } from "./rewards.js";

// The mascot: a friendly purple shield. Its shapes are plain data (see buddyOps),
// so the same drawing can be shown on the page (SVG) and on the share image (canvas).

const DARK = "#1b1450";

const BODY = [
  { t: "path", d: "M50 8 L84 21 V50 C84 72 70 86 50 93 C30 86 16 72 16 50 V21 Z", fill: "#7c6cff", stroke: "#4b3fd1", w: 3 },
  { t: "path", d: "M50 15 L77 25 V50 C77 67 66 79 50 85 C34 79 23 67 23 50 V25 Z", fill: "#8d80ff" },
];

const CHEEKS = [
  { t: "circle", cx: 31, cy: 58, r: 4.5, fill: "#ff8fb3", o: 0.75 },
  { t: "circle", cx: 69, cy: 58, r: 4.5, fill: "#ff8fb3", o: 0.75 },
];

const SPARKLES = [
  { t: "path", d: "M90 14 L92 21 L99 23 L92 25 L90 32 L88 25 L81 23 L88 21 Z", fill: "#ffd166" },
  { t: "path", d: "M8 30 L9.5 35 L14.5 36.5 L9.5 38 L8 43 L6.5 38 L1.5 36.5 L6.5 35 Z", fill: "#ffd166" },
];

function eyesOpen(r = 8.5, pupil = 4) {
  return [
    { t: "ellipse", cx: 40, cy: 46, rx: 7.5, ry: r, fill: "#fff" },
    { t: "ellipse", cx: 60, cy: 46, rx: 7.5, ry: r, fill: "#fff" },
    { t: "circle", cx: 41.5, cy: 47.5, r: pupil, fill: DARK },
    { t: "circle", cx: 61.5, cy: 47.5, r: pupil, fill: DARK },
    { t: "circle", cx: 43, cy: 45, r: 1.4, fill: "#fff" },
    { t: "circle", cx: 63, cy: 45, r: 1.4, fill: "#fff" },
  ];
}

// Face shapes for each mood: happy, cheer, wince, wow
export function faceOps(mood) {
  switch (mood) {
    case "cheer":
      return [
        { t: "path", d: "M32 48 Q40 38 48 48", stroke: DARK, w: 3.6 },
        { t: "path", d: "M52 48 Q60 38 68 48", stroke: DARK, w: 3.6 },
        { t: "path", d: "M40 60 Q50 78 60 60 Z", fill: DARK },
        { t: "ellipse", cx: 50, cy: 68.5, rx: 5, ry: 3, fill: "#ff7a8a" },
        ...CHEEKS,
        ...SPARKLES,
      ];
    case "wince":
      return [
        { t: "path", d: "M33 41 L46 47 L33 53", stroke: DARK, w: 3.6 },
        { t: "path", d: "M67 41 L54 47 L67 53", stroke: DARK, w: 3.6 },
        { t: "path", d: "M42 68 Q46 63 50 68 Q54 73 58 68", stroke: DARK, w: 3.2 },
        { t: "path", d: "M79 28 Q85 38 79 42 Q73 38 79 28 Z", fill: "#7dd3fc" },
      ];
    case "wow":
      return [
        ...eyesOpen(10, 3),
        { t: "ellipse", cx: 50, cy: 67, rx: 5, ry: 6.5, fill: DARK },
        ...CHEEKS,
        ...SPARKLES,
      ];
    default:
      return [
        ...eyesOpen(),
        { t: "path", d: "M42 62 Q50 69 58 62", stroke: DARK, w: 3.2 },
        ...CHEEKS,
      ];
  }
}

// All shapes in drawing order: things behind, the body, the face, then worn items.
export function buddyOps(mood = "happy", equipped = {}) {
  const worn = ["back", "face", "hat"]
    .map((slot) => ITEMS_BY_ID[equipped[slot]])
    .filter(Boolean);
  const behind = worn.filter((i) => i.layer === "behind").flatMap((i) => i.ops);
  const front = worn.filter((i) => i.layer !== "behind").flatMap((i) => i.ops);
  return [...behind, ...BODY, ...faceOps(mood), ...front];
}

export function moodForScore(score, total) {
  const pct = total ? score / total : 0;
  if (pct >= 0.8) return "cheer";
  if (pct >= 0.4) return "happy";
  return "wince";
}

function Shape({ op }) {
  const style = {
    fill: op.fill || "none",
    stroke: op.stroke || "none",
    strokeWidth: op.w || 0,
    opacity: op.o,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  if (op.t === "circle") return <circle cx={op.cx} cy={op.cy} r={op.r} {...style} />;
  if (op.t === "ellipse") {
    return <ellipse cx={op.cx} cy={op.cy} rx={op.rx} ry={op.ry} {...style} />;
  }
  return <path d={op.d} {...style} />;
}

export default function Buddy({ mood = "happy", equipped = {}, size = 96, label }) {
  return (
    <svg
      className={`buddy buddy-${mood}`}
      viewBox="-14 -14 128 128"
      width={size}
      height={size}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : "true"}
    >
      {buddyOps(mood, equipped).map((op, i) => (
        <Shape key={i} op={op} />
      ))}
    </svg>
  );
}

// Draws the same shapes onto a canvas (used by the share image).
export function drawBuddy(ctx, ops, x, y, size) {
  const k = size / 128;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.translate(14, 14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const op of ops) {
    ctx.globalAlpha = op.o === undefined ? 1 : op.o;
    if (op.t === "path") {
      const p = new Path2D(op.d);
      if (op.fill) {
        ctx.fillStyle = op.fill;
        ctx.fill(p);
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = op.w || 1;
        ctx.stroke(p);
      }
    } else {
      ctx.beginPath();
      if (op.t === "circle") ctx.arc(op.cx, op.cy, op.r, 0, Math.PI * 2);
      else ctx.ellipse(op.cx, op.cy, op.rx, op.ry, 0, 0, Math.PI * 2);
      if (op.fill) {
        ctx.fillStyle = op.fill;
        ctx.fill();
      }
      if (op.stroke) {
        ctx.strokeStyle = op.stroke;
        ctx.lineWidth = op.w || 1;
        ctx.stroke();
      }
    }
  }
  ctx.restore();
}
