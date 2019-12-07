import { dateTimeToProperty } from '../../lib/calendar/vcalConverter';

describe('dateTimeToProperty', () => {
    it('should convert a date with a timezone into a property', () => {
        const property = dateTimeToProperty({
            year: 2019,
            month: 10,
            day: 1,
            hours: 1,
            minutes: 13,
            tzid: 'Etc/UTC'
        });
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: false },
            parameters: {
                type: 'date-time',
                tzid: 'Etc/UTC'
            }
        });
    });

    it('should convert utc time', () => {
        const property = dateTimeToProperty({
            year: 2019,
            month: 10,
            day: 1,
            hours: 1,
            minutes: 13,
            isUTC: true
        });
        expect(property).toEqual({
            value: { year: 2019, month: 10, day: 1, hours: 1, minutes: 13, seconds: 0, isUTC: true },
            parameters: {
                type: 'date-time'
            }
        });
    });
});
