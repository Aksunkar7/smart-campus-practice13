# 2. Task #02 — The shared contract

This section is the **one requirement and acceptance-criteria sheet** that both
solutions implement. It was written before either implementation and neither
was allowed to change it.

## 2.1 User story

> **As a** student at the campus,
> **I want** to enter a future start time and a duration and be told at once
> whether Room 301 is free for that slot,
> **so that** I can plan where to study without contacting the administration
> and without creating a booking I might not need.

## 2.2 Acceptance criteria

| ID | Criterion | Observable behaviour |
|---|---|---|
| **AC1** | Start time must be in the future | A start time at or before the current time (09:00) is rejected; the slot must also end no later than 24:00 |
| **AC2** | Duration must be greater than zero and at most 120 minutes | `0`, a negative number and `121` are rejected; `1` and exactly `120` are accepted |
| **AC3** | Overlapping bookings are unavailable | A slot sharing at least one minute with an existing booking is unavailable; a slot that only touches an endpoint is **not** an overlap |
| **AC4** | Blocked room is unavailable | When the room-status control is on, every request is unavailable regardless of the time asked for |
| **AC5** | Display a clear decision without changing existing bookings | Every check prints one verdict, and the booking data is identical before and after any number of checks |
| **AC6** | Invalid input receives understandable feedback | Input that cannot be read names the offending field and what was expected; the interface stays usable on a narrow screen |

### Note on AC numbering

The inherited engine uses the project's own numbering from Lesson #08, in which
**AC3 is the blocked room and AC4 is the overlap** — the reverse of the sheet
above. The engine was not renumbered, because renumbering it would have edited
the frozen rules. The translation happens in one place, `AC_OF` in
`src/lib/validation.ts`, and in `Rules.AC_OF` in the low-code object:

| Shared sheet (this document) | Legacy engine label | Shared reason code |
|---|---|---|
| AC1 start in the future | `AC1` / `IN_PAST`, `INVALID_INTERVAL` | `START_IN_PAST`, `OUTSIDE_DAY` |
| AC2 duration 1–120 | checked before the engine; `AC2` / `TOO_LONG` kept as defence in depth | `DURATION_OUT_OF_RANGE` |
| AC3 overlap | `AC4` / `OVERLAP` | `OVERLAP` |
| AC4 blocked room | `AC3` / `ROOM_BLOCKED` | `ROOM_BLOCKED` |
| AC5 no change to data | enforced by the frozen snapshot, not a code | — |
| AC6 understandable feedback | not in the engine; added in the validation layer | `MALFORMED_INPUT` |

## 2.3 Inputs

| Input | Type | Control | Fixed value / default |
|---|---|---|---|
| Start time | text, `HH:MM`, 24-hour | single-line text field | default `11:30` |
| Duration | text, whole minutes | single-line text field | default `60` |
| Room blocked | boolean | switch / checkbox | default **off** |
| Existing bookings | fixed fictional data | read-only table | one row: 10:00–11:00, `Faculty meeting` |
| Current time | fixed constant | not editable | 09:00 |

Both solutions take the two time inputs as **text**, not as a numeric or
time-picker widget. A picker would have delegated part of AC6 to the widget and
the two solutions would no longer be exercising the same validation.

## 2.4 Outputs

Every check returns the same three things in both solutions:

| Field | Type | Meaning |
|---|---|---|
| `available` | boolean | `true` only when the slot can be booked |
| `reasonCode` | enum | `OK`, `OVERLAP`, `ROOM_BLOCKED`, `START_IN_PAST`, `OUTSIDE_DAY`, `DURATION_OUT_OF_RANGE`, `MALFORMED_INPUT` |
| `message` | string | one sentence shown to the student |
| `ac` | enum | which criterion decided it — shown next to the message so a marker can trace any screen to this sheet |

The visible messages are fixed by the contract, so that two implementations can
be compared character for character:

| Reason code | Message |
|---|---|
| `OK` | `Available: Room 301 is free from HH:MM to HH:MM.` |
| `OVERLAP` | `Unavailable: HH:MM-HH:MM overlaps the existing booking HH:MM-HH:MM (NAME).` |
| `ROOM_BLOCKED` | `Unavailable: Room 301 is blocked and cannot be booked.` |
| `START_IN_PAST` | `Invalid input: start time HH:MM is not in the future (current time is 09:00).` |
| `OUTSIDE_DAY` | `Invalid input: HH:MM plus N minutes runs past the end of the day (24:00).` |
| `DURATION_OUT_OF_RANGE` | `Invalid input: duration must be between 1 and 120 minutes (received N).` |
| `MALFORMED_INPUT` | `Invalid input: start time must be in HH:MM 24-hour format (received "X").` (and the duration variant) |

## 2.5 Order of checks

Fixed by the contract, because two implementations that evaluate in different
orders can both be "correct" and still disagree on an input that breaks two
rules at once.

1. **AC6** — can the two text fields be read at all?
2. **AC2** — is the duration between 1 and 120?
3. **AC4** — is the room blocked?
4. **AC1** — is the start time in the future and inside the day?
5. **AC3** — does the slot overlap an existing booking?
6. otherwise → available.

Steps 1 and 2 run before the room state deliberately: an input the student can
fix is reported as an input error rather than as a room error. Steps 3–5 are
produced by the untouched engine in its own internal order, which cannot
disagree with this list because the engine is only ever reached once steps 1
and 2 have passed.

## 2.6 Common test inputs, agreed before implementation

| # | Case | Start | Duration | Blocked | Expected verdict | Expected reason code |
|---|---|---|---|---|---|---|
| T1 | valid free interval | `11:30` | `60` | off | Available | `OK` |
| T2 | overlap with existing booking | `10:30` | `60` | off | Unavailable | `OVERLAP` |
| T3 | blocked room | `11:30` | `60` | **on** | Unavailable | `ROOM_BLOCKED` |
| T4 | duration = 0 | `11:30` | `0` | off | Invalid input | `DURATION_OUT_OF_RANGE` |
| T5 | duration = 121 minutes | `11:30` | `121` | off | Invalid input | `DURATION_OUT_OF_RANGE` |
| T6 | past start time | `08:00` | `60` | off | Invalid input | `START_IN_PAST` |
| T7 | adjacent, non-overlapping | `11:00` | `60` | off | Available | `OK` |
| T8 | booking data unchanged after checks | run T1–T7, then inspect the data | | | the single booking is byte-identical | — |

This table exists once, as source, in `shared/testCases.ts`, and both test
suites import it. Neither suite carries its own copy of an expected value.

\newpage
