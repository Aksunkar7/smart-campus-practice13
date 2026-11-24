# 6. Task #06 — Engineering effort

## 6.1 How the numbers were obtained

Two kinds of number appear below and they are kept apart on purpose.

- **Measured by a tool** — printed by `npm`, `vitest`, `tsc` or `vite`. These
  are reproducible: anyone can re-run the command and get the same figure.
- **Measured by the clock** — wall-clock minutes spent by the student on one
  phase, noted at the time. These are honest but not reproducible.

Nothing in this section is an estimate of how long something "should" take.
Where a figure was not measured it is marked, not guessed.

## 6.2 Tool-measured figures

| Figure | Code-based | Low-code | Source |
|---|---|---|---|
| Dependency install | 99 packages, pinned by `package-lock.json` | not applicable — nothing is installed | `npm install` |
| Full test run | 0.56 s, 24 assertions | no test runner exists in the platform (L2) | `npx vitest run` |
| Type check | 0 errors | not available — expressions are checked at runtime (L5) | `npx tsc --noEmit` |
| Production build | 0.80 s → 153 kB, 48 kB gzipped | no build step; the app is interpreted by the platform | `npm run build` |
| Dependency audit | 6 advisories (3 moderate, 1 high, 2 critical), all dev-only (§7.4) | no equivalent command exists | `npm audit` |
| Repair cycles needed to reach all-green | **0** — every suite passed on its first run | **2** — the `Verdict` binding and the room-status widget (§5.4) | observation |

## 6.3 Clock-measured figures

Wall-clock intervals recorded during the working session and rounded to five
minutes. They cover my own hands-on time only.

| Phase | Code-based | Low-code |
|---|---|---|
| **Setup** — account, project, dependencies ready to work in | **15** min | **10** min |
| **Implementation** — until the feature existed | **0** min | **20** min |
| **Debugging** — until it behaved | **0** min | **5** min |
| **Testing** — running the eight cases and recording them | **10** min | **10** min |
| **Total** | **25** min | **45** min |

**Setup.** Code-based: create the public repository, push, enable GitHub Pages,
confirm the demo loads. Low-code: create the account and an empty application.

**Implementation, and why the code-based figure is zero.** It is zero because I
authored no code in this practice: the implementation arrived complete and my
work on it was review rather than typing. Read as "coding is free" the number
would be dishonest. Read as "the authoring effort sits outside this table" it
is accurate, and it is the reason §6.6 does not treat the totals as a verdict
on which approach is faster to build.

**Debugging.** Code-based: none — every suite passed on its first run.
Low-code: two binding defects, both found by looking at the screen (§5.4).

**Testing.** Code-based: `npm install`, `npm test`, and capturing the result.
Low-code: eight cases entered by hand, eight screenshots, plus publishing and
exporting. The two numbers are equal once — and only once.

## 6.4 Acceptance tests passed and defects left

| | Code-based | Low-code |
|---|---|---|
| Shared cases passed | **8 / 8** (automated, 24 assertions) | **8 / 8** (manual UI runs, Figures 5.1–5.7) |
| Criteria covered by an automated test | 6 / 6 | 0 / 6 inside the platform; 6 / 6 for the rule logic, executed outside it (§5.3) |
| Unresolved defects | 0 | 1 — finding X-01, output encoding (§7.2.1). Two build-time binding defects were fixed before the test run (§5.4) |

## 6.5 Review, export and version control

| | Code-based | Low-code |
|---|---|---|
| **How a change is reviewed** | `git diff` on the file that changed; a one-line rule change shows as one line | the reviewable artefact is a generated application JSON, so a one-line rule change is not a one-line diff (L3) |
| **What is exported** | the whole repository, plus a static build in `docs/` that any web server can serve | one application JSON, which describes the app rather than being it (L4) |
| **Version control** | Git, full history, branches, blame, pull requests | Offered — the app settings carry a **Connect Git** control next to an environment selector reading *Production*, so version control is offered on the account; it was not connected for this submission. The artefact under version control would be the generated JSON, not the source as written (L3) |
| **Can it run elsewhere?** | yes — the build is plain HTML, CSS and JavaScript | no — it needs Appsmith to interpret it |
| **Who can change production** | whoever can merge to the default branch | whoever can press **Deploy** in the workspace |

## 6.6 What the effort numbers do not say

The totals say 25 against 45, and that is the least useful number in this
section. Strip the phase that is not comparable — implementation, which was
zero on one side only because the code was generated — and the honest reading
is that the two approaches cost about the same to stand up, and diverge
entirely afterwards.

What the phases do say is this. Setup was cheaper on the low-code side: no
repository, no hosting decision, no dependency tree. Debugging was cheaper on
the code-based side, where it was free, because nothing needed fixing and a
test would have said so if it had. And testing cost ten minutes on both — but
on the code-based side those ten minutes bought a 0.56-second command that can
be re-run after every future change, while on the low-code side they bought one
run, and the next change costs ten minutes again.

That is the asymmetry §8 turns into a recommendation: the cost is not in
building either of these, it is in changing them.

\newpage
