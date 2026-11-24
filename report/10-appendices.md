# Appendix A — Code-based solution, source listings

The complete repository is linked in the front matter. These are the files that carry the behaviour.

## A.1 Fixtures (frozen at Task #01)

*`src/data/samples.ts`*

```ts
// Fixture data for the Smart Campus room availability checker.
//
// FROZEN FOR PRACTICE #13. These are the exact values carried over from the
// baseline recorded in Task #01 (Lesson #08 -> Practice #10 -> Practice #11 ->
// Practice #12). The low-code implementation in /low-code uses byte-identical
// values, so the two solutions are compared on the same data.
//
// All times are integer minutes after midnight (0 = 00:00, 1440 = 24:00).

export interface Booking {
  start: number; // minutes after midnight
  end: number; // minutes after midnight
  bookedBy: string;
}

export const ROOM = {
  name: 'Room 301',
  blocked: false,
  blockReason: undefined as string | undefined,
};

// Existing bookings for Room 301: (600, 660) = 10:00-11:00.
export const BOOKINGS: Booking[] = [
  { start: 600, end: 660, bookedBy: 'Faculty meeting' },
];

// The fixed "current time" used by the checker (540 = 09:00).
export const NOW = 540;

export const DAY_END = 1440;
export const MAX_DURATION = 120;
```

## A.2 The rule engine — reused with no changed line

*`src/lib/bookingRules.ts`*

```ts
// Pure decision rules for the Smart Campus room availability checker.
//
// REUSED VERBATIM in Practice #13. This module is the SOURCE OF TRUTH for
// availability and it is carried over from Practice #10/#11/#12 without a
// single changed line, which is what Task #01 requires ("do not modify the
// booking rules to favor one approach"). Practice #13 adds a validation layer
// ON TOP of it (src/lib/validation.ts); it does not touch the rules.
//
// It contains no I/O, no fixtures and no presentation.

export interface BookingRequest {
  start: number;
  end: number;
}

export interface BookingLike {
  start: number;
  end: number;
  bookedBy: string;
}

export interface RoomLike {
  name: string;
  blocked: boolean;
  blockReason?: string;
}

export interface AvailabilityContext {
  room: RoomLike;
  bookings: readonly BookingLike[];
  now: number;
  dayEnd: number;
  maxDuration: number;
}

export type Rule = 'AC1' | 'AC2' | 'AC3' | 'AC4' | 'OK';

export type DecisionCode =
  | 'ROOM_BLOCKED'
  | 'NOT_INTEGER'
  | 'INVALID_INTERVAL'
  | 'IN_PAST'
  | 'TOO_LONG'
  | 'OVERLAP'
  | 'OK';

export interface Decision {
  available: boolean;
  rule: Rule;
  code: DecisionCode;
  conflict?: BookingLike;
}

/**
 * Overlap of two half-open intervals [aStart, aEnd) and [bStart, bEnd).
 * Comparisons are STRICT, so touching endpoints are NOT an overlap.
 */
export function intervalsOverlap(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Applies the legacy order AC3 -> AC1 -> AC2 -> AC4 and returns exactly one
 * verdict. Nothing in this function writes to its arguments.
 *
 * NOTE on numbering: these AC labels are the numbering used by the project
 * since Lesson #08. Practice #13 introduces its own shared numbering for the
 * two-solution comparison; the mapping between the two is given in
 * report/02-shared-contract.md and applied in src/lib/validation.ts.
 */
export function decideAvailability(
  { start, end }: BookingRequest,
  ctx: AvailabilityContext,
): Decision {
  // legacy AC3 - a blocked room is always unavailable.
  if (ctx.room.blocked) {
    return { available: false, rule: 'AC3', code: 'ROOM_BLOCKED' };
  }

  // legacy AC1 - valid integer interval, and start strictly after now.
  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    return { available: false, rule: 'AC1', code: 'NOT_INTEGER' };
  }
  if (start < 0 || end > ctx.dayEnd || start >= end) {
    return { available: false, rule: 'AC1', code: 'INVALID_INTERVAL' };
  }
  if (start <= ctx.now) {
    return { available: false, rule: 'AC1', code: 'IN_PAST' };
  }

  // legacy AC2 - maximum duration (exactly maxDuration is allowed).
  if (end - start > ctx.maxDuration) {
    return { available: false, rule: 'AC2', code: 'TOO_LONG' };
  }

  // legacy AC4 - reject overlap with any existing booking (touching allowed).
  for (const booking of ctx.bookings) {
    if (intervalsOverlap(start, end, booking.start, booking.end)) {
      return { available: false, rule: 'AC4', code: 'OVERLAP', conflict: booking };
    }
  }

  return { available: true, rule: 'OK', code: 'OK' };
}
```

