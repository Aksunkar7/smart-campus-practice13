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
