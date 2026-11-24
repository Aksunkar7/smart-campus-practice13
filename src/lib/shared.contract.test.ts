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
