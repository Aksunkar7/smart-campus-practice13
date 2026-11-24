# Smart Campus Room Availability Checker — Practice #13

Comparing a **code-based** and a **low-code** implementation of the same
feature, on the same acceptance criteria, with the same eight tests.

| | |
|---|---|
| Course | AI-Driven Software Engineering, KBTU |
| Student | Myktybek Aksungkar — 24B031908 |
| Classes | Tuesday, 13:00–16:00 |
| AI tool | Claude (Anthropic), model Claude Opus 5 |

## Live demos

| | |
|---|---|
| Code-based (GitHub Pages) | _add after enabling Pages_ |
| Low-code (Appsmith, published) | _add after publishing_ |

## The scenario

One fictional room, `Room 301`, with one existing booking 10:00–11:00. A
student enters a future start time and a duration; the system answers
**Available** or **Unavailable** with a reason. No login, no database, no real
personal data.

Six acceptance criteria, one shared contract, two implementations:
[`report/02-shared-contract.md`](report/02-shared-contract.md).

## Layout

```
src/data/samples.ts                      fixtures, frozen at Task #01
src/lib/bookingRules.ts                  the rule engine — reused with no changed line
src/lib/validation.ts                    input layer added in Practice #13 (AC6)
src/lib/availability.ts                  wiring: frozen snapshot -> rules -> one sentence
src/lib/shared.contract.test.ts          the eight shared cases, code-based side
src/components/                          display only; no rule is restated here
shared/testCases.ts                      the eight cases — one definition, both suites import it
low-code/appsmith/JSObject_Rules.js      the exact text pasted into the Appsmith JS Object
low-code/appsmith/lowcode.parity.test.js the same eight cases + code/low-code equivalence
low-code/appsmith/README.md         how the low-code app was assembled
low-code/appsmith/export/                the Appsmith application export
report/                                  the submission report, section by section
docs/                                    production build, served by GitHub Pages
evidence/                                raw terminal transcripts
```

## Commands

```bash
npm install          # dependencies
npm test             # all 24 assertions, both solutions
npm run test:shared  # the eight cases against the code-based solution
npm run test:parity  # the eight cases against the low-code rule object + equivalence
npm run typecheck    # tsc --noEmit
npm run build        # production build into docs/ (what GitHub Pages serves)
npm run dev          # local preview
./build-report.sh    # regenerate the .docx and .pdf from report/*.md
```

## Why the build output is committed

`vite.config.ts` writes the production build to `docs/` so GitHub Pages can
serve the live demo straight from the repository (Settings → Pages → Deploy
from a branch → `main` / `/docs`). No CI, no second account, no hosting bill.

## What the tests prove

`npm test` runs 24 assertions: the eight shared cases against the code-based
solution, the same eight against the low-code rule object, and a field-by-field
equivalence check between the two — including the visible sentence. The two
implementations answer identically on every case.

What it does **not** prove: that the Appsmith *application* works. The platform
has no test runner, so that evidence is eight manual UI runs and their
screenshots, in `report/05-test-results.md`.
