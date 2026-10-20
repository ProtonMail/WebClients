import isLastWeek from './isLastWeek';

describe('isLastWeek', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(new Date('2023-03-27T20:00:00'));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return true if the date is in the last week', () => {
        const date = new Date(2023, 2, 20); // March 20, 2023 is in the last week
        expect(isLastWeek(date)).toBe(true);
    });

    it('should return false if the date is not in the last week', () => {
        const date = new Date(2022, 2, 27); // March 27, 2022 is not in the last week
        expect(isLastWeek(date)).toBe(false);
    });

    it('should handle weekStartsOn option correctly', () => {
        const date = new Date(2023, 2, 20); // March 20, 2023 is in the last week, regardless of weekStartsOn value
        // With Monday is the start of the week
        expect(isLastWeek(date, { weekStartsOn: 1 })).toBe(true);
    });

    it('should return true for any time on the last day of the last week', () => {
        const date = new Date('2023-03-25T23:00:00'); // Saturday March 25, 2023 at 23:00
        expect(isLastWeek(date)).toBe(true);
    });

    it('should return false for the start of the current week', () => {
        const date = new Date('2023-03-26T00:00:00'); // Sunday March 26, 2023
        expect(isLastWeek(date)).toBe(false);
    });

    it('should return true if the date is in the last week and given as a timestamp', () => {
        const timestamp = new Date(2023, 2, 20).getTime(); // March 20, 2023 is in the last week
        expect(isLastWeek(timestamp)).toBe(true);
    });
});
