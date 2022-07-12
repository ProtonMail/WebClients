import { listTimeZones } from '@protontech/timezone-support';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    toAllowedTimeZone,
    getSupportedTimezone,
    ALLOWED_TIMEZONES_LIST,
} from '../../lib/date/timezone';
import { MANUAL_TIMEZONE_LINKS, unsupportedTimezoneLinks } from '../../lib/date/timezoneDatabase';

describe('convert utc', () => {
    const obj = (year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0) => ({
        year,
        month,
        day,
        hours,
        minutes,
        seconds,
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

describe('getAllowedTimezone', () => {
    it('transforms all time zones supported by our library into time zones allowed by the BE', () => {
        const timeZones = listTimeZones();

        let result = true;

        try {
            timeZones.forEach((tzid) => toAllowedTimeZone(tzid));
        } catch {
            result = false;
        }

        expect(result).toEqual(true);
    });

    it('does not transform time zones already allowed', () => {
        let result = true;

        for (const tzid of ALLOWED_TIMEZONES_LIST) {
            if (toAllowedTimeZone(tzid) !== tzid) {
                result = false;
            }
        }

        expect(result).toEqual(true);
    });
});

describe('getSupportedTimezone', () => {
    it('should remove extra slashes', () => {
        expect(getSupportedTimezone('/Europe/London/')).toEqual('Europe/London');
        expect(getSupportedTimezone('/Africa/Freetown/')).toEqual('Africa/Abidjan');
    });

    it('should support the bluejeans format', () => {
        expect(getSupportedTimezone('/tzurl.org/2020b/America/Chicago')).toEqual('America/Chicago');
        expect(getSupportedTimezone('/tzurl.org/2020b/Asia/Istanbul')).toEqual('Europe/Istanbul');
    });

    it('should support the mozilla format', () => {
        expect(getSupportedTimezone('/mozilla.org/20050126_1/America/Argentina/Ushuaia')).toEqual(
            'America/Argentina/Ushuaia'
        );
        expect(getSupportedTimezone('/mozilla.org/20050126_1/America/Argentina/ComodRivadavia')).toEqual(
            'America/Argentina/Catamarca'
        );
    });

    it('should transform globally defined alias timezones according to the longest match', () => {
        // GB (Europe/London), Eire (Europe/Dublin) and GB-Eire (Europe/London) are all alias timezones.
        // getSupportedTimezone should transform according to the longest match, GB-Eire -> Europe/London
        expect(getSupportedTimezone('/mozilla.org/20050126_1/GB-Eire')).toEqual('Europe/London');
        expect(getSupportedTimezone('/tzurl.org/2021a/Eire')).toEqual('Europe/Dublin');
        expect(getSupportedTimezone('/GB/')).toEqual('Europe/London');
    });

    it('should be robust for capturing globally defined timezones (for which no specification exists)', () => {
        expect(getSupportedTimezone('/IANA-db:Asia/Seoul--custom.format')).toEqual('Asia/Seoul');
    });

    it('should filter non-supported canonical timezones', () => {
        const canonical = listTimeZones();
        const results = canonical.map((tzid) => getSupportedTimezone(tzid));
        const expected = canonical.map((tzid) => unsupportedTimezoneLinks[tzid] || tzid);
        expect(results).toEqual(expected);
    });

    it('should return the supported canonical timezone for alias timezones', () => {
        const alias = [
            'Africa/Bujumbura',
            'Africa/Freetown',
            'America/Antigua',
            'America/Indianapolis',
            'Asia/Macao',
            'Asia/Istanbul',
            'Europe/Skopje',
            'GB-Eire',
        ];
        const canonical = [
            'Africa/Maputo',
            'Africa/Abidjan',
            'America/Port_of_Spain',
            'America/New_York',
            'Asia/Macau',
            'Europe/Istanbul',
            'Europe/Belgrade',
            'Europe/London',
        ];
        const results = alias.map((tzid) => getSupportedTimezone(tzid));
        expect(results).toEqual(canonical);
    });

    it('should convert manual timezones', () => {
        const manual = Object.keys(MANUAL_TIMEZONE_LINKS);
        const results = manual.map((tzid) => getSupportedTimezone(tzid));
        const expected = Object.values(MANUAL_TIMEZONE_LINKS);
        expect(results).toEqual(expected);
    });

    it('should be robust', () => {
        const tzids = ['Chamorro (UTC+10)', '(GMT-01:00) Azores', 'Mountain Time (U.S. & Canada)'];
        const expected = ['Pacific/Saipan', 'Atlantic/Azores', 'America/Denver'];
        const results = tzids.map(getSupportedTimezone);
        expect(results).toEqual(expected);
    });

    it('should return undefined for unknown timezones', () => {
        const unknown = ['Chamorro Standard Time', '(UTC+01:00) Bruxelles, Copenhague, Madrid, Paris'];
        const results = unknown.map((tzid) => getSupportedTimezone(tzid));
        const expected = unknown.map(() => undefined);
        expect(results).toEqual(expected);
    });
});
