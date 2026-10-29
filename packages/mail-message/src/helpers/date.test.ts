import {
    formatDateToHuman,
    formatDistanceToNow,
    formatFileNameDate,
    formatFullDate,
    formatScheduledTimeString,
    formatSimpleDate,
} from './date';

describe('formatSimpleDate', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('should return today date correctly formatted', function () {
        // Sunday 1 2023
        const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = '10:00 AM';

        expect(formatSimpleDate(fakeNow)).toEqual(expected);
    });

    it('should return yesterday date correctly formatted', () => {
        // Monday 2 2023
        const fakeNow = new Date(2023, 0, 2, 10, 0, 0);
        // Sunday 1 2023
        const yesterday = new Date(2023, 0, 1, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = 'Yesterday';

        expect(formatSimpleDate(yesterday)).toEqual(expected);
    });

    it('should return is this week date correctly formatted', function () {
        // Monday 2 2023
        const fakeNow = new Date(2023, 0, 2, 10, 0, 0);
        // Wednesday 4 2023
        const inTheWeek = new Date(2023, 0, 4, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = 'Wednesday';

        expect(formatSimpleDate(inTheWeek)).toEqual(expected);
    });

    it('should return a normal date in the current year correctly formatted', () => {
        // Sunday 1 2023
        const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
        // Tuesday 10 2023
        const inTheWeek = new Date(2023, 0, 10, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = 'Jan 10';

        expect(formatSimpleDate(inTheWeek)).toEqual(expected);
    });

    it('should return a normal date in the past year correctly formatted', () => {
        // Sunday 1 2023
        const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
        // Tuesday 10 2023
        const inPastYear = new Date(2022, 0, 10, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = 'Jan 10, 2022';

        expect(formatSimpleDate(inPastYear)).toEqual(expected);
    });
});

describe('formatFullDate', () => {
    it('should format the date with the correct format', () => {
        // Sunday 1 2023
        const date = new Date(2023, 0, 1, 10, 0, 0);

        const expected = 'Sunday, January 1st, 2023 at 10:00 AM';

        expect(formatFullDate(date)).toEqual(expected);
    });
});

describe('formatDistanceToNow', () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    it('should format distance date', () => {
        // Sunday 1 2023
        const fakeNow = new Date(2023, 0, 1, 10, 0, 0);
        // Saturday 1 2022
        const lastyear = new Date(2022, 0, 1, 10, 0, 0);
        jest.useFakeTimers().setSystemTime(fakeNow.getTime());

        const expected = 'about 1 year ago';

        expect(formatDistanceToNow(lastyear)).toEqual(expected);
    });
});

describe('formatFileNameDate', () => {
    it('should format the date in a filename format', () => {
        // Sunday 1 2023
        const date = new Date(2023, 0, 1, 10, 0, 0);

        const expected = '2023-01-01T';

        expect(formatFileNameDate(date)).toMatch(expected);
    });
});

describe('formatScheduledTimeString', () => {
    it('should format scheduled time string', () => {
        // Sunday 1 2023
        const date = new Date(2023, 0, 1, 10, 0, 0);

        const expected = '10:00 AM';

        expect(formatScheduledTimeString(date)).toEqual(expected);
    });
});

describe('formatDateToHuman', () => {
    it('should format date to human format', function () {
        // Sunday 1 2023
        const date = new Date(2023, 0, 1, 10, 0, 0);

        const expected = {
            dateString: 'Sunday, January 1st, 2023',
            formattedTime: '10:00 AM',
        };

        expect(formatDateToHuman(date)).toEqual(expected);
    });
});
