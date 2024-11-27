import { toSpecificTimezone } from './toSpecificTimezone';

jest.mock('@proton/shared/lib/i18n', () => ({
    dateLocale: { code: 'en-GB' },
}));

describe('toSpecificTimezone()', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    test.each([
        { expected: '2024-10-15T00:00:00.000Z', timezone: 'UTC' },
        { expected: '2024-10-15T01:00:00.000Z', timezone: 'Europe/London' },
        { expected: '2024-10-15T03:00:00.000Z', timezone: 'Europe/Vilnius' },
    ])('given a $timezone timezone, should return the correct date', ({ expected, timezone }) => {
        const date = new Date('2024-10-15T00:00:00.000Z');
        expect(toSpecificTimezone(date, timezone)).toEqual(new Date(expected));
    });
});
