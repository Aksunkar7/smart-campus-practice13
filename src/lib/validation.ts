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
