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
