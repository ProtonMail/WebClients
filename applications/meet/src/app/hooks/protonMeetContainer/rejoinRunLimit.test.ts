import { MINUTE, SECOND } from '@proton/shared/lib/constants';

import { canStartAutomaticRejoinRun, recordAutomaticRejoinRunStart } from './rejoinRunLimit';

const recordStarts = (startTimesMs: number[]) =>
    startTimesMs.reduce<readonly number[]>(
        (recorded, startTimeMs) => recordAutomaticRejoinRunStart(recorded, startTimeMs),
        []
    );

describe('rejoinRunLimit', () => {
    it('allows a run when none started yet', () => {
        expect(canStartAutomaticRejoinRun([], 0)).toBe(true);
    });

    it('allows a third run within 2 minutes', () => {
        expect(canStartAutomaticRejoinRun(recordStarts([0, 30 * SECOND]), MINUTE)).toBe(true);
    });

    it('refuses a fourth run within 2 minutes of the oldest counted one', () => {
        const recorded = recordStarts([0, 30 * SECOND, MINUTE]);

        expect(canStartAutomaticRejoinRun(recorded, 2 * MINUTE - 1)).toBe(false);
    });

    it('allows a fourth run once the oldest counted one is 2 minutes old', () => {
        const recorded = recordStarts([0, 30 * SECOND, MINUTE]);

        expect(canStartAutomaticRejoinRun(recorded, 2 * MINUTE)).toBe(true);
    });

    it('keeps counting the runs still inside the window after an older one drops out', () => {
        const recorded = recordStarts([0, 30 * SECOND, MINUTE, 2 * MINUTE]);

        expect(canStartAutomaticRejoinRun(recorded, 2 * MINUTE + 1)).toBe(false);
        expect(canStartAutomaticRejoinRun(recorded, 2 * MINUTE + 30 * SECOND)).toBe(true);
    });

    it('forgets runs that left the window when recording a new one', () => {
        expect(recordStarts([0, 30 * SECOND, 3 * MINUTE])).toEqual([3 * MINUTE]);
    });
});
