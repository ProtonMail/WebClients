import { dateFromYYYYMMDD, formatYYYYMMDD } from './format';

describe(`dateFromYYYYMMDD [TZ=${process.env.TZ}]`, () => {
    test.each([
        { input: '2024-01-01', expected: { year: 2024, month: 0, date: 1 } },
        { input: '2024-12-31', expected: { year: 2024, month: 11, date: 31 } },
        { input: '2024-06-15', expected: { year: 2024, month: 5, date: 15 } },
        { input: '2024-2-29', expected: { year: 2024, month: 1, date: 29 } }, // leap year
        { input: '2024-1-1', expected: { year: 2024, month: 0, date: 1 } }, // non-padded
    ])('should produce consistent date components for $input regardless of system timezone', ({ input, expected }) => {
        const date = dateFromYYYYMMDD(input)!;

        expect(date.getFullYear()).toBe(expected.year);
        expect(date.getMonth()).toBe(expected.month);
        expect(date.getDate()).toBe(expected.date);

        /* Verify it's set to local midnight (00:00:00) */
        expect(date.getHours()).toBe(0);
        expect(date.getMinutes()).toBe(0);
        expect(date.getSeconds()).toBe(0);
        expect(date.getMilliseconds()).toBe(0);
    });

    test('should return undefined for invalid format', () => {
        expect(dateFromYYYYMMDD('invalid')).toBeUndefined();
        expect(dateFromYYYYMMDD('2024/01/01')).toBeUndefined();
        expect(dateFromYYYYMMDD('24-01-01')).toBeUndefined();
        expect(dateFromYYYYMMDD('')).toBeUndefined();
    });
});

describe(`formatYYYYMMDD [TZ=${process.env.TZ}]`, () => {
    test.each([
        { input: '2024-01-01', expected: 'Jan 1, 2024' },
        { input: '2024-12-31', expected: 'Dec 31, 2024' },
        { input: '2024-06-15', expected: 'Jun 15, 2024' },
        { input: '2024-02-29', expected: 'Feb 29, 2024' } /* leap-year edge-case */,
        { input: '2024-1-1', expected: 'Jan 1, 2024' } /* non-padded */,
    ])('should format $input consistently regardless of system timezone', ({ input, expected }) => {
        const result = formatYYYYMMDD(input);
        expect(result).toBe(expected);
    });

    test('should return undefined for invalid input', () => {
        expect(formatYYYYMMDD('invalid')).toBeUndefined();
        expect(formatYYYYMMDD('2024/01/01')).toBeUndefined();
        expect(formatYYYYMMDD('24-01-01')).toBeUndefined();
    });
});
