import { eachDayOfInterval } from 'date-fns';

import { generateWeekRangesFromDays } from './generateWeekRangesFromDays';

describe('generateWeekRangesFromDays', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2025-10-31T08:00:00Z'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return empty array when all days are in the past', () => {
        const days = [
            new Date('2025-10-01T00:00:00Z'),
            new Date('2025-10-15T00:00:00Z'),
            new Date('2025-10-30T00:00:00Z'),
        ];

        const result = generateWeekRangesFromDays(days);

        expect(result).toHaveLength(0);
    });

    it('should return empty array when given empty array', () => {
        const result = generateWeekRangesFromDays([]);

        expect(result).toHaveLength(0);
    });

    it('should generate single week range for days within same week', () => {
        const days = [
            new Date('2025-11-03T00:00:00Z'),
            new Date('2025-11-04T00:00:00Z'),
            new Date('2025-11-05T00:00:00Z'),
        ];

        const result = generateWeekRangesFromDays(days);

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('start');
        expect(result[0]).toHaveProperty('end');
    });

    it('should generate multiple week ranges for days spanning multiple weeks', () => {
        const days = eachDayOfInterval({
            start: new Date('2025-11-01T00:00:00Z'),
            end: new Date('2025-11-30T00:00:00Z'),
        });

        const result = generateWeekRangesFromDays(days);

        expect(result.length).toBeGreaterThan(1);
        expect(result.length).toBeGreaterThanOrEqual(4);
        expect(result.length).toBeLessThanOrEqual(6);
    });

    it('should filter out past days and only include future weeks', () => {
        const days = eachDayOfInterval({
            start: new Date('2025-10-15T00:00:00Z'),
            end: new Date('2025-11-15T00:00:00Z'),
        });

        const result = generateWeekRangesFromDays(days);
        const now = new Date();

        result.forEach((range) => {
            expect(range.start).toBeGreaterThanOrEqual(Math.floor(now.getTime() / 1000));
        });
    });

    it('should handle current day being in the middle of a week', () => {
        const days = eachDayOfInterval({
            start: new Date('2025-10-26T00:00:00Z'),
            end: new Date('2025-11-08T00:00:00Z'),
        });

        const result = generateWeekRangesFromDays(days);
        const now = new Date();

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].start).toBeGreaterThanOrEqual(Math.floor(now.getTime() / 1000));
    });

    it('should start first week range from now when week start is in the past', () => {
        const days = eachDayOfInterval({
            start: new Date('2025-10-27T00:00:00Z'),
            end: new Date('2025-11-01T23:59:59Z'),
        });

        const result = generateWeekRangesFromDays(days);
        const now = new Date();
        const nowUnix = Math.floor(now.getTime() / 1000);

        expect(result.length).toBeGreaterThan(0);
        expect(result[0].start).toBeGreaterThanOrEqual(nowUnix);
        expect(result[0].start).toBeLessThanOrEqual(nowUnix + 1);
    });

    it('should generate consecutive non-overlapping week ranges', () => {
        const days = eachDayOfInterval({
            start: new Date('2025-11-01T00:00:00Z'),
            end: new Date('2025-12-31T00:00:00Z'),
        });

        const result = generateWeekRangesFromDays(days);

        for (let i = 0; i < result.length - 1; i++) {
            const currentEnd = result[i].end;
            const nextStart = result[i + 1].start;
            expect(nextStart).toBeGreaterThan(currentEnd);
        }
    });
});