## A.3 The validation layer — added in Practice #13

*`src/lib/validation.ts`*

```ts
// Practice #13 - the shared input layer.
//
// WHY THIS FILE EXISTS
// Task #02 requires one contract that BOTH the code-based and the low-code
// solution implement: the same inputs (start time, duration, blocked flag,
// fictional bookings), the same outputs (availability boolean, reason code,
// visible message) and the same order of checks. The legacy rule engine in
// ./bookingRules speaks in start/end minutes and in the project's own AC
// numbering, so the translation has to live somewhere. It lives here, and the
// rules themselves are left untouched.
//
// SEPARATION OF CONCERNS (Task #03)
//   validation.ts    - text in, integers out, AC6 feedback          (this file)
//   bookingRules.ts  - pure decision, no I/O, no fixtures           (unchanged)
//   availability.ts  - wiring: fixtures + rules + message           (thin)
//   components/*     - display only, no rule is restated there
//
// ORDER OF CHECKS - identical in both solutions, see report/02-shared-contract.md
//   1. AC6  malformed input        (cannot be parsed at all)
//   2. AC2  duration out of range  (<= 0 or > 120)
//   3. AC4  room blocked           | these three are produced by the
//   4. AC1  start not in the future| untouched legacy engine, in its own
//   5. AC3  overlap                | order AC3 -> AC1 -> AC2 -> AC4
//
// Steps 1 and 2 run before the engine because an input the user can fix
// should be reported as an input error, not as a room-state error.

import { MAX_DURATION } from '@/data/samples';

/** The reason codes of the Practice #13 shared contract. */
export type ReasonCode =
  | 'OK'
  | 'MALFORMED_INPUT'
  | 'DURATION_OUT_OF_RANGE'
  | 'ROOM_BLOCKED'
  | 'START_IN_PAST'
  | 'OUTSIDE_DAY'
  | 'OVERLAP';

/** The acceptance criterion each reason code belongs to (shared numbering). */
export type SharedAc = 'AC1' | 'AC2' | 'AC3' | 'AC4' | 'AC5' | 'AC6' | 'OK';

export const AC_OF: Record<ReasonCode, SharedAc> = {
  OK: 'OK',
  MALFORMED_INPUT: 'AC6',
  DURATION_OUT_OF_RANGE: 'AC2',
  ROOM_BLOCKED: 'AC4',
  START_IN_PAST: 'AC1',
  OUTSIDE_DAY: 'AC1',
  OVERLAP: 'AC3',
};

export interface ParsedRequest {
  ok: true;
  startMinutes: number;
  durationMinutes: number;
}

export interface ParseFailure {
  ok: false;
  code: 'MALFORMED_INPUT' | 'DURATION_OUT_OF_RANGE';
  field: 'start' | 'duration';
  message: string;
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Turns the two raw text inputs into integers, or explains why it cannot.
 * This is the whole of AC6: every rejection carries the offending field and a
 * sentence a student can act on.
 */
export function parseRequest(
  startText: string,
  durationText: string,
): ParsedRequest | ParseFailure {
  const rawStart = String(startText ?? '').trim();
  const match = HHMM.exec(rawStart);
  if (!match) {
    return {
      ok: false,
      code: 'MALFORMED_INPUT',
      field: 'start',
      message: `Invalid input: start time must be in HH:MM 24-hour format (received "${rawStart}").`,
    };
  }

  const rawDuration = String(durationText ?? '').trim();
  if (!/^-?\d+$/.test(rawDuration)) {
    return {
      ok: false,
      code: 'MALFORMED_INPUT',
      field: 'duration',
      message: `Invalid input: duration must be a whole number of minutes (received "${rawDuration}").`,
    };
  }

  const durationMinutes = Number(rawDuration);
  if (durationMinutes <= 0 || durationMinutes > MAX_DURATION) {
    return {
      ok: false,
      code: 'DURATION_OUT_OF_RANGE',
      field: 'duration',
      message: `Invalid input: duration must be between 1 and ${MAX_DURATION} minutes (received ${durationMinutes}).`,
    };
  }

  return {
    ok: true,
    startMinutes: Number(match[1]) * 60 + Number(match[2]),
    durationMinutes,
  };
}
```

