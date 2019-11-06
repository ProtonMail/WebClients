import { dateTimeToProperty } from '../../lib/calendar/vcalConverter';
import { convertZonedDateTimeToUTC, convertUTCDateTimeToZone } from '../../lib/date/timezone';

describe('convert utc', () => {
    it('should convert to a zone in utc', () => {
        const utcDateTime = convertZonedDateTimeToUTC(
            {
                year: 2019,
                day: 1,
                month: 1,
                hours: 0,
                minutes: 0,
                seconds: 0
            },
            'Australia/Sydney'
        );
        expect(utcDateTime).toEqual({
            year: 2018,
            day: 31,
            month: 12,
            hours: 13,
            minutes: 0,
            seconds: 0
        });
    });

    it('should convert back from a utc time with a timezone', () => {
        const utcDateTime = convertUTCDateTimeToZone(
            {
                year: 2018,
                day: 31,
                month: 12,
                hours: 13,
                minutes: 0,
                seconds: 0
            },
            'Australia/Sydney'
        );
        expect(utcDateTime).toEqual({
            year: 2019,
            day: 1,
            month: 1,
            hours: 0,
            minutes: 0,
            seconds: 0
        });
    });
});

describe('convert to', () => {
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
