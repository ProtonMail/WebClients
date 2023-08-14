import {
    findHolidaysCalendarByCountryCodeAndLanguageTag,
    getHolidaysCalendarsFromCountryCode,
    getHolidaysCalendarsFromTimeZone,
    getSuggestedHolidaysCalendar,
} from '@proton/shared/lib/calendar/holidaysCalendar/holidaysCalendar';
import { HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';

const frCalendar = {
    CalendarID: 'calendarID1',
    Country: 'France',
    CountryCode: 'fr',
    LanguageCode: 'fr',
    Language: 'Français',
    Timezones: ['Europe/Paris'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const chEnCalendar = {
    CalendarID: 'calendarID2',
    Country: 'Switzerland',
    CountryCode: 'ch',
    LanguageCode: 'en',
    Language: 'English',
    Timezones: ['Europe/Zurich'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const chDeCalendar = {
    CalendarID: 'calendarID3',
    Country: 'Switzerland',
    CountryCode: 'ch',
    LanguageCode: 'de',
    Language: 'Deutsch',
    Timezones: ['Europe/Zurich'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const beFrCalendar = {
    CalendarID: 'calendarID4',
    Country: 'Belgium',
    CountryCode: 'be',
    LanguageCode: 'fr',
    Language: 'Français',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const beNlCalendar = {
    CalendarID: 'calendarID5',
    Country: 'Belgium',
    CountryCode: 'be',
    LanguageCode: 'nl',
    Language: 'Dutch',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const nlCalendar = {
    CalendarID: 'calendarID6',
    Country: 'Netherlands',
    CountryCode: 'nl',
    LanguageCode: 'nl',
    Language: 'Dutch',
    Timezones: ['Europe/Brussels'],
    Passphrase: 'dummyPassphrase',
    Hidden: false,
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};
const auCalendar = {
    CalendarID: 'calendarID7',
    Country: 'Australia',
    CountryCode: 'au',
    LanguageCode: 'en',
    Language: 'English',
    Timezones: [
        'Antarctica/Macquarie',
        'Australia/Adelaide',
        'Australia/Brisbane',
        'Australia/Broken_Hill',
        'Australia/Darwin',
        'Australia/Eucla',
        'Australia/Hobart',
        'Australia/Lindeman',
        'Australia/Lord_Howe',
        'Australia/Melbourne',
        'Australia/Perth',
        'Australia/Sydney',
    ],
    Hidden: false,
    Passphrase: 'dummyPassphrase',
    SessionKey: {
        Key: 'dummyKey',
        Algorithm: 'dummyAlgorithm',
    },
};

const directory: HolidaysDirectoryCalendar[] = [
    frCalendar,
    chEnCalendar,
    chDeCalendar,
    beNlCalendar,
    beFrCalendar,
    nlCalendar,
    auCalendar,
];

describe('Holidays calendars helpers', () => {
    describe('getHolidaysCalendarsFromTimezone', () => {
        it('should return all holidays calendars from the same time zone', () => {
            const tzid = 'Europe/Zurich';

            const expected = [chEnCalendar, chDeCalendar];
            expect(getHolidaysCalendarsFromTimeZone(directory, tzid)).toEqual(expected);
        });
    });

    describe('getHolidaysCalendarsFromCountryCode', () => {
        it('should return all holidays calendars from the same country code, sorted by languages', () => {
            const countryCode = 'ch';

            const expected = [chDeCalendar, chEnCalendar];
            expect(getHolidaysCalendarsFromCountryCode(directory, countryCode)).toEqual(expected);
        });
    });

    describe('findHolidaysCalendarByCountryCodeAndLanguageCode', () => {
        it('should return the holidays calendar with the same language', () => {
            const countryCode = 'ch';
            const languageTags = ['en'];

            const expected = chEnCalendar;
            expect(findHolidaysCalendarByCountryCodeAndLanguageTag(directory, countryCode, languageTags)).toEqual(
                expected
            );
        });

        it('should return the holidays calendar with the first language', () => {
            const countryCode = 'ch';
            // No calendar with the same language code is available in the options, so we return the first calendar sorted by languages
            const languageTags = ['not in options'];

            const expected = chDeCalendar;
            expect(findHolidaysCalendarByCountryCodeAndLanguageTag(directory, countryCode, languageTags)).toEqual(
                expected
            );
        });
    });

    describe('getSuggestedHolidaysCalendar', () => {
        it('should not return a calendar if no time zone matches', () => {
            const tzid = 'does not exist';
            const protonLanguage = 'en_US';
            const languageTags: string[] = [];

            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toBeUndefined();
        });

        it('should return the only holidays calendar found', () => {
            const tzid = 'Australia/Adelaide';
            const protonLanguage = 'en_US';
            const languageTags = ['en-au'];

            const expected = auCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it('should return the holidays calendar with the same language (one country match)', () => {
            const tzid = 'Europe/Zurich';
            const protonLanguage = 'en_US';
            const languageTags = ['fr-ch'];

            const expected = chEnCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it('should return the holidays calendar with the first language (one country match)', () => {
            const tzid = 'Europe/Zurich';
            // No calendar with the same language code is available in the options, so we return the first calendar sorted by languages
            const protonLanguage = 'nl_NL';
            const languageTags = ['nl-be'];

            const expected = chDeCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it('should return undefined when there is a multiple country match and no language match', () => {
            const tzid = 'Europe/Brussels';
            const protonLanguage = 'en_US';
            const languageTags = ['en-US'];

            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toBeUndefined();
        });

        it('should return the holidays calendar with the country preferred by language (multiple country match)', () => {
            const tzid = 'Europe/Brussels';
            const protonLanguage = 'en_US';
            const languageTags = ['en-US', 'nl-nl'];

            const expected = nlCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it('should return the holidays calendar with the preferred Proton language (multiple country match)', () => {
            const tzid = 'Europe/Brussels';
            const protonLanguage = 'fr_FR';
            const languageTags = ['en-US', 'fr-be'];

            const expected = beFrCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it('should return the holidays calendar with the preferred browser language if the Proton language is not in the list (multiple country match)', () => {
            const tzid = 'Europe/Brussels';
            const protonLanguage = 'es_ES';
            const languageTags = ['en-US', 'fr-be'];

            const expected = beFrCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });

        it(`should return the holidays calendar with the first language if we couldn't match a language (multiple country match)`, () => {
            const tzid = 'Europe/Brussels';
            const protonLanguage = 'es_ES';
            const languageTags = ['en-US', 'en-be'];

            const expected = beNlCalendar;
            expect(getSuggestedHolidaysCalendar(directory, tzid, protonLanguage, languageTags)).toEqual(expected);
        });
    });
});