## A.4 The wiring layer

*`src/lib/availability.ts`*

```ts
// Wiring layer: fixtures -> validation -> pure rules -> one visible sentence.
//
// It owns no rule of its own. The AC5 guarantee ("display a clear decision
// without changing existing bookings") is enforced the way Practice #11
// established it: the rules never see the live fixtures, only a frozen copy,
// so an accidental write throws a TypeError instead of silently corrupting
// shared data.

import { ROOM, BOOKINGS, NOW, DAY_END, MAX_DURATION } from '@/data/samples';
import {
  decideAvailability,
  intervalsOverlap,
  type AvailabilityContext,
  type Decision,
} from './bookingRules';
import { minutesToLabel } from './time';
import { AC_OF, parseRequest, type ReasonCode, type SharedAc } from './validation';

export { intervalsOverlap, minutesToLabel };

/** The output contract shared with the low-code solution (Task #02). */
export interface CheckOutcome {
  available: boolean;
  reasonCode: ReasonCode;
  ac: SharedAc;
  message: string;
  /** Which input to highlight, when the rejection is an input error (AC6). */
  field?: 'start' | 'duration';
}

/** Inputs the user supplies. `blocked` is the room-status control. */
export interface CheckInput {
  startText: string;
  durationText: string;
  blocked: boolean;
}

/**
 * A frozen, read-only snapshot of the fixtures, rebuilt for every check
 * (Practice #11 mitigation M1, carried forward unchanged).
 */
export function readOnlyContext(blocked: boolean): AvailabilityContext {
  return Object.freeze({
    room: Object.freeze({ ...ROOM, blocked }),
    bookings: Object.freeze(BOOKINGS.map((booking) => Object.freeze({ ...booking }))),
    now: NOW,
    dayEnd: DAY_END,
    maxDuration: MAX_DURATION,
  });
}

/** Translates a legacy engine verdict into a shared-contract reason code. */
function toReasonCode(decision: Decision, end: number): ReasonCode {
  switch (decision.code) {
    case 'ROOM_BLOCKED':
      return 'ROOM_BLOCKED';
    case 'IN_PAST':
      return 'START_IN_PAST';
    case 'OVERLAP':
      return 'OVERLAP';
    case 'TOO_LONG':
      // Unreachable through the UI: the duration range is checked before the
      // engine. Kept as defence in depth, and still exercised directly by the
      // inherited rule-engine suite.
      return 'DURATION_OUT_OF_RANGE';
    case 'INVALID_INTERVAL':
      return end > DAY_END ? 'OUTSIDE_DAY' : 'MALFORMED_INPUT';
    case 'NOT_INTEGER':
      return 'MALFORMED_INPUT';
    default:
      return 'OK';
  }
}

function messageFor(
  code: ReasonCode,
  decision: Decision,
  start: number,
  end: number,
  roomName: string,
  blockReason: string | undefined,
): string {
  const window = `${minutesToLabel(start)}-${minutesToLabel(end)}`;
  switch (code) {
    case 'OK':
      return `Available: ${roomName} is free from ${minutesToLabel(start)} to ${minutesToLabel(end)}.`;
    case 'ROOM_BLOCKED':
      return `Unavailable: ${roomName} is blocked${blockReason ? ` (${blockReason})` : ''} and cannot be booked.`;
    case 'OVERLAP': {
      const c = decision.conflict;
      return c
        ? `Unavailable: ${window} overlaps the existing booking ${minutesToLabel(c.start)}-${minutesToLabel(c.end)} (${c.bookedBy}).`
        : `Unavailable: ${window} overlaps an existing booking.`;
    }
    case 'START_IN_PAST':
      return `Invalid input: start time ${minutesToLabel(start)} is not in the future (current time is ${minutesToLabel(NOW)}).`;
    case 'OUTSIDE_DAY':
      return `Invalid input: ${minutesToLabel(start)} plus ${end - start} minutes runs past the end of the day (24:00).`;
    case 'DURATION_OUT_OF_RANGE':
      return `Invalid input: duration must be between 1 and ${MAX_DURATION} minutes (received ${end - start}).`;
    default:
      return `Invalid input: the request could not be read.`;
  }
}

/**
 * The single entry point the UI calls. Pure: it reads fixtures, writes none.
 */
export function checkAvailability({ startText, durationText, blocked }: CheckInput): CheckOutcome {
  const parsed = parseRequest(startText, durationText);
  if (!parsed.ok) {
    return {
      available: false,
      reasonCode: parsed.code,
      ac: AC_OF[parsed.code],
      message: parsed.message,
      field: parsed.field,
    };
  }

  const start = parsed.startMinutes;
  const end = start + parsed.durationMinutes;
  const ctx = readOnlyContext(blocked);
  const decision = decideAvailability({ start, end }, ctx);
  const reasonCode = toReasonCode(decision, end);

  return {
    available: decision.available,
    reasonCode,
    ac: AC_OF[reasonCode],
    message: messageFor(reasonCode, decision, start, end, ctx.room.name, ctx.room.blockReason),
  };
}
```

