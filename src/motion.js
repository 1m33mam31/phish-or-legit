import { load, save } from "./logic.js";

// Animations: "auto" follows the device setting (Windows "Animation effects", phone "Reduce motion").
// "full" always plays them, for people who want the full show and chose it in the game.

export function systemPrefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    Boolean(window.matchMedia) &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function getFx() {
  return load("pol-fx", "auto") === "full" ? "full" : "auto";
}

// Tells the stylesheet whether the "full animations" choice is on.
export function applyFx(mode) {
  if (typeof document !== "undefined") document.documentElement.dataset.fx = mode;
}

export function setFx(mode) {
  save("pol-fx", mode);
  applyFx(mode);
}

// True when motion effects should be skipped right now.
export function motionReduced() {
  return systemPrefersReducedMotion() && getFx() !== "full";
}
