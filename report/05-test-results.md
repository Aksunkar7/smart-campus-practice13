# 5. Task #05 — The same eight tests on both solutions

## 5.1 How "identical" is guaranteed

The eight cases are declared once, in `shared/testCases.ts`, with their
expected verdict, reason code, criterion and the exact expected sentence. Both
suites import that file. Neither can drift to a kinder expectation, because
neither owns one.

## 5.2 Results

Column **Code-based (observed)** is produced by `npx vitest run`; column
**Low-code (observed)** is produced by typing the inputs into the published
Appsmith app and reading the screen.

| # | Input | Expected verdict | Expected reason code | Code-based (observed) | Low-code (observed) |
|---|---|---|---|---|---|
| T1 | `11:30`, 60 min, not blocked | Available | `OK` | **PASS** — Available / `OK` | **PASS** — Available / `OK` |
| T2 | `10:30`, 60 min, not blocked | Unavailable | `OVERLAP` | **PASS** — Unavailable / `OVERLAP` | **PASS** — Unavailable / `OVERLAP` |
| T3 | `11:30`, 60 min, **blocked** | Unavailable | `ROOM_BLOCKED` | **PASS** — Unavailable / `ROOM_BLOCKED` | **PASS** — Unavailable / `ROOM_BLOCKED` |
| T4 | `11:30`, 0 min, not blocked | Invalid input | `DURATION_OUT_OF_RANGE` | **PASS** — Invalid input / `DURATION_OUT_OF_RANGE` | **PASS** — Invalid input / `DURATION_OUT_OF_RANGE` |
| T5 | `11:30`, 121 min, not blocked | Invalid input | `DURATION_OUT_OF_RANGE` | **PASS** — Invalid input / `DURATION_OUT_OF_RANGE` | **PASS** — Invalid input / `DURATION_OUT_OF_RANGE` |
| T6 | `08:00`, 60 min, not blocked | Invalid input | `START_IN_PAST` | **PASS** — Invalid input / `START_IN_PAST` | **PASS** — Invalid input / `START_IN_PAST` |
| T7 | `11:00`, 60 min, not blocked | Available | `OK` | **PASS** — Available / `OK` | **PASS** — Available / `OK` |
| T8 | run T1–T7, then inspect the booking data | unchanged | — | **PASS** — the single booking is byte-identical, and a write to the frozen snapshot throws `TypeError` | **PASS** — the booking table still shows the single row 10:00 / 11:00 / Faculty meeting |
| | | | **Total** | **8 / 8** | **8 / 8** |

Figures 5.1–5.7 are the published low-code app for cases T1–T7. T8 is evidenced
across all of them: the booking table is visible in every screenshot and is
unchanged after the whole run — one row, 10:00–11:00, Faculty meeting.

![Figure 5.1 — T1, a free interval. Available / `OK`.](report/img/lowcode-T1.png)

![Figure 5.2 — T2, an overlap. Unavailable / `OVERLAP` / AC3, naming the conflicting booking.](report/img/lowcode-T2.png)

![Figure 5.3 — T3, the room-status control on. Unavailable / `ROOM_BLOCKED` / AC4.](report/img/lowcode-T3.png)

![Figure 5.4 — T4, duration 0. Invalid input / `DURATION_OUT_OF_RANGE` / AC2.](report/img/lowcode-T4.png)

![Figure 5.5 — T5, duration 121. The same code, with the received value echoed back.](report/img/lowcode-T5.png)

![Figure 5.6 — T6, a start time in the past. Invalid input / `START_IN_PAST` / AC1.](report/img/lowcode-T6.png)

![Figure 5.7 — T7, an interval that begins exactly when the booking ends. Available / `OK` — the half-open boundary, honoured.](report/img/lowcode-T7.png)

![Figure 5.8 — the code-based solution: 24 assertions across both suites, all passing.](report/img/cb-tests.png)

## 5.3 The automated run

`npx vitest run` executes 24 assertions across the two suites: the eight shared
cases against the code-based solution (plus the frozen-snapshot check), the
same eight against the low-code rule object, and a field-by-field equivalence
check between the two.

```
 RUN  v2.1.9

 ✓ low-code/appsmith/lowcode.parity.test.js (15 tests) 32ms
 ✓ src/lib/shared.contract.test.ts (9 tests) 7ms

 Test Files  2 passed (2)
      Tests  24 passed (24)
   Duration  559ms
```

The equivalence block is the one worth reading, because it is the part that no
amount of careful typing could have guaranteed:

```
 ✓ Equivalence - the two solutions answer identically > T1: code-based output === low-code output
 ✓ Equivalence - the two solutions answer identically > T2: code-based output === low-code output
 …
 ✓ Equivalence - the two solutions answer identically > T7: code-based output === low-code output
```

It compares `available`, `reasonCode`, `ac` **and the visible sentence**. All
seven request-level cases match character for character; T8 is asserted
separately on each side because "the data did not change" is a property of a
run rather than of a single answer.

**What this does and does not establish.** It establishes that the rules
restated inside the Appsmith JS Object are the same rules as the ones in the
frozen engine — the duplication introduced by limitation L1 has not yet caused
a divergence. It establishes nothing about the platform itself. The evidence
that the *application* behaves correctly is the eight manual runs in §5.2 and
their screenshots.

## 5.4 Unresolved defects

| Solution | Unresolved defects after Task #05 | Notes |
|---|---|---|
| Code-based | 0 | 24/24 assertions pass; `tsc --noEmit` reports no errors |
| Low-code | 1 | **X-01** (§7.2.1): the Text widget renders user input as markup instead of escaping it. It does not affect any of the eight functional cases — all eight still pass — and it was found by the security review, not by the test table. Separately, two binding defects were found and fixed during the build, before the test run: `Verdict` initially repeated the whole message instead of the one-word verdict, and the room-status control was first placed as a text label rather than a switch. Both were corrected and re-verified; neither survived into the recorded run. |

\newpage
