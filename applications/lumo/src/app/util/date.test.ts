import type { SortOrder } from './date';
import { dateIsoToHuman, dateToUnixTimestamp, isoToUnixTimestamp, sleep, sortByDate } from './date';

describe('Date utilities', () => {
    describe('dateIsoToHuman', () => {
        it('should format ISO date string to human readable format', () => {
            const isoDate = '2023-12-25T15:30:45.000Z';
            const result = dateIsoToHuman(isoDate);
            expect(result).toBe('25 Dec, 15:30');
        });

        it('should handle single digit days and times with leading zeros', () => {
            const isoDate = '2023-01-05T09:05:00.000Z';
            const result = dateIsoToHuman(isoDate);
            expect(result).toBe('5 Jan, 09:05');
        });

        it('should handle end of month dates', () => {
            const isoDate = '2023-02-28T23:59:59.000Z';
            const result = dateIsoToHuman(isoDate);
            expect(result).toBe('28 Feb, 23:59');
        });

        it('should handle leap year dates', () => {
            const isoDate = '2024-02-29T12:00:00.000Z';
            const result = dateIsoToHuman(isoDate);
            expect(result).toBe('29 Feb, 12:00');
        });
    });

    describe('isoToUnixTimestamp', () => {
        it('should convert ISO string to Unix timestamp in seconds', () => {
            const isoDate = '2023-01-01T00:00:00.000Z';
            const result = isoToUnixTimestamp(isoDate);
            expect(result).toBe(1672531200);
        });

        it('should handle ISO string with timezone offset', () => {
            const isoDate = '2023-01-01T02:00:00+02:00';
            const result = isoToUnixTimestamp(isoDate);
            expect(result).toBe(1672531200); // Should be same as UTC midnight
        });

        it('should handle ISO string with milliseconds', () => {
            const isoDate = '2023-01-01T00:00:00.500Z';
            const result = isoToUnixTimestamp(isoDate);
            expect(result).toBe(1672531200); // Should floor the result
        });

        it('should return integer timestamp', () => {
            const isoDate = '2023-01-01T00:00:00.999Z';
            const result = isoToUnixTimestamp(isoDate);
            expect(Number.isInteger(result)).toBe(true);
        });
    });

    describe('dateToUnixTimestamp', () => {
        it('should convert Date instance to Unix timestamp in seconds', () => {
            const date = new Date('2023-01-01T00:00:00.000Z');
            const result = dateToUnixTimestamp(date);
            expect(result).toBe(1672531200);
        });

        it('should return an integer timestamp', () => {
            const date = new Date('2023-01-01T00:00:00.500Z'); // with milliseconds
            const result = dateToUnixTimestamp(date);
            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBe(1672531200); // should floor the result
        });

        it('should handle dates with milliseconds by flooring', () => {
            const date = new Date('2023-01-01T00:00:00.999Z');
            const result = dateToUnixTimestamp(date);
            expect(result).toBe(1672531200); // should not round up
        });

        it('should handle current date', () => {
            const now = new Date();
            const result = dateToUnixTimestamp(now);
            const expected = Math.floor(now.getTime() / 1000);
            expect(result).toBe(expected);
        });

        it('should handle past dates', () => {
            const pastDate = new Date('1990-05-15T10:30:45.123Z');
            const result = dateToUnixTimestamp(pastDate);
            expect(result).toBe(642767445);
        });

        it('should handle future dates', () => {
            const futureDate = new Date('2030-12-31T23:59:59.999Z');
            const result = dateToUnixTimestamp(futureDate);
            expect(result).toBe(1924991999);
        });

        it('should handle Unix epoch start date', () => {
            const epochStart = new Date('1970-01-01T00:00:00.000Z');
            const result = dateToUnixTimestamp(epochStart);
            expect(result).toBe(0);
        });

        it('should handle dates before Unix epoch (negative timestamps)', () => {
            const preEpoch = new Date('1969-12-31T23:59:59.000Z');
            const result = dateToUnixTimestamp(preEpoch);
            expect(result).toBe(-1);
        });

        it('should handle leap year dates', () => {
            const leapDate = new Date('2024-02-29T12:00:00.000Z');
            const result = dateToUnixTimestamp(leapDate);
            expect(result).toBe(1709208000);
        });

        it('should handle different timezones consistently', () => {
            // Same moment in time, different timezone representations
            const utcDate = new Date('2023-06-15T14:30:00.000Z');
            const offsetDate = new Date('2023-06-15T16:30:00.000+02:00');

            const utcResult = dateToUnixTimestamp(utcDate);
            const offsetResult = dateToUnixTimestamp(offsetDate);

            expect(utcResult).toBe(offsetResult);
        });

        it('should handle Date constructed from timestamp', () => {
            const originalTimestamp = 1672531200;
            const date = new Date(originalTimestamp * 1000);
            const result = dateToUnixTimestamp(date);
            expect(result).toBe(originalTimestamp);
        });

        it('should handle invalid dates', () => {
            const invalidDate = new Date('invalid-date-string');
            const result = dateToUnixTimestamp(invalidDate);
            expect(isNaN(result)).toBe(true);
        });

        it('should be consistent with multiple calls', () => {
            const date = new Date('2023-07-04T16:45:30.250Z');
            const result1 = dateToUnixTimestamp(date);
            const result2 = dateToUnixTimestamp(date);
            expect(result1).toBe(result2);
        });

        it('should handle extreme future dates', () => {
            const farFuture = new Date('2099-12-31T23:59:59.999Z');
            const result = dateToUnixTimestamp(farFuture);
            expect(typeof result).toBe('number');
            expect(Number.isInteger(result)).toBe(true);
            expect(result).toBe(4102444799);
        });

        it('should match Math.floor behavior explicitly', () => {
            const date = new Date('2023-01-01T00:00:00.750Z');
            const result = dateToUnixTimestamp(date);
            const expected = Math.floor(date.getTime() / 1000);
            expect(result).toBe(expected);
        });

        it('should ceil timestamp when ceil option is true', () => {
            const isoString = '2023-01-01T00:00:00.500Z'; // has milliseconds
            const result = isoToUnixTimestamp(isoString, { ceil: true });
            expect(result).toBe(1672531201); // should round up
        });

        it('should floor timestamp when ceil option is false', () => {
            const isoString = '2023-01-01T00:00:00.500Z'; // has milliseconds
            const result = isoToUnixTimestamp(isoString, { ceil: false });
            expect(result).toBe(1672531200); // should round down
        });

        it('should floor timestamp when ceil option is not provided (default)', () => {
            const isoString = '2023-01-01T00:00:00.999Z';
            const result = isoToUnixTimestamp(isoString);
            expect(result).toBe(1672531200); // should use default floor behavior
        });

        it('should return same result for whole seconds regardless of ceil option', () => {
            const isoString = '2023-01-01T00:00:00.000Z'; // no milliseconds
            const floorResult = isoToUnixTimestamp(isoString, { ceil: false });
            const ceilResult = isoToUnixTimestamp(isoString, { ceil: true });

            expect(floorResult).toBe(ceilResult);
            expect(floorResult).toBe(1672531200);
        });

        it('should throw error for invalid ISO string regardless of ceil option', () => {
            const invalidIso = 'invalid-date';

            expect(() => isoToUnixTimestamp(invalidIso, { ceil: true })).toThrow('invalid iso date: invalid-date');

            expect(() => isoToUnixTimestamp(invalidIso, { ceil: false })).toThrow('invalid iso date: invalid-date');
        });
    });

    describe('sleep', () => {
        it('should resolve after specified milliseconds', async () => {
            const startTime = Date.now();
            await sleep(100);
            const endTime = Date.now();
            const elapsed = endTime - startTime;

            // Allow for some timing variance in test environment
            expect(elapsed).toBeGreaterThanOrEqual(90);
            expect(elapsed).toBeLessThan(150);
        });

        it('should resolve immediately with 0 milliseconds', async () => {
            const startTime = Date.now();
            await sleep(0);
            const endTime = Date.now();
            const elapsed = endTime - startTime;

            expect(elapsed).toBeLessThan(10);
        });
    });

    describe('sortByDate', () => {
        const testData = [
            { id: 1, createdAt: '2023-01-01T00:00:00.000Z', name: 'First' },
            { id: 2, createdAt: '2023-01-03T00:00:00.000Z', name: 'Third' },
            { id: 3, createdAt: '2023-01-02T00:00:00.000Z', name: 'Second' },
        ];

        it('should sort in descending order by default createdAt field', () => {
            const sorted = [...testData].sort(sortByDate('desc'));
            expect(sorted).toEqual([
                { id: 2, createdAt: '2023-01-03T00:00:00.000Z', name: 'Third' },
                { id: 3, createdAt: '2023-01-02T00:00:00.000Z', name: 'Second' },
                { id: 1, createdAt: '2023-01-01T00:00:00.000Z', name: 'First' },
            ]);
        });

        it('should sort in ascending order by default createdAt field', () => {
            const sorted = [...testData].sort(sortByDate('asc'));
            expect(sorted).toEqual([
                { id: 1, createdAt: '2023-01-01T00:00:00.000Z', name: 'First' },
                { id: 3, createdAt: '2023-01-02T00:00:00.000Z', name: 'Second' },
                { id: 2, createdAt: '2023-01-03T00:00:00.000Z', name: 'Third' },
            ]);
        });

        it('should sort by custom date field', () => {
            const customData = [
                { id: 1, updatedAt: '2023-01-03T00:00:00.000Z' },
                { id: 2, updatedAt: '2023-01-01T00:00:00.000Z' },
                { id: 3, updatedAt: '2023-01-02T00:00:00.000Z' },
            ];

            const sorted = [...customData].sort(sortByDate('asc', 'updatedAt'));
            expect(sorted).toEqual([
                { id: 2, updatedAt: '2023-01-01T00:00:00.000Z' },
                { id: 3, updatedAt: '2023-01-02T00:00:00.000Z' },
                { id: 1, updatedAt: '2023-01-03T00:00:00.000Z' },
            ]);
        });

        it('should handle equal dates', () => {
            const equalDates = [
                { id: 1, createdAt: '2023-01-01T00:00:00.000Z' },
                { id: 2, createdAt: '2023-01-01T00:00:00.000Z' },
            ];

            const sorted = [...equalDates].sort(sortByDate('desc'));
            expect(sorted).toHaveLength(2);
            // Order should remain stable for equal dates
        });

        it('should work with SortOrder type', () => {
            const order: SortOrder = 'asc';
            const sorted = [...testData].sort(sortByDate(order));
            expect(sorted[0].createdAt).toBe('2023-01-01T00:00:00.000Z');
        });
    });
});
