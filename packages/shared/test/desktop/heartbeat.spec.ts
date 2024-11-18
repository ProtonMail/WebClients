import { getUnixTimeNowTestOnly, isAtLeastDayAgoTestOnly } from '@proton/shared/lib/desktop/heartbeat';

describe('at least one day ago', () => {
    const now = getUnixTimeNowTestOnly();
    const hours = 3600;

    it('should be true for 5 days ago', () => {
        expect(isAtLeastDayAgoTestOnly(now - 5 * 24 * hours)).toBe(true);
    });

    it('should be true for 26 hours ago', () => {
        expect(isAtLeastDayAgoTestOnly(now - 28 * hours)).toBe(true);
    });

    // NOTE: intentionaly we omit 23h,24h,25h values to avoid automatic tests
    // fail twice per year.

    it('should be false for 22 hours ago', () => {
        expect(isAtLeastDayAgoTestOnly(now - 22 * hours)).toBe(false);
    });

    it('should be false for now', () => {
        expect(isAtLeastDayAgoTestOnly(now)).toBe(false);
    });

    it('should be false for 1 hours in future', () => {
        expect(isAtLeastDayAgoTestOnly(now + 1 * hours)).toBe(false);
    });

    it('should be false for 2 days in future', () => {
        expect(isAtLeastDayAgoTestOnly(now + 2 * 24 * hours)).toBe(false);
    });
});
