# 3. Task #03 — The code-based solution

## 3.1 Separation of concerns

The practice asks for validation, availability calculation and display to be
separate. In this repository each lives in its own file and nothing crosses a
boundary:

| Layer | File | Responsibility | May it read fixtures? | May it decide? |
|---|---|---|---|---|
| Input | `src/lib/validation.ts` | text → integers, AC6 feedback | only `MAX_DURATION` | no |
| Rules | `src/lib/bookingRules.ts` | the verdict, pure | **no** — the context is passed in | yes, and only here |
| Wiring | `src/lib/availability.ts` | fixtures → frozen snapshot → rules → one sentence | yes | no |
| Display | `src/components/*.tsx` | render what it is handed | only to list the bookings | no |

The practical test of the separation: `bookingRules.ts` imports nothing at all.
No fixture, no React, no formatting helper. It can be executed by a test with
an invented context, which is exactly how the blocked-room case (T3) is
exercised without ever setting a global flag.

## 3.2 What was reused and what was added

| | |
|---|---|
| **Reused unchanged** | `bookingRules.ts` (the decision), `samples.ts` (the fixtures), `time.ts` (`HH:MM` formatting), and the Practice #11 frozen-snapshot guard that enforces AC5 |
| **Added for Practice #13** | `validation.ts` (the AC6 input layer), the shared output contract in `availability.ts`, a start-time + duration interface, `shared/testCases.ts`, and the eight-case suite |
| **Deliberately left out** | the Practice #12 explanation feature, the Assignment #04 four-room catalogue |

The one behavioural change the new layer introduces is documented rather than
hidden: a request that is **both** out of duration range **and** against a
blocked room now reports the duration error, where the bare engine would have
reported the blocked room. That ordering is written into the shared contract
(§2.5) and the low-code solution follows it too, so it cannot favour either
approach. The engine's own order is untouched and still covered by the
inherited suites.

## 3.3 Responsive interface

One CSS grid, one breakpoint: a single column below 720 px, two columns above.
Inputs use a 16 px font so that mobile Safari does not zoom on focus, the
result banner is full width at every size, and the bookings table is the only
element that could overflow — it is short enough not to.

![Figure 3.1 — the code-based solution at desktop width, served by GitHub Pages. Two columns; the verdict banner spans the full width.](report/img/cb-desktop.png)

![Figure 3.2 — the same page at 375 px. The layout collapses to one column, labels wrap instead of truncating, and nothing is clipped.](report/img/cb-mobile.png)

## 3.4 Code evidence

Full listings are in Appendix A. The three pieces that carry the behaviour:

The overlap predicate, unchanged since Practice #09 — strict comparisons, so
touching endpoints are not an overlap:

```ts
export function intervalsOverlap(aStart, aEnd, bStart, bEnd): boolean {
  return aStart < bEnd && bStart < aEnd;
}
```

The AC5 guard, unchanged since Practice #11 — the rules never see a writable
object, so an accidental write throws instead of corrupting shared data:

```ts
export function readOnlyContext(blocked: boolean): AvailabilityContext {
  return Object.freeze({
    room: Object.freeze({ ...ROOM, blocked }),
    bookings: Object.freeze(BOOKINGS.map((b) => Object.freeze({ ...b }))),
    now: NOW, dayEnd: DAY_END, maxDuration: MAX_DURATION,
  });
}
```

The single entry point the interface calls — parse, decide, describe, and
nothing else:

```ts
export function checkAvailability({ startText, durationText, blocked }: CheckInput): CheckOutcome {
  const parsed = parseRequest(startText, durationText);
  if (!parsed.ok) { /* AC6 / AC2 feedback */ }
  const start = parsed.startMinutes;
  const end = start + parsed.durationMinutes;
  const decision = decideAvailability({ start, end }, readOnlyContext(blocked));
  const reasonCode = toReasonCode(decision, end);
  return { available: decision.available, reasonCode, ac: AC_OF[reasonCode], message: /* … */ };
}
```

## 3.5 Running result

```
$ npx tsc --noEmit
(exit 0; no output means no type errors)

$ npm run build
✓ 39 modules transformed.
docs/index.html                   0.44 kB │ gzip:  0.30 kB
docs/assets/index-*.css           3.00 kB │ gzip:  1.13 kB
docs/assets/index-*.js          149.58 kB │ gzip: 48.24 kB
✓ built in 796ms
```

The build output is written to `docs/` on purpose, so that GitHub Pages can
serve the live demo straight from the repository with no deployment pipeline
and no second account.

\newpage
