import { dateTimeToProperty, dayToNumericDay, numericDayToDay } from '../../lib/calendar/vcalConverter';

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
                type: 'date-time',
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
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: true },
            parameters: {
                type: 'date-time'
            }
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
