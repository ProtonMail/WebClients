import {
    findHolidaysCalendarByCountryCodeAndLanguageCode,
    findHolidaysCalendarByLanguageCode,
    getDefaultHolidaysCalendar,
    getHolidaysCalendarsFromCountryCode,
    getHolidaysCalendarsFromTimeZone,
} from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

const holidaysCalendars = [
    {
        CalendarID: 'calendarID1',
        Country: 'France',
        CountryCode: 'fr',
        LanguageCode: 'fr',
        Language: 'Français',
        Timezones: ['Europe/Paris'],
    } as HolidaysDirectoryCalendar,
    {
        CalendarID: 'calendarID2',
        Country: 'Switzerland',
        CountryCode: 'ch',
        LanguageCode: 'en',
        Language: 'English',
        Timezones: ['Europe/Zurich'],
    } as HolidaysDirectoryCalendar,
    {
        CalendarID: 'calendarID3',
        Country: 'Switzerland',
        CountryCode: 'ch',
        LanguageCode: 'de',
        Language: 'Deutsch',
        Timezones: ['Europe/Zurich'],
    } as HolidaysDirectoryCalendar,
];

fdescribe('Holidays calendars helpers', () => {
    describe('getHolidaysCalendarsFromTimezone', () => {
        it('should return all holidays calendars from the same time zone', () => {
            const tzid = 'Europe/Zurich';

            const expected = [holidaysCalendars[1], holidaysCalendars[2]];
            expect(getHolidaysCalendarsFromTimeZone(holidaysCalendars, tzid)).toEqual(expected);
        });
    });

    describe('getHolidaysCalendarsFromCountryCode', () => {
        it('should return all holidays calendars from the same country code, sorted by languages', () => {
            const countryCode = 'ch';

            const expected = [holidaysCalendars[2], holidaysCalendars[1]];
            expect(getHolidaysCalendarsFromCountryCode(holidaysCalendars, countryCode)).toEqual(expected);
        });
    });

    describe('findHolidaysCalendarByLanguageCode', () => {
        it('should return the first holidays calendar with the same language code', () => {
            const languageCode = 'en';

            const expected = holidaysCalendars[1];
            expect(findHolidaysCalendarByLanguageCode(holidaysCalendars, languageCode)).toEqual(expected);
        });
    });

    describe('findHolidaysCalendarByCountryCodeAndLanguageCode', () => {
        it('should return the holidays calendar with the same language', () => {
            const countryCode = 'ch';
            const languageCode = 'en';

            const expected = holidaysCalendars[1];
            expect(
                findHolidaysCalendarByCountryCodeAndLanguageCode(holidaysCalendars, countryCode, languageCode)
            ).toEqual(expected);
        });

        it('should return the holidays calendar with the first language', () => {
            const countryCode = 'ch';
            // No calendar with the same language code is available in the options, so we return the first calendar sorted by languages
            const languageCode = 'not in options';

            const expected = holidaysCalendars[2];
            expect(
                findHolidaysCalendarByCountryCodeAndLanguageCode(holidaysCalendars, countryCode, languageCode)
            ).toEqual(expected);
        });
    });

    describe('getDefaultHolidaysCalendar', () => {
        it('should not return a calendar', () => {
            const tzid = 'does not exist';
            const languageCode = 'does not exist either';

            expect(getDefaultHolidaysCalendar(holidaysCalendars, tzid, languageCode)).toBeUndefined();
        });

        it('should return the only holidays calendar found', () => {
            const tzid = 'Europe/Paris';
            const languageCode = 'fr';

            const expected = holidaysCalendars[0];
            expect(getDefaultHolidaysCalendar(holidaysCalendars, tzid, languageCode)).toEqual(expected);
        });

        it('should return the holidays calendar with the same language', () => {
            const tzid = 'Europe/Zurich';
            const languageCode = 'en';

            const expected = holidaysCalendars[1];
            expect(getDefaultHolidaysCalendar(holidaysCalendars, tzid, languageCode)).toEqual(expected);
        });

        it('should return the holidays calendar with the first language', () => {
            const tzid = 'Europe/Zurich';
            // No calendar with the same language code is available in the options, so we return the first calendar sorted by languages
            const languageCode = 'not in options';

            const expected = holidaysCalendars[2];
            expect(getDefaultHolidaysCalendar(holidaysCalendars, tzid, languageCode)).toEqual(expected);
        });
    });
});
