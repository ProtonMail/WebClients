import type { SessionKey } from '@proton/crypto';
import { encryptPassphraseSessionKey, signPassphrase } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import type { Address } from '@proton/shared/lib/interfaces';
import type { CalendarNotificationSettings, HolidaysDirectoryCalendar } from '@proton/shared/lib/interfaces/calendar';
import unique from '@proton/utils/unique';

import { getPrimaryAddress } from '../../helpers/address';
import { getLanguageCode, getNaiveCountryCode } from '../../i18n/helper';
import type { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';

/**
 * Get all holidays calendars corresponding to a certain time zone
 */
export const getHolidaysCalendarsFromTimeZone = (calendars: HolidaysDirectoryCalendar[], tzid: string) => {
    return calendars.filter(({ Timezones }) => Timezones.includes(tzid));
};

/**
 * Get all holidays calendars with the same country code and sort them by language.
 * We might get several holidays calendars in the same country, but with different languages.
 */
export const getHolidaysCalendarsFromCountryCode = (
    holidayCalendars: HolidaysDirectoryCalendar[],
    countryCode: string
) => {
    return holidayCalendars
        .filter(({ CountryCode }) => CountryCode === countryCode)
        .sort((a, b) => a.Language.localeCompare(b.Language));
};

/**
 * Given a list of country codes, find the preferred one based on language preferences. Result can be undefined.
 * See `getSuggestedHolidaysCalendar` for more details on the logic.
 */
export const findPreferredCountryCode = (codes: string[], languageTags: string[]) => {
    if (codes.length === 1) {
        return codes[0];
    }
    for (const tag of languageTags) {
        const languageCountryCode = getNaiveCountryCode(tag);
        const preferredCountryCode = codes.find((code) => code === languageCountryCode);
        if (preferredCountryCode) {
            return preferredCountryCode;
        }
    }
};

/**
 * Given a list of holidays directory calendars, find the preferred one based on language preferences. Result can be undefined.
 * See `getSuggestedHolidaysCalendar` for more details on the logic.
 */
export const findPreferredCalendarByLanguageTag = (calendars: HolidaysDirectoryCalendar[], languageTags: string[]) => {
    if (calendars.length === 1) {
        return calendars[0];
    }
    for (const tag of languageTags) {
        const code = getLanguageCode(tag);
        const preferredCalendar = calendars.find(({ LanguageCode }) => code === LanguageCode.toLowerCase());
        if (preferredCalendar) {
            return preferredCalendar;
        }
    }
};

/**
 * Given a list of holidays directory calendars belonging to one country, find the preferred one based on language preferences. Result can be undefined.
 * See `getSuggestedHolidaysCalendar` for more details on the logic.
 */
export const findHolidaysCalendarByCountryCodeAndLanguageTag = (
    calendars: HolidaysDirectoryCalendar[],
    countryCode: string,
    languageTags: string[]
) => {
    const calendarsFromCountry = getHolidaysCalendarsFromCountryCode(calendars, countryCode);

    return findPreferredCalendarByLanguageTag(calendarsFromCountry, languageTags) || calendarsFromCountry[0];
};

/**
 * Given the user time zone preference, user language preference for the Proton web-apps,
 * and a list of language tags (RFC-5646) expressing the user language preference,
 * we try to find a calendar that matches those in a directory of holidays calendars.
 * The logic for matching is as follows:
 *
 * * First filter the calendars that are compatible with the user time zone.
 *
 * * Then try to match a country:
 * * * If the filtering above returned the empty array, return undefined.
 * * * If the filtered calendars all belong to one country, pick that country.
 * * * If there are several countries in the filtered calendars, use the language tags to find a match. Return first match if any
 * * * [We don't user the Proton language preference here because we assume there's more granularity in
 * * *  the language tags passed. E.g. at the moment a user can't choose nl_BE as Proton language]
 * * * If there's no match, return undefined.
 *
 * * If we got a country match, some calendars (calendar <-> language) will be associated to it:
 * * * If the country has just one associated calendar (<-> language), pick that one.
 * * * If the country has multiple associated calendars (<-> languages):
 * * * * If the Proton language matches one of the languages, pick that one.
 * * * * If no match, if any of the language tags matches one of the languages (we try in the order of preference given), pick that one.
 * * * * If no match, pick the first language in the list.
 */
export const getSuggestedHolidaysCalendar = (
    calendars: HolidaysDirectoryCalendar[],
    tzid: string,
    protonLanguage: string,
    languageTags: string[]
) => {
    // Get all calendars in the same time zone as the user
    const calendarsFromTimeZone = getHolidaysCalendarsFromTimeZone(calendars, tzid);

    if (!calendarsFromTimeZone.length) {
        return;
    }

    const countryCodes = unique(calendarsFromTimeZone.map(({ CountryCode }) => CountryCode));
    const countryCode = findPreferredCountryCode(countryCodes, languageTags);

    if (!countryCode) {
        return;
    }

    return findHolidaysCalendarByCountryCodeAndLanguageTag(calendarsFromTimeZone, countryCode, [
        protonLanguage,
        ...languageTags,
    ]);
};

export const getJoinHolidaysCalendarData = async ({
    holidaysCalendar,
    addresses,
    getAddressKeys,
    color,
    notifications,
    priority,
}: {
    holidaysCalendar: HolidaysDirectoryCalendar;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    color: string;
    notifications: CalendarNotificationSettings[];
    priority?: number;
}) => {
    const {
        CalendarID,
        Passphrase,
        SessionKey: { Key, Algorithm },
    } = holidaysCalendar;

    const primaryAddress = getPrimaryAddress(addresses);
    if (!primaryAddress) {
        throw new Error('No primary address');
    }
    const primaryAddressKey = (await getAddressKeys(primaryAddress.ID))[0];
    if (!primaryAddressKey) {
        throw new Error('No primary address key');
    }

    const { privateKey, publicKey } = primaryAddressKey;

    const [{ encryptedSessionKey }, signature] = await Promise.all([
        encryptPassphraseSessionKey({
            sessionKey: { data: Uint8Array.fromBase64(Key), algorithm: Algorithm } as SessionKey,
            publicKey,
            signingKey: privateKey,
        }),
        signPassphrase({ passphrase: Passphrase, privateKey }),
    ]);

    return {
        calendarID: CalendarID,
        addressID: primaryAddress.ID,
        payload: {
            PassphraseKeyPacket: encryptedSessionKey,
            Signature: signature,
            Color: color,
            DefaultFullDayNotifications: notifications,
            Priority: priority,
        },
    };
};
