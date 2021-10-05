import { getDtendPropertyFromDuration } from '../../../lib/calendar/icsSurgery/vevent';

describe('getDtendPropertyFromDuration()', () => {
    it('returns the appropriate dtend when given a duration and start', () => {
        // UTC part day
        expect(
            getDtendPropertyFromDuration(
                { value: { year: 2020, month: 1, day: 31, hours: 0, minutes: 0, seconds: 0, isUTC: true } },
                {
                    weeks: 0,
                    days: 1,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isNegative: false,
                }
            )
        ).toEqual({ value: { year: 2020, month: 2, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true } });

        // Localized part day
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { tzid: 'Europe/Zurich' },
                    value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: false },
                },
                {
                    weeks: 0,
                    days: 1,
                    hours: 1,
                    minutes: 0,
                    seconds: 0,
                    isNegative: false,
                }
            )
        ).toEqual({
            parameters: { tzid: 'Europe/Zurich' },
            value: { year: 2020, month: 1, day: 2, hours: 1, minutes: 0, seconds: 0, isUTC: false },
        });

        // All day with 1 day duration
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { type: 'date' },
                    value: { year: 2020, month: 1, day: 1 },
                },
                {
                    weeks: 0,
                    days: 1,
                    hours: 0,
                    minutes: 0,
                    seconds: 0,
                    isNegative: false,
                }
            )
        ).toBeUndefined();

        // All day badly formatted with 1 second duration
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { type: 'date' },
                    value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
                },
                {
                    weeks: 0,
                    days: 0,
                    hours: 0,
                    minutes: 0,
                    seconds: 1,
                    isNegative: false,
                }
            )
        ).toBeUndefined();

        // All day badly formatted with slightly over 1 day duration
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { type: 'date' },
                    value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
                },
                {
                    weeks: 0,
                    days: 1,
                    hours: 0,
                    minutes: 0,
                    seconds: 1,
                    isNegative: false,
                }
            )
        ).toEqual({
            parameters: { type: 'date' },
            value: { year: 2020, month: 1, day: 3 },
        });

        // UTC Part day with complex dueration
        expect(
            getDtendPropertyFromDuration(
                {
                    value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
                },
                {
                    weeks: 2,
                    days: 3,
                    hours: 4,
                    minutes: 5,
                    seconds: 6,
                    isNegative: false,
                }
            )
        ).toEqual({
            value: { year: 2020, month: 1, day: 18, hours: 4, minutes: 5, seconds: 6, isUTC: true },
        });

        // All day badly formatted complex duration
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { type: 'date' },
                    value: { year: 2020, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
                },
                {
                    weeks: 5,
                    days: 1,
                    hours: 1,
                    minutes: 1,
                    seconds: 1,
                    isNegative: false,
                }
            )
        ).toEqual({
            parameters: { type: 'date' },
            value: { year: 2020, month: 2, day: 7 },
        });

        // All day negative duration
        expect(
            getDtendPropertyFromDuration(
                {
                    parameters: { type: 'date' },
                    value: { year: 2020, month: 1, day: 1 },
                },
                {
                    weeks: 5,
                    days: 1,
                    hours: 1,
                    minutes: 1,
                    seconds: 1,
                    isNegative: true,
                }
            )
        ).toBeUndefined();
    });
});
