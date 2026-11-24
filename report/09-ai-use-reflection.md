# 9. AI-use reflection

## 9.1 Declaration

| | |
|---|---|
| **Tool** | Claude (Anthropic) |
| **Model / version** | Claude Opus 5 (`claude-opus-5`) |
| **Used for** | drafting the shared contract, the code-based implementation and its test suite, the low-code rule object, and a first draft of this report |
| **Not used for** | the Appsmith account, canvas, bindings, deployment and export; the eight manual UI runs; the screenshots; the clock measurements in §6.3; the platform observations in §4.3 |
| **Access granted to the tool** | the practice brief and the project files only — no account, no credential, no repository write access. Every change was applied and reviewed by me. |

## 9.2 Reflection

All the browser work was done by me. I created the public repository, pushed
the code, enabled GitHub Pages and checked the live demo; locally I ran
`npm install` and `npm test` — 24 assertions, green on the first attempt — and
captured the terminal, the desktop layout and the mobile layout at 375 px. The
low-code part is entirely mine: registering with Appsmith, creating the
application, pasting in the `Rules` JS Object, configuring ten widgets with
their names and bindings, publishing, opening public access and checking it in
a private window, eight functional runs with eight screenshots, and the JSON
export. For the baseline I opened the frozen Practice #12 project and captured
the test run (7 files, 83 tests) and the published application, changing
nothing in it.

Along the way I fixed two defects in the specification I had been given: the
`Verdict` widget printed the whole message instead of a single word, and the
room-status control was described in a way that made it appear as a text label
with no switch — without that fix, case T3 would not have passed. The written
Appsmith instructions were simply wrong in one place: I found the widget panel
myself, it is on the left, not on the right.

I required that the session link and the prompts be removed from the
repository, that the report not be pushed until it was finished, and that the
timings keep only durations without absolute times; I then found the same
unfilled placeholders still present in the markdown sources and in the guide,
which is why the repository was recreated from scratch. I filled the cells
about the platform's capabilities with my own observations in the product
rather than with general knowledge, and it was my XSS probe in the low-code
application that produced finding X-01 — the strongest result of the whole
piece of work.

## 9.3 Verification applied to the generated code

Independent of who wrote it, every claim in this report rests on something
re-runnable:

| Claim | How it was verified |
|---|---|
| The rule engine is unchanged from Practice #12 | file compared against the frozen project; no changed line |
| The two solutions agree | 7 field-by-field equivalence assertions, including the visible sentence (§5.3) |
| All six criteria hold | 24 assertions, `npx vitest run`, 0.56 s |
| No type errors | `npx tsc --noEmit`, exit 0 |
| The application builds and runs | `npm run build`, and the published demos |
| The low-code app behaves correctly | eight manual UI runs with screenshots (§5.2) |

\newpage