## A.5 The eight shared cases — one definition, imported by both suites

*`shared/testCases.ts`*

```ts
// The eight shared test cases of Practice #13, Task #05.
//
// ONE definition, imported by both suites:
//   src/lib/shared.contract.test.ts          -> runs them against the code-based solution
//   low-code/appsmith/lowcode.parity.test.js -> runs them against the low-code rule object
//
// Every expected value below is derived from the acceptance criteria in
// report/02-shared-contract.md, not from the behaviour of either
// implementation. Fixtures: Room 301, one booking 10:00-11:00 (Faculty
// meeting), current time 09:00, maximum duration 120 minutes.

export interface SharedCase {
  id: string;
  title: string;
  startText: string;
  durationText: string;
  blocked: boolean;
  expectAvailable: boolean;
  expectReasonCode: string;
  expectAc: string;
  expectMessage: string;
}

export const SHARED_CASES: SharedCase[] = [
  {
    id: 'T1',
    title: 'valid free interval -> Available',
    startText: '11:30',
    durationText: '60',
    blocked: false,
    expectAvailable: true,
    expectReasonCode: 'OK',
    expectAc: 'OK',
    expectMessage: 'Available: Room 301 is free from 11:30 to 12:30.',
  },
  {
    id: 'T2',
    title: 'overlap with an existing booking -> Unavailable',
    startText: '10:30',
    durationText: '60',
    blocked: false,
    expectAvailable: false,
    expectReasonCode: 'OVERLAP',
    expectAc: 'AC3',
    expectMessage:
      'Unavailable: 10:30-11:30 overlaps the existing booking 10:00-11:00 (Faculty meeting).',
  },
  {
    id: 'T3',
    title: 'blocked room -> Unavailable',
    startText: '11:30',
    durationText: '60',
    blocked: true,
    expectAvailable: false,
    expectReasonCode: 'ROOM_BLOCKED',
    expectAc: 'AC4',
    expectMessage: 'Unavailable: Room 301 is blocked and cannot be booked.',
  },
  {
    id: 'T4',
    title: 'duration = 0 -> validation error',
    startText: '11:30',
    durationText: '0',
    blocked: false,
    expectAvailable: false,
    expectReasonCode: 'DURATION_OUT_OF_RANGE',
    expectAc: 'AC2',
    expectMessage: 'Invalid input: duration must be between 1 and 120 minutes (received 0).',
  },
  {
    id: 'T5',
    title: 'duration = 121 minutes -> validation error',
    startText: '11:30',
    durationText: '121',
    blocked: false,
    expectAvailable: false,
    expectReasonCode: 'DURATION_OUT_OF_RANGE',
    expectAc: 'AC2',
    expectMessage: 'Invalid input: duration must be between 1 and 120 minutes (received 121).',
  },
  {
    id: 'T6',
    title: 'past start time -> validation error',
    startText: '08:00',
    durationText: '60',
    blocked: false,
    expectAvailable: false,
    expectReasonCode: 'START_IN_PAST',
    expectAc: 'AC1',
    expectMessage:
      'Invalid input: start time 08:00 is not in the future (current time is 09:00).',
  },
  {
    id: 'T7',
    title: 'adjacent non-overlapping interval -> Available',
    startText: '11:00',
    durationText: '60',
    blocked: false,
    expectAvailable: true,
    expectReasonCode: 'OK',
    expectAc: 'OK',
    expectMessage: 'Available: Room 301 is free from 11:00 to 12:00.',
  },
];

/** T8 is a property over the whole run, not a single request. */
export const T8_TITLE = 'booking data unchanged after checks';
```

## A.6 The code-based test suite

