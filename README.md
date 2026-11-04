# 🎣 Phish or Legit?

A free browser game that teaches people to spot scams. Read a realistic email, text, DM or marketplace message, decide if it's a phish or legit, then learn the red flags and what to do next. No account, no sign-up, about 2 minutes to play.

**[▶ Play it live](LIVE_LINK_HERE)** · Built with React and Vite

## Screenshots

| Menu | Question | Results |
| --- | --- | --- |
| ![Menu](screenshots/menu.png) | ![Question](screenshots/question.png) | ![Results](screenshots/results.png) |

## Why I built it

I'm a cyber security student, and most scam awareness material is a wall of text. I wanted something people would actually finish, and I wanted to practise shipping a real project end to end: design, code, deployment and a security review.

## Features

- **Four game modes**
  - **Daily Challenge:** 5 questions, the same for everyone each day, one try
  - **Classic:** 10 random scenarios from the pool
  - **Timed Mode:** 15 seconds per question, and running out of time counts as wrong
  - **Red Flag Hunt:** pick the real warning sign out of four options
- **50 fictional scenarios** across email, SMS, Instagram-style DMs and marketplace messages, with easy, medium and hard difficulty
- **Learning after every answer:** the red flags (or safe signs) are highlighted and explained
- **"What to do next" steps** after each scam, with links to Scamwatch, ReportCyber and IDCARE
- **Polish:** animated intro and menu, a rotating teaser card, confetti on a perfect score, and a "How it works" panel

## How it works

- **Scenarios** live in JSON files in `src/data/`. Each has a type, difficulty, sender, body, an optional fake link, the answer, red flags or safe signs, and an explanation.
- **Daily Challenge** has no server. A seeded random number generator (mulberry32) is seeded from the date, so everyone gets the same 5 questions. The code replays each day since a start date and excludes the previous day's questions, so a set never repeats two days in a row.
- **Red Flag Hunt** shows one real red flag from the scam plus three decoys taken from the safe signs of legit scenarios.
- **Timed Mode** uses a one-second countdown that marks the question wrong when it reaches zero.

## Tech stack

React, Vite, plain CSS, ESLint, GitHub, and Vercel for hosting.

## Run it locally

```bash
git clone https://github.com/1m33mam31/phish-or-legit.git
cd phish-or-legit
npm install
npm run dev
```

To make a production build, run `npm run build`.

## Project structure

```
src/
├── App.jsx                 game logic, modes and screens
├── App.css                 styles and animations
└── data/
    ├── scenarios.json      scenarios 1-10
    └── scenarios-more.json scenarios 11-50
```

## Security and privacy

| Area | What I did |
| --- | --- |
| Personal data | No accounts, no forms and no analytics or tracking code in the app. The host keeps standard server logs. |
| Stored data | Only today's Daily result (date and score) is saved, in the visitor's own browser (`localStorage`). |
| Malicious links | Every scam link in the game is plain text on a reserved `.example` domain and cannot be clicked. |
| Injection | Scenarios are static JSON rendered as text by React. There is no user-generated content and no `dangerouslySetInnerHTML`. |
| External links | Real help links open in a new tab with `rel="noopener noreferrer"`. |
| Secrets | No API keys, environment variables or backend. |
| Dependencies | Managed with npm and a lockfile. `npm audit` warnings: STATUS_HERE |

**Planned:** security headers and a Content Security Policy, automated tests, and an accessibility pass.

## Content and sources

- The scenarios are **fictional**, written from common scam types seen in Australia. Brand names appear only to make the examples realistic and the game is not affiliated with any of them.
- The "What to do next" guidance follows the reporting advice on these pages (checked November 2026):
  - [Scamwatch: report a scam](https://www.scamwatch.gov.au/report-a-scam)
  - [Scamwatch: what to do if you've been scammed](https://www.scamwatch.gov.au/stop-check-protect/what-to-do-if-youve-been-scammed)
  - [ReportCyber: recover from scams](https://www.cyber.gov.au/report-and-recover/recover-from/scams)
  - [IDCARE](https://www.idcare.org)
- ACMA text forwarding number: CHECK_BEFORE_PUBLISHING

## What I learned

- Building a shared daily puzzle without a backend, using seeded randomness
- Managing React state, timers and effect cleanup
- Writing security guidance in plain language people will actually read
- Going from local code to a live site with Git, GitHub and Vercel
- Designing for privacy by collecting nothing

## Roadmap

- Security headers and a Content Security Policy
- Tests for the scoring and daily logic
- Accessibility improvements (keyboard use, contrast, screen readers)
- More scenarios and categories
- A feedback form

## Disclaimer

This is an educational project and not professional advice. If you think you've been scammed, contact your bank first, then report it to Scamwatch and ReportCyber.

## Author

**YOUR_NAME**, cyber security student · [LinkedIn](LINKEDIN_LINK_HERE)
