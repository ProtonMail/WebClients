import { getDtendPropertyFromDuration, getSupportedDtstamp } from '../../../lib/calendar/icsSurgery/vevent';

describe('getSupportedDtstamp()', () => {
    it('leaves untouched a proper DTSTAMP', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: true },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: true } });
    });

    it('leaves untouched a DTSTAMP with Zulu marker and time zone', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: true },
                    parameters: { tzid: 'Asia/Seoul' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: true } });
    });

    it('converts a time-zoned DTSTAMP', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: false },
                    parameters: { tzid: 'America/Montevideo' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 18, minutes: 11, seconds: 11, isUTC: true } });
    });

    it('converts a time-zoned DTSTAMP with a TZID that needs conversion', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: false },
                    parameters: { tzid: '/mozilla.org/20050126_1/Asia/Pyongyang' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 6, minutes: 11, seconds: 11, isUTC: true } });
    });

    it('converts a floating DTSTAMP', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: false },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 15, minutes: 11, seconds: 11, isUTC: true } });
    });

    it('converts an all-day DTSTAMP', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31 },
                    parameters: { type: 'date' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 0, minutes: 0, seconds: 0, isUTC: true } });
    });

    it('converts an all-day DTSTAMP with TZID', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31 },
                    parameters: { type: 'date', tzid: 'America/Montevideo' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2020, month: 1, day: 31, hours: 3, minutes: 0, seconds: 0, isUTC: true } });
    });

    it('defaults to the given timestamp if a time zone is present but not supported', () => {
        expect(
            getSupportedDtstamp(
                {
                    value: { year: 2020, month: 1, day: 31 },
                    parameters: { type: 'date', tzid: 'Europe/My_home' },
                },
                1666017619812
            )
        ).toEqual({ value: { year: 2022, month: 10, day: 17, hours: 14, minutes: 40, seconds: 19, isUTC: true } });
    });
});

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