*`src/lib/shared.contract.test.ts`*

```ts
// Practice #13, Task #05 - the eight shared cases run against the CODE-BASED
// solution. The same cases run against the low-code rule object in
// low-code/appsmith/lowcode.parity.test.js.
//
// Run:  npx vitest run src/lib/shared.contract.test.ts

import { describe, test, expect } from 'vitest';
import { checkAvailability } from './availability';
import { BOOKINGS, ROOM } from '@/data/samples';
import { SHARED_CASES, T8_TITLE } from '../../shared/testCases';

describe('Code-based solution - shared contract T1-T7', () => {
  for (const c of SHARED_CASES) {
    test(`${c.id}: ${c.title}`, () => {
      const out = checkAvailability({
        startText: c.startText,
        durationText: c.durationText,
        blocked: c.blocked,
      });
      expect(out.available).toBe(c.expectAvailable);
      expect(out.reasonCode).toBe(c.expectReasonCode);
      expect(out.ac).toBe(c.expectAc);
      expect(out.message).toBe(c.expectMessage);
    });
  }
});

describe('Code-based solution - AC5', () => {
  test(`T8: ${T8_TITLE}`, () => {
    const before = JSON.stringify({ bookings: BOOKINGS, room: ROOM });

    for (const c of SHARED_CASES) {
      checkAvailability({
        startText: c.startText,
        durationText: c.durationText,
        blocked: c.blocked,
      });
    }

    const after = JSON.stringify({ bookings: BOOKINGS, room: ROOM });
    expect(after).toBe(before);
  });

  test('T8b: the snapshot handed to the rules is frozen, so a write throws', async () => {
    const { readOnlyContext } = await import('./availability');
    const ctx = readOnlyContext(false);
    expect(Object.isFrozen(ctx.bookings)).toBe(true);
    expect(() => {
      (ctx.bookings[0] as { bookedBy: string }).bookedBy = 'tampered';
    }).toThrow(TypeError);
    expect(BOOKINGS[0].bookedBy).toBe('Faculty meeting');
  });
});
```

\newpage

# Appendix B — Low-code solution, the Appsmith JS Object

This is the exact text of the Appsmith JS Object named `Rules`, and the same file imported by the parity suite in Appendix C.

## B.1 `Rules`

*`low-code/appsmith/JSObject_Rules.js`*

