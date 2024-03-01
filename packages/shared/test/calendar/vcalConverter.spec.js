import { buildMailTo } from '@proton/shared/lib/helpers/email';

import {
    dateTimeToProperty,
    dayToNumericDay,
    getDateTimePropertyInDifferentTimezone,
    getHasModifiedDateTimes,
    getIsEquivalentOrganizer,
    numericDayToDay,
    propertyToLocalDate,
    propertyToUTCDate,
} from '../../lib/calendar/vcalConverter';

describe('propertyToUTCDate', () => {
    it('should convert all-day properties to UTC end-of-day times', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7 },
            parameters: { type: 'date' },
        };
        expect(+propertyToUTCDate(property)).toEqual(Date.UTC(2021, 6, 7));
    });

    it('should convert Zulu date-time properties', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: true },
        };
        expect(+propertyToUTCDate(property)).toEqual(Date.UTC(2021, 6, 7, 7, 7, 7));
    });

    it('should convert floating date-time properties to Zulu time', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: false },
        };
        expect(+propertyToUTCDate(property)).toEqual(Date.UTC(2021, 6, 7, 7, 7, 7));
    });

    it('should convert localized date-time properties', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: false },
            parameters: { tzid: 'Europe/Brussels' },
        };
        expect(+propertyToUTCDate(property)).toEqual(Date.UTC(2021, 6, 7, 5, 7, 7));
    });
});

describe('propertyToLocalDate', () => {
    it('should convert all-day properties to local end-of-day times', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7 },
            parameters: { type: 'date' },
        };
        expect(+propertyToLocalDate(property)).toEqual(+new Date(2021, 6, 7));
    });

    it('should convert Zulu date-time properties', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: true },
        };
        expect(+propertyToLocalDate(property)).toEqual(Date.UTC(2021, 6, 7, 7, 7, 7));
    });

    it('should convert floating date-time properties to Zulu time', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: false },
        };
        expect(+propertyToLocalDate(property)).toEqual(Date.UTC(2021, 6, 7, 7, 7, 7));
    });

    it('should convert localized date-time properties', () => {
        const property = {
            value: { year: 2021, month: 7, day: 7, hours: 7, minutes: 7, seconds: 7, isUTC: false },
            parameters: { tzid: 'Europe/Brussels' },
        };
        expect(+propertyToLocalDate(property)).toEqual(Date.UTC(2021, 6, 7, 5, 7, 7));
    });
});

describe('dateTimeToProperty', () => {
    it('should convert a date with a timezone into a property', () => {
        const property = dateTimeToProperty(
            {
                year: 2019,
                month: 10,
                day: 1,
                hours: 1,
                minutes: 13,
            },
            false,
            'Etc/UTC'
        );
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: false },
            parameters: {
                tzid: 'Etc/UTC',
            },
        });
    });

    it('should convert utc time', () => {
        const property = dateTimeToProperty(
            {
                year: 2019,
                month: 10,
                day: 1,
                hours: 1,
                minutes: 13,
            },
            true
        );
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: true },
        });
    });
});

describe('day converter', () => {
    it('should convert from number to day', () => {
        expect(numericDayToDay(-3)).toEqual('TH');
        expect(numericDayToDay(-2)).toEqual('FR');
        expect(numericDayToDay(-1)).toEqual('SA');
        expect(numericDayToDay(0)).toEqual('SU');
        expect(numericDayToDay(1)).toEqual('MO');
        expect(numericDayToDay(2)).toEqual('TU');
        expect(numericDayToDay(3)).toEqual('WE');
    });

    it('should convert from day to number', () => {
        expect(dayToNumericDay('SU')).toEqual(0);
        expect(dayToNumericDay('MO')).toEqual(1);
        expect(dayToNumericDay('TU')).toEqual(2);
        expect(dayToNumericDay('WE')).toEqual(3);
        expect(dayToNumericDay('TH')).toEqual(4);
        expect(dayToNumericDay('FR')).toEqual(5);
        expect(dayToNumericDay('SA')).toEqual(6);
        expect(dayToNumericDay('su')).toBeUndefined();
        expect(dayToNumericDay('asd')).toBeUndefined();
    });
});

describe('getDateTimePropertyInDifferentTimezone', () => {
    const tzid = 'Pacific/Honolulu';
    it('should not modify all-day properties', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23 },
            parameters: { type: 'date' },
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(property);
        expect(getDateTimePropertyInDifferentTimezone(property, tzid, true)).toEqual(property);
    });

    it('should change the timezone of UTC dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: true },
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 2, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid },
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(expected);
    });

    it('should change the timezone of timezoned dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' },
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 0, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid },
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(expected);
    });

    it('should return simplified form of UTC dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' },
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 10, minutes: 30, seconds: 0, isUTC: true },
        };
        expect(getDateTimePropertyInDifferentTimezone(property, 'UTC')).toEqual(expected);
    });
});

describe('getHasModifiedDateTimes', () => {
    it('should detect same times as equal for part-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 11, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/London' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(false);
    });

    it('should detect same times as equal for all-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 24 },
                parameters: { type: 'date' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23 },
                parameters: { type: 'date' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(false);
    });

    it('should detect different start times as different for part-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 23, hours: 13, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/London' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 23, hours: 13, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(true);
    });

    it('should detect different end times as different for all-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 23, hours: 11, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/London' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 23, hours: 13, minutes: 30, seconds: 0, isUTC: false },
                parameters: { tzid: 'Europe/Zurich' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(true);
    });

    it('should detect different start times as different for all-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 21 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 24 },
                parameters: { type: 'date' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 22 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 24 },
                parameters: { type: 'date' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(true);
    });

    it('should detect different end times as different for all-day events', () => {
        const vevent1 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 21 },
                parameters: { type: 'date' },
            },
        };
        const vevent2 = {
            dtstart: {
                value: { year: 2020, month: 4, day: 21 },
                parameters: { type: 'date' },
            },
            dtend: {
                value: { year: 2020, month: 4, day: 24 },
                parameters: { type: 'date' },
            },
        };
        expect(getHasModifiedDateTimes(vevent1, vevent2)).toEqual(true);
    });
});

describe('getHasEquivalentOrganizer', () => {
    it('should return true for organizers that only differ by email property (but have same mailto value)', () => {
        expect(
            getIsEquivalentOrganizer(
                {
                    value: buildMailTo('organizer@proton.me'),
                    parameters: {
                        cn: 'ORGO',
                        email: 'one',
                    },
                },
                {
                    value: buildMailTo('organizer@proton.me'),
                    parameters: {
                        cn: 'ORGO',
                        email: 'two',
                    },
                }
            )
        ).toEqual(true);
    });

    it('should return false for organizers whose emails differ by canonicalization', () => {
        expect(
            getIsEquivalentOrganizer(
                {
                    value: buildMailTo('organizer@proton.me'),
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                {
                    value: buildMailTo('Organizer@proton.me'),
                    parameters: {
                        cn: 'ORGO',
                    },
                }
            )
        ).toEqual(false);
    });

    it('should return false for organizers that only differ by cn property', () => {
        expect(
            getIsEquivalentOrganizer(
                {
                    value: buildMailTo('organizer@proton.me'),
                    parameters: {
                        cn: 'ORGO',
                    },
                },
                {
                    value: buildMailTo('organizer@proton.me'),
                    parameters: {
                        cn: 'orgo',
                    },
                }
            )
        ).toEqual(false);
    });
});
