# 1. Task #01 — Freeze the baseline

## 1.1 What was opened

The code-based Smart Campus checker as it stood at the end of Practice #12:

| | |
|---|---|
| Project | Smart Campus Room Availability Checker |
| Host | Bolt.new, project `73069790` |
| Published demo | <https://smart-campus-room-ch-3hhx.bolt.host> |
| Stack | Vite + React + TypeScript, Vitest 2.1.9 |
| Lineage | Lesson #08 → Practice #09 (defect injection) → Practice #10 (rule extraction) → Assignment #04 (room catalogue) → Practice #11 (risk audit, AC5 freeze guard) → Practice #12 (explanation feature) |

Practice #13 takes the **rule engine** from that project and nothing else. The
explanation feature of Practice #12 is explicitly out of scope for this
practice, and the four-room catalogue from Assignment #04 is not used either:
the shared scenario is one fictional room.

## 1.2 Booking data recorded at the freeze

Carried over byte for byte into both solutions. All times are integer minutes
after midnight.

| Item | Value |
|---|---|
| Room | `Room 301` |
| Blocked | `false` by default; the room-status control toggles it |
| Existing bookings | exactly one: `600 → 660` (10:00–11:00), booked by `Faculty meeting` |
| Current time (`NOW`) | `540` (09:00) |
| End of day (`DAY_END`) | `1440` (24:00) |
| Maximum duration | `120` minutes |

Source of truth: `src/data/samples.ts`, reproduced in Appendix A. The low-code
rule object restates the same five values; the parity test in §5.3 is what
keeps the two copies honest.

## 1.3 Expected behaviour recorded at the freeze

The engine evaluates in the order **blocked → interval validity → start in the
past → maximum duration → overlap**, returns exactly one verdict, and writes to
nothing. Intervals are **half-open** `[start, end)`, so a request that begins
exactly when a booking ends does **not** overlap it — the behaviour fixed in
Practice #09 and pinned ever since.

## 1.4 Baseline checks

The inherited suites were run before any Practice #13 file was written.

The whole inherited suite was green at the freeze: **7 test files, 83 tests
passing** in 12.63 s — the Practice #10 rule suite (23), the Lesson #07/#08
availability suites (19 + 5), the Practice #11 AC5 guard (5), the refactoring
equivalence check against the frozen snapshot (2), the Practice #12 explanation
suite (28) and one reproduction case.

![Figure 1.1 — baseline test run on the frozen Practice #12 project: 7 files, 83 tests, all passing.](report/img/baseline-tests.png)

![Figure 1.2 — the published baseline prototype. Note the interface: the request is entered as a start and an end in integer minutes. Practice #13 changes that to a start time and a duration because Task #02 defines the inputs that way; the rules underneath are untouched.](report/img/baseline-app.png)

The second figure also confirms the fixture values recorded above, as the
baseline itself displays them: `Now: 540 min (09:00)`, one existing booking
`10:00–11:00 (600–660 min)` by `Faculty meeting`, start strictly after now, and
a maximum of 120 minutes after start.

## 1.5 The rule that was not bent

The practice instructions say: *do not modify the booking rules to favor one
approach.* This was held to literally. `src/lib/bookingRules.ts` in the
Practice #13 repository is the Practice #12 file with **no changed line** —
same signatures, same order of checks, same strict comparisons in
`intervalsOverlap`. Everything Practice #13 adds sits **above** it in
`src/lib/validation.ts`, and the low-code object reproduces that same combined
behaviour rather than a convenient subset of it. §5.3 proves the two agree
character for character on all eight cases.

\newpage
