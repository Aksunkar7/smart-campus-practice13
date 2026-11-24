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