```js
/*
 * Smart Campus - Room Availability Checker - LOW-CODE RULE OBJECT
 * =============================================================================
 * Practice #13, Task #04. This is the contents of the Appsmith JS Object named
 * `Rules`; the widget bindings documented in README.md call Rules.check(...).
 *
 * The same file is imported unchanged by lowcode.parity.test.js, so the eight
 * shared test cases run against the exact source that executes inside the
 * platform. There is no second copy of the low-code logic.
 *
 * A measured limitation, recorded rather than worked around: the platform
 * cannot import the project's TypeScript modules, so the fixtures, the overlap
 * predicate and every message string are RESTATED here. The code-based
 * solution has exactly one definition of each; this one is a second definition
 * that nothing but the parity test keeps in step.
 * =============================================================================
 */

export default {
  /* ----------------------------------------------------- frozen fixtures */
  // Identical to src/data/samples.ts. Minutes after midnight.
  NOW: 540, // 09:00
  DAY_END: 1440, // 24:00
  MAX_DURATION: 120,
  ROOM_NAME: 'Room 301',
  BLOCK_REASON: '',
  BOOKINGS: [{ start: 600, end: 660, bookedBy: 'Faculty meeting' }], // 10:00-11:00

  /* ------------------------------------------------------------ helpers */
  label(min) {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  },

  /** Half-open intervals [aStart, aEnd): touching endpoints do NOT overlap. */
  overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  },

  /* ------------------------------------------- 1 & 2: the input contract */
  parse(startText, durationText) {
    const rawStart = String(startText == null ? '' : startText).trim();
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(rawStart)) {
      return {
        ok: false,
        code: 'MALFORMED_INPUT',
        field: 'start',
        message:
          'Invalid input: start time must be in HH:MM 24-hour format (received "' +
          rawStart +
          '").',
      };
    }

    const rawDuration = String(durationText == null ? '' : durationText).trim();
    if (!/^-?\d+$/.test(rawDuration)) {
      return {
        ok: false,
        code: 'MALFORMED_INPUT',
        field: 'duration',
        message:
          'Invalid input: duration must be a whole number of minutes (received "' +
          rawDuration +
          '").',
      };
    }

    const duration = Number(rawDuration);
    if (duration <= 0 || duration > this.MAX_DURATION) {
      return {
        ok: false,
        code: 'DURATION_OUT_OF_RANGE',
        field: 'duration',
        message:
          'Invalid input: duration must be between 1 and ' +
          this.MAX_DURATION +
          ' minutes (received ' +
          duration +
          ').',
      };
    }

    const parts = rawStart.split(':');
    return {
      ok: true,
      startMinutes: Number(parts[0]) * 60 + Number(parts[1]),
      durationMinutes: duration,
    };
  },

  /* ------------------------------------- 3, 4, 5: the availability rules */
  /**
   * Same order as the code-based engine: blocked -> interval -> past ->
   * duration (defence in depth) -> overlap. Reads the fixtures, writes none.
   */
  decide(start, end, blocked) {
    if (blocked) return { available: false, code: 'ROOM_BLOCKED' };
    if (start < 0 || end > this.DAY_END || start >= end)
      return { available: false, code: 'OUTSIDE_DAY' };
    if (start <= this.NOW) return { available: false, code: 'START_IN_PAST' };
    if (end - start > this.MAX_DURATION)
      return { available: false, code: 'DURATION_OUT_OF_RANGE' };

    for (let i = 0; i < this.BOOKINGS.length; i++) {
      const b = this.BOOKINGS[i];
      if (this.overlaps(start, end, b.start, b.end)) {
        return { available: false, code: 'OVERLAP', conflict: b };
      }
    }
    return { available: true, code: 'OK' };
  },

  /* --------------------------------------------------- visible messages */
  message(code, start, end, conflict) {
    const win = this.label(start) + '-' + this.label(end);
    switch (code) {
      case 'OK':
        return (
          'Available: ' + this.ROOM_NAME + ' is free from ' + this.label(start) +
          ' to ' + this.label(end) + '.'
        );
      case 'ROOM_BLOCKED':
        return (
          'Unavailable: ' + this.ROOM_NAME +
          (this.BLOCK_REASON ? ' (' + this.BLOCK_REASON + ')' : '') +
          ' is blocked and cannot be booked.'
        );
      case 'OVERLAP':
        return conflict
          ? 'Unavailable: ' + win + ' overlaps the existing booking ' +
            this.label(conflict.start) + '-' + this.label(conflict.end) +
            ' (' + conflict.bookedBy + ').'
          : 'Unavailable: ' + win + ' overlaps an existing booking.';
      case 'START_IN_PAST':
        return (
          'Invalid input: start time ' + this.label(start) +
          ' is not in the future (current time is ' + this.label(this.NOW) + ').'
        );
      case 'OUTSIDE_DAY':
        return (
          'Invalid input: ' + this.label(start) + ' plus ' + (end - start) +
          ' minutes runs past the end of the day (24:00).'
        );
      case 'DURATION_OUT_OF_RANGE':
        return (
          'Invalid input: duration must be between 1 and ' + this.MAX_DURATION +
          ' minutes (received ' + (end - start) + ').'
        );
      default:
        return 'Invalid input: the request could not be read.';
    }
  },

  AC_OF: {
    OK: 'OK',
    MALFORMED_INPUT: 'AC6',
    DURATION_OUT_OF_RANGE: 'AC2',
    ROOM_BLOCKED: 'AC4',
    START_IN_PAST: 'AC1',
    OUTSIDE_DAY: 'AC1',
    OVERLAP: 'AC3',
  },

  /* ------------------------------------------------- the single entry point */
  /** Returns { available, reasonCode, ac, message, field? }. */
  check(startText, durationText, blocked) {
    const parsed = this.parse(startText, durationText);
    if (!parsed.ok) {
      return {
        available: false,
        reasonCode: parsed.code,
        ac: this.AC_OF[parsed.code],
        message: parsed.message,
        field: parsed.field,
      };
    }

    const start = parsed.startMinutes;
    const end = start + parsed.durationMinutes;
    const d = this.decide(start, end, Boolean(blocked));

    return {
      available: d.available,
      reasonCode: d.code,
      ac: this.AC_OF[d.code],
      message: this.message(d.code, start, end, d.conflict),
    };
  },

  /** Bookings table for the UI, formatted for a Table widget. */
  bookingRows() {
    return this.BOOKINGS.map((b) => ({
      From: this.label(b.start),
      To: this.label(b.end),
      'Booked by': b.bookedBy,
    }));
  },
};
```

