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

    it('should convert a zoned time (Australia/Sydney) to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 1, 1), 'Australia/Sydney')).toEqual(obj(2018, 12, 31, 13));
    });

    it('should convert a zoned time (Europe/Zurich summer) to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 6, 15, 1), 'Europe/Zurich')).toEqual(obj(2019, 6, 14, 23));
    });

    it('should convert a zoned time (Europe/Zurich winter) to utc', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 12, 15, 1), 'Europe/Zurich')).toEqual(obj(2019, 12, 15, 0));
    });

    it('should convert a zoned time to utc with winter-to-summer (Europe/Zurich 2017) dst shift', () => {
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 1), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 0));
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 2), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 1));
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 3), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 1));
        expect(convertZonedDateTimeToUTC(obj(2017, 3, 26, 4), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 2));
    });

    it('should convert a zoned time to utc with summer-to-winter (Europe/Zurich 2019) dst shift', () => {
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 1), 'Europe/Zurich')).toEqual(obj(2019, 10, 26, 23));
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 2), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 1));
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 3), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
        expect(convertZonedDateTimeToUTC(obj(2019, 10, 27, 4), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 3));
    });

    it('should convert from utc time to a timezone (Australia/Sydney)', () => {
        expect(convertUTCDateTimeToZone(obj(2018, 12, 31, 13), 'Australia/Sydney')).toEqual(obj(2019, 1, 1));
    });

    it('should convert back from a utc to a timezone (Europe/Zurich summer)', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 6, 14, 23), 'Europe/Zurich')).toEqual(obj(2019, 6, 15, 1));
    });

    it('should convert back from a utc time to a timezone (Europe/Zurich winter)', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 12, 15, 0), 'Europe/Zurich')).toEqual(obj(2019, 12, 15, 1));
    });

    it('should convert back from a utc to a timezone (Europe/Zurich 2017) with summer-to-winter dst shifts', () => {
        expect(convertUTCDateTimeToZone(obj(2017, 3, 26, 0), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 1));
        expect(convertUTCDateTimeToZone(obj(2017, 3, 26, 1), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 3));
        expect(convertUTCDateTimeToZone(obj(2017, 3, 26, 2), 'Europe/Zurich')).toEqual(obj(2017, 3, 26, 4));
    });

    it('should convert back from a utc to a timezone (Europe/Zurich 2017) with winter-to-summer dst shifts', () => {
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 0), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 1), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 2));
        expect(convertUTCDateTimeToZone(obj(2019, 10, 27, 2), 'Europe/Zurich')).toEqual(obj(2019, 10, 27, 3));
    });
});
