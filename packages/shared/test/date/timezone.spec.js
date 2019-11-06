import { convertUTCDateTimeToZone, convertZonedDateTimeToUTC } from '../../lib/date/timezone';

describe('convert utc', () => {
    const obj = (year, month, day, hours = 0, minutes = 0, seconds = 0) => ({
        year,
        month,
        day,
        hours,
        minutes,
        seconds
    });

    it('should convert a zoned time to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 1, 1), 'Australia/Sydney')).toEqual(obj(2018, 12, 31, 13));
    });

    it('should convert a zoned time to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 1), 'Europe/Zurich')).toEqual(obj(2019, 10, 26, 23));
    });

    it('should convert a zoned time to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 1), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 0));
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 2), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 0));
    });

    it('should convert to a zone in utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 2), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 0));
    });

    it('should convert a zoned time to utc with dst shift', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 3), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
    });

    it('should convert from utc time to a timezone', () => {
        expect(convertUTCDateTimeToZone(obj(2018, 12, 31, 13), 'Australia/Sydney')).toEqual(obj(2019, 1, 1));
    });

    it('should convert back from a utc time with a timezone', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 10, 26, 23), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 1));
    });

    it('should convert back from a utc time with a timezone', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 0), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
    });

    it('should convert back from a utc time with a timezone', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 1), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
    });

    it('should convert back from a utc time with a timezone', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 2), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 3));
    });
});