\newpage

# Appendix C — The parity and equivalence suite

## C.1 Low-code suite and the code-based/low-code equivalence check

*`low-code/appsmith/lowcode.parity.test.js`*

```js
// Practice #13, Task #05 - the eight shared cases run against the LOW-CODE
// rule object, plus a field-by-field equivalence check between the two
// solutions.
//
// WHAT THIS IS AND IS NOT
// It imports JSObject_Rules.js, which is the exact text pasted into the
// Appsmith JS Object, so the rule logic under test is the platform's own.
// It does NOT exercise Appsmith's widgets, bindings or hosting - those are
// covered by the eight manual UI runs and their screenshots in the report.
//
// Run:  npx vitest run low-code/appsmith/lowcode.parity.test.js

import { describe, test, expect } from 'vitest';
import Rules from './JSObject_Rules.js';
import { checkAvailability } from '../../src/lib/availability';
import { SHARED_CASES, T8_TITLE } from '../../shared/testCases';

describe('Low-code rule object - shared contract T1-T7', () => {
  for (const c of SHARED_CASES) {
    test(`${c.id}: ${c.title}`, () => {
      const out = Rules.check(c.startText, c.durationText, c.blocked);
      expect(out.available).toBe(c.expectAvailable);
      expect(out.reasonCode).toBe(c.expectReasonCode);
      expect(out.ac).toBe(c.expectAc);
      expect(out.message).toBe(c.expectMessage);
    });
  }
});

describe('Low-code rule object - AC5', () => {
  test(`T8: ${T8_TITLE}`, () => {
    const before = JSON.stringify(Rules.BOOKINGS);
    for (const c of SHARED_CASES) {
      Rules.check(c.startText, c.durationText, c.blocked);
    }
    expect(JSON.stringify(Rules.BOOKINGS)).toBe(before);
  });
});

describe('Equivalence - the two solutions answer identically', () => {
  for (const c of SHARED_CASES) {
    test(`${c.id}: code-based output === low-code output`, () => {
      const codeBased = checkAvailability({
        startText: c.startText,
        durationText: c.durationText,
        blocked: c.blocked,
      });
      const lowCode = Rules.check(c.startText, c.durationText, c.blocked);

      expect(lowCode.available).toBe(codeBased.available);
      expect(lowCode.reasonCode).toBe(codeBased.reasonCode);
      expect(lowCode.ac).toBe(codeBased.ac);
      expect(lowCode.message).toBe(codeBased.message);
    });
  }
});
```

\newpage

# Appendix D — Full test transcript

Produced by `npx vitest run --reporter=verbose` on the final version.

```
$ npx vitest run --reporter=verbose

 RUN  v2.1.9 /home/claude/p13

 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T1: valid free interval -> Available
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T2: overlap with an existing booking -> Unavailable
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T3: blocked room -> Unavailable
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T4: duration = 0 -> validation error
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T5: duration = 121 minutes -> validation error
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T6: past start time -> validation error
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - shared contract T1-T7 > T7: adjacent non-overlapping interval -> Available
 ✓ low-code/appsmith/lowcode.parity.test.js > Low-code rule object - AC5 > T8: booking data unchanged after checks
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T1: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T2: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T3: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T4: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T5: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T6: code-based output === low-code output
 ✓ low-code/appsmith/lowcode.parity.test.js > Equivalence - the two solutions answer identically > T7: code-based output === low-code output
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T1: valid free interval -> Available
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T2: overlap with an existing booking -> Unavailable
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T3: blocked room -> Unavailable
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T4: duration = 0 -> validation error
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T5: duration = 121 minutes -> validation error
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T6: past start time -> validation error
 ✓ src/lib/shared.contract.test.ts > Code-based solution - shared contract T1-T7 > T7: adjacent non-overlapping interval -> Available
 ✓ src/lib/shared.contract.test.ts > Code-based solution - AC5 > T8: booking data unchanged after checks
 ✓ src/lib/shared.contract.test.ts > Code-based solution - AC5 > T8b: the snapshot handed to the rules is frozen, so a write throws

 Test Files  2 passed (2)
      Tests  24 passed (24)
   Start at  13:21:04
   Duration  488ms (transform 93ms, setup 0ms, collect 108ms, tests 13ms, environment 0ms, prepare 100ms)
```
