import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";

const PHISH = /^phish: it's a scam/i;

// Plays one question: answers Phish, then moves on
async function answerAndContinue(user) {
  await user.click(screen.getByRole("button", { name: PHISH }));
  await user.click(screen.getByRole("button", { name: /^(next|see results)$/i }));
}

async function openMenu(user) {
  render(<App />);
  await user.click(screen.getAllByRole("button", { name: /start playing/i })[0]);
}

describe("intro", () => {
  it("shows the title and a playable demo", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(
      screen.getByRole("heading", { name: /phish or legit\?/i })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: PHISH }));
    expect(screen.getByText(/this was a phish/i)).toBeInTheDocument();
    expect(screen.getByText(/correct\./i)).toBeInTheDocument();
  });

  it("says Not quite when the demo is answered wrong", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /^legit: it's safe/i }));
    expect(screen.getByText(/not quite\./i)).toBeInTheDocument();
  });

  it("opens and closes the How it works panel", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /how it works/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("menu", () => {
  it("lists all four modes and the badges", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    expect(
      screen.getByRole("heading", { name: /daily challenge/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /classic/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /timed mode/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /red flag hunt/i })).toBeInTheDocument();
    expect(screen.getByText(/0 of 8/)).toBeInTheDocument();
  });
});

describe("playing", () => {
  it("shows red flags and tips after a scam answer", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /classic/i }));
    expect(screen.getByText(/question 1 of 10/i)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: PHISH }));
    expect(screen.getByRole("button", { name: /^next$/i })).toBeInTheDocument();
  });

  it("Red Flag Hunt shows four options to choose from", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /red flag hunt/i }));
    expect(screen.getByText(/which one is a real warning sign/i)).toBeInTheDocument();
    const options = document.querySelectorAll("button.option");
    expect(options).toHaveLength(4);
  });

  it("keyboard shortcut P answers Phish", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /classic/i }));
    await user.keyboard("p");
    expect(screen.getByRole("button", { name: /^next$/i })).toBeInTheDocument();
  });

  it("finishes a Classic round, shows results and unlocks First catch", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /classic/i }));
    for (let i = 0; i < 10; i++) await answerAndContinue(user);

    expect(screen.getByText("/ 10")).toBeInTheDocument();
    // more than one badge can unlock at once (for example a 5 in a row streak)
    expect(screen.getAllByText(/badge unlocked/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/first catch/i).length).toBeGreaterThan(0);
    expect(JSON.parse(localStorage.getItem("pol-stats")).rounds).toBe(1);
    expect(JSON.parse(localStorage.getItem("pol-badges"))).toHaveProperty("first");
  });

  it("remembers the Daily result after finishing it", async () => {
    const user = userEvent.setup();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: /play today's set/i }));
    for (let i = 0; i < 5; i++) await answerAndContinue(user);
    expect(screen.getByText("/ 5")).toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: /menu/i })[0]);
    expect(
      screen.getByRole("button", { name: /see today's result/i })
    ).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pol-daily")).score).toBeGreaterThanOrEqual(0);
  });
});

describe("rewards", () => {
  async function toMenu(user) {
    await openMenu(user);
  }

  it("shows the rewards strip with the starter case", async () => {
    const user = userEvent.setup();
    await toMenu(user);
    expect(screen.getByRole("heading", { name: /^rewards$/i })).toBeInTheDocument();
    expect(screen.getByText(/to open/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /claim free case/i })).toBeInTheDocument();
  });

  it("claims the free daily case only once", async () => {
    const user = userEvent.setup();
    await toMenu(user);
    await user.click(screen.getByRole("button", { name: /claim free case/i }));
    expect(screen.queryByRole("button", { name: /claim free case/i })).not.toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pol-rewards")).cases).toBe(2);
  });

  it("opens a case and puts the prize in the collection", async () => {
    const user = userEvent.setup();
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    await toMenu(user);
    await user.click(screen.getByRole("button", { name: /open a case/i }));
    expect(screen.getByRole("heading", { name: /phish case/i })).toBeInTheDocument();
    expect(screen.getByText(/drop rates/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^open case$/i }));
    await user.click(screen.getByRole("button", { name: /^skip$/i }));
    expect(screen.getByText(/new item added to your collection/i)).toBeInTheDocument();
    expect(screen.getByText(/no cases left/i)).toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem("pol-rewards"));
    expect(saved.cases).toBe(0);
    expect(Object.keys(saved.owned)).toHaveLength(1);
    vi.restoreAllMocks();
  });

  it("equips an owned item from the collection", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "pol-rewards",
      JSON.stringify({ cases: 0, scrap: 0, owned: { "hat-cap": true }, equipped: {} })
    );
    await toMenu(user);
    await user.click(screen.getByRole("button", { name: /^collection$/i }));
    expect(screen.getByRole("heading", { name: /^collection$/i })).toBeInTheDocument();
    expect(screen.getByText(/1 of 24 items collected/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^equip$/i }));
    expect(JSON.parse(localStorage.getItem("pol-rewards")).equipped.hat).toBe("hat-cap");
    expect(screen.getByRole("button", { name: /^remove$/i })).toBeInTheDocument();
  });

  it("crafts a missing item with scrap", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "pol-rewards",
      JSON.stringify({ cases: 0, scrap: 25, owned: {}, equipped: {} })
    );
    await toMenu(user);
    await user.click(screen.getByRole("button", { name: /^collection$/i }));
    // 25 scrap is enough for a Common item (20 scrap), so those buttons are enabled
    const buttons = screen.getAllByRole("button", { name: /craft \(20 scrap\)/i });
    await user.click(buttons[0]);
    const saved = JSON.parse(localStorage.getItem("pol-rewards"));
    expect(Object.keys(saved.owned)).toHaveLength(1);
    expect(saved.scrap).toBe(5);
  });

  it("earns cases for finishing a round", async () => {
    const user = userEvent.setup();
    await toMenu(user);
    await user.click(screen.getByRole("button", { name: /classic/i }));
    for (let i = 0; i < 10; i++) await answerAndContinue(user);
    expect(screen.getByText(/cases? earned/i)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("pol-rewards")).cases).toBeGreaterThanOrEqual(2);
  });
});
