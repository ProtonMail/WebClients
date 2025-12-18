import { listTimeZones } from '@protontech/timezone-support';

import type { SimpleMap } from '@proton/shared/lib/interfaces';

import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDateToTimezone,
    getAbbreviatedTimezoneName,
    getReadableCityTimezone,
    getSupportedTimezone,
    getTimezoneAndOffset,
    guessTimezone,
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
            'America/Puerto_Rico',
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

    it('should convert time zones we do not support yet', () => {
        const expectedMap: SimpleMap<string> = {
            'Pacific/Kanton': 'Pacific/Fakaofo',
            'Europe/Kyiv': 'Europe/Kiev',
            'America/Nuuk': 'Atlantic/Stanley',
            'America/Ciudad_Juarez': 'America/Ojinaga',
        };

        Object.keys(expectedMap).forEach((tzid) => {
            expect(getSupportedTimezone(tzid)).toBe(expectedMap[tzid]);
        });
    });

    it('should convert deprecated time zones', () => {
        const expectedMap: SimpleMap<string> = {
            'Australia/Currie': 'Australia/Hobart',
        };

        Object.keys(expectedMap).forEach((tzid) => {
            expect(getSupportedTimezone(tzid)).toBe(expectedMap[tzid]);
        });
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

describe('guessTimeZone', () => {
    const timeZoneList = listTimeZones();

    describe('should guess right when the browser detects "Europe/Zurich"', () => {
        beforeEach(() => {
            spyOn<any>(Intl, 'DateTimeFormat').and.returnValue({
                resolvedOptions: () => ({ timeZone: 'Europe/Zurich' }),
            });
        });

        it('guesses "Europe/Zurich"', () => {
            expect(guessTimezone(timeZoneList)).toBe('Europe/Zurich');
        });
    });

    describe('should guess right when the browser detects "Europe/Kyiv"', () => {
        beforeEach(() => {
            spyOn<any>(Intl, 'DateTimeFormat').and.returnValue({
                resolvedOptions: () => ({ timeZone: 'Europe/Kyiv' }),
            });
        });

        it('guesses "Europe/Kiev"', () => {
            expect(guessTimezone(timeZoneList)).toBe('Europe/Kiev');
        });
    });

    describe('should guess right when the browser detects "Pacific/Kanton"', () => {
        beforeEach(() => {
            spyOn<any>(Intl, 'DateTimeFormat').and.returnValue({
                resolvedOptions: () => ({ timeZone: 'Pacific/Kanton' }),
            });
        });

        it('guesses "Pacific/Fakaofo"', () => {
            expect(guessTimezone(timeZoneList)).toBe('Pacific/Fakaofo');
        });
    });

    describe('should guess right when the browser detects unknown time zone with GMT+1', () => {
        beforeEach(() => {
            const baseTime = Date.UTC(2023, 2, 7, 9);

            spyOn<any>(Intl, 'DateTimeFormat').and.returnValue({
                resolvedOptions: () => ({ timeZone: 'unknown' }),
            });
            spyOn<any>(window, 'Date').and.returnValue({
                getTime: () => baseTime,
                getTimezoneOffset: () => -60,
                getUTCFullYear: () => 2023,
                getUTCMonth: () => 2,
                getUTCDate: () => 7,
                getUTCDay: () => 2,
                getUTCHours: () => 9,
                getUTCMinutes: () => 0,
                getUTCSeconds: () => 0,
                getUTCMilliseconds: () => 0,
            });
        });

        it('guesses "Africa/Algiers", first in the list with that GMT offset', () => {
            expect(guessTimezone(timeZoneList)).toBe('Africa/Algiers');
        });
    });
});

describe('getReadableCityTimezone', () => {
    it('should return city timezone without underscores', () => {
        const cityTimezone = 'Los_Angeles';

        expect(getReadableCityTimezone(cityTimezone)).toEqual('Los Angeles');
    });

    it('should return city timezone without change', () => {
        const cityTimezone = 'Paris';

        expect(getReadableCityTimezone(cityTimezone)).toEqual('Paris');
    });
});

describe('getAbbreviatedTimezoneName', () => {
    it('should return the expected offset timezone', () => {
        const timezone = 'Europe/Paris';
        const result = getAbbreviatedTimezoneName('offset', timezone) || '';

        expect(['GMT+1', 'GMT+2']).toContain(result);
    });

    it('should return the expected city timezone', () => {
        const timezone = 'Europe/Paris';

        expect(getAbbreviatedTimezoneName('city', timezone)).toEqual('Paris');
    });

    it('should return the expected city timezone on a readable format', () => {
        const timezone = 'America/Los_Angeles';

        expect(getAbbreviatedTimezoneName('city', timezone)).toEqual('Los Angeles');
    });

    it('should return the expected city timezone for a longer timezone', () => {
        const timezone = 'America/North_Dakota/New_Salem';

        expect(getAbbreviatedTimezoneName('city', timezone)).toEqual('New Salem');
    });
});

describe('getTimezoneAndOffset', () => {
    it('should return the expected timezone string, containing offset and name', () => {
        const timezone = 'Europe/Paris';
        const result = getTimezoneAndOffset(timezone);

        expect(['GMT+1 • Europe/Paris', 'GMT+2 • Europe/Paris']).toContain(result);
    });
});

describe('fromUTCDateToTimezone', () => {
    it('should return the same date for UTC timezone', () => {
        const date = new Date('2024-10-15T00:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'UTC');
        expect(result).toEqual(new Date('2024-10-15T00:00:00.000Z'));
    });

    it('should convert UTC date for positive offsets', () => {
        // In October 2024, London is in BST (UTC+1)
        const date = new Date('2024-10-15T00:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'Europe/London');
        expect(result).toEqual(new Date('2024-10-15T01:00:00.000Z'));
    });

    it('should convert UTC date for negative offsets', () => {
        // New York is UTC-5 in January (winter time)
        const date = new Date('2024-01-15T12:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'America/New_York');
        expect(result).toEqual(new Date('2024-01-15T07:00:00.000Z'));
    });

    it('should handle DST transition correctly (Europe/Zurich winter)', () => {
        // Zurich is UTC+1 in December (winter time)
        const date = new Date('2019-12-15T00:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'Europe/Zurich');
        expect(result).toEqual(new Date('2019-12-15T01:00:00.000Z'));
    });

    it('should handle DST transition correctly (Europe/Zurich summer)', () => {
        // Zurich is UTC+2 in June (summer time)
        const date = new Date('2019-06-15T00:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'Europe/Zurich');
        expect(result).toEqual(new Date('2019-06-15T02:00:00.000Z'));
    });

    it('should handle dates with non-zero hours, minutes, and seconds', () => {
        const date = new Date('2024-10-15T14:30:45.000Z');
        const result = fromUTCDateToTimezone(date, 'Europe/London');
        expect(result).toEqual(new Date('2024-10-15T15:30:45.000Z'));
    });

    it('should handle date boundaries correctly (crossing to previous day)', () => {
        // 3 AM UTC on Jan 15 in New York (UTC-5) is 10 PM on Jan 14 (previous day)
        const date = new Date('2024-01-15T03:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'America/New_York');
        expect(result).toEqual(new Date('2024-01-14T22:00:00.000Z'));
    });

    it('should handle date boundaries correctly (crossing to next day)', () => {
        // 1 PM UTC in Sydney (UTC+11) is midnight next day
        const date = new Date('2019-01-15T13:00:00.000Z');
        const result = fromUTCDateToTimezone(date, 'Australia/Sydney');
        expect(result).toEqual(new Date('2019-01-16T00:00:00.000Z'));
    });
});
