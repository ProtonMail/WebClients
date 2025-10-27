import { getUnixTime, subDays } from 'date-fns';

import { calculateRotationUpdate } from './tipRotationLogic';

describe('calculateRotationUpdate', () => {
    const tipsLength = 2;

    it('should return a random tip index and current timestamp when rotationDate is 0', () => {
        const result = calculateRotationUpdate(0, 0, tipsLength);

        expect(result).not.toBeNull();
        expect(result?.tipIndex).toBeGreaterThanOrEqual(0);
        expect(result?.tipIndex).toBeLessThan(tipsLength);
        expect(result?.rotationDate).toBeGreaterThan(0);
    });

    it('should return a tip index within bounds for different tip array lengths', () => {
        const tipsLength = 99;
        const result = calculateRotationUpdate(0, 0, tipsLength);

        expect(result).not.toBeNull();
        expect(result?.tipIndex).toBeGreaterThanOrEqual(0);
        expect(result?.tipIndex).toBeLessThan(99);
    });

    describe('Rotation when enough days have passed', () => {
        it('should rotate to next tip when 30 days have passed', () => {
            const oldDate = subDays(new Date(), 30);
            const oldRotationDate = getUnixTime(oldDate);

            const result = calculateRotationUpdate(oldRotationDate, 0, tipsLength);

            expect(result).not.toBeNull();
            expect(result?.tipIndex).toBe(1);
            expect(result?.rotationDate).toBeGreaterThan(oldRotationDate);
        });

        it('should rotate to next tip when more than 30 days have passed', () => {
            const oldDate = subDays(new Date(), 45);
            const oldRotationDate = getUnixTime(oldDate);

            const result = calculateRotationUpdate(oldRotationDate, 0, tipsLength);

            expect(result).not.toBeNull();
            expect(result?.tipIndex).toBe(1);
        });
    });

    describe('No rotation when not enough days have passed', () => {
        it('should return null when only 1 day has passed', () => {
            const recentDate = subDays(new Date(), 1);
            const recentRotationDate = getUnixTime(recentDate);

            const result = calculateRotationUpdate(recentRotationDate, 0, tipsLength);

            expect(result).toBeNull();
        });

        it('should return null when 29 days have passed (just under threshold)', () => {
            const recentDate = subDays(new Date(), 29);
            const recentRotationDate = getUnixTime(recentDate);

            const result = calculateRotationUpdate(recentRotationDate, 0, tipsLength);

            expect(result).toBeNull();
        });

        it('should return null when 0 days have passed (same day)', () => {
            const todayRotationDate = getUnixTime(new Date());

            const result = calculateRotationUpdate(todayRotationDate, 0, tipsLength);

            expect(result).toBeNull();
        });
    });

    describe('Edge cases', () => {
        it('should rotate exactly at the 30-day threshold', () => {
            const exactDate = subDays(new Date(), 30);
            const exactRotationDate = getUnixTime(exactDate);

            const result = calculateRotationUpdate(exactRotationDate, 0, tipsLength);

            expect(result).not.toBeNull();
            expect(result?.tipIndex).toBe(1);
        });

        it('should cycle back to 0 when at the last tip index', () => {
            const oldDate = subDays(new Date(), 30);
            const oldRotationDate = getUnixTime(oldDate);
            const lastTipIndex = tipsLength - 1;

            const result = calculateRotationUpdate(oldRotationDate, lastTipIndex, tipsLength);

            expect(result).not.toBeNull();
            expect(result?.tipIndex).toBe(0);
        });

        it('should handle cycling with different array lengths', () => {
            const oldDate = subDays(new Date(), 30);
            const oldRotationDate = getUnixTime(oldDate);
            const tipLength = 5;
            const lastIndex = 4;

            const result = calculateRotationUpdate(oldRotationDate, lastIndex, tipLength);

            expect(result).not.toBeNull();
            expect(result?.tipIndex).toBe(0);
        });

        it('should correctly increment through all tip indices', () => {
            const oldDate = subDays(new Date(), 30);
            const oldRotationDate = getUnixTime(oldDate);

            let result = calculateRotationUpdate(oldRotationDate, 0, tipsLength);
            expect(result?.tipIndex).toBe(1);

            result = calculateRotationUpdate(oldRotationDate, 1, tipsLength);
            expect(result?.tipIndex).toBe(0);
        });
    });
});
