import {
    dateTimeToProperty,
    dayToNumericDay,
    numericDayToDay,
    getDateTimePropertyInDifferentTimezone
} from '../../lib/calendar/vcalConverter';

describe('dateTimeToProperty', () => {
    it('should convert a date with a timezone into a property', () => {
        const property = dateTimeToProperty(
            {
                year: 2019,
                month: 10,
                day: 1,
                hours: 1,
                minutes: 13
            },
            false,
            'Etc/UTC'
        );
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: false },
            parameters: {
                tzid: 'Etc/UTC'
            }
        });
    });

    it('should convert utc time', () => {
        const property = dateTimeToProperty(
            {
                year: 2019,
                month: 10,
                day: 1,
                hours: 1,
                minutes: 13
            },
            true
        );
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: true }
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
            parameters: { type: 'date' }
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(property);
        expect(getDateTimePropertyInDifferentTimezone(property, tzid, true)).toEqual(property);
    });

    it('should change the timezone of UTC dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: true }
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 2, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid }
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(expected);
    });

    it('should change the timezone of timezoned dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' }
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 0, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid }
        };
        expect(getDateTimePropertyInDifferentTimezone(property, tzid)).toEqual(expected);
    });

    it('should return simplified form of UTC dates', () => {
        const property = {
            value: { year: 2020, month: 4, day: 23, hours: 12, minutes: 30, seconds: 0, isUTC: false },
            parameters: { tzid: 'Europe/Zurich' }
        };
        const expected = {
            value: { year: 2020, month: 4, day: 23, hours: 10, minutes: 30, seconds: 0, isUTC: true }
        };
        expect(getDateTimePropertyInDifferentTimezone(property, 'UTC')).toEqual(expected);
    });
});
