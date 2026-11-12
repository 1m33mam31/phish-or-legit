import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no canvas, so the share image is simply skipped in tests
HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
