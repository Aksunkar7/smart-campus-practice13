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
