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
