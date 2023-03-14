import { SessionKey } from '@proton/crypto';
import { modelToNotifications } from '@proton/shared/lib/calendar/alarms/modelToNotifications';
import { encryptPassphraseSessionKey, signPassphrase } from '@proton/shared/lib/calendar/crypto/keys/calendarKeys';
import { Address } from '@proton/shared/lib/interfaces';
import { HolidaysDirectoryCalendar, NotificationModel } from '@proton/shared/lib/interfaces/calendar';

import { getPrimaryAddress } from '../../helpers/address';
import { base64StringToUint8Array } from '../../helpers/encoding';
import { GetAddressKeys } from '../../interfaces/hooks/GetAddressKeys';

/**
 * Get all holidays calendars corresponding to a certain time zone
 */
export const getHolidaysCalendarsFromTimeZone = (calendars: HolidaysDirectoryCalendar[], tzid: string) => {
    return calendars.filter(({ Timezones }) => Timezones.includes(tzid));
};

/**
 * Get all holidays calendars with the same country code and sort them by language.
 * We might get several holiday calendars in the same country, but with different languages.
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
 * Given a list of holidays calendars, find the first that matches a given language code
 */
export const findHolidaysCalendarByLanguageCode = (
    holidayCalendars: HolidaysDirectoryCalendar[],
    userLanguageCode: string
) => {
    return holidayCalendars.find(({ LanguageCode }) => LanguageCode === userLanguageCode);
};

/**
 * Get default option that will be proposed to the user from a country code and a language code
 * Result can be undefined if nothing is found
 */
export const findHolidaysCalendarByCountryCodeAndLanguageCode = (
    calendars: HolidaysDirectoryCalendar[],
    countryCode: string,
    languageCode: string
) => {
    // TODO check this step. I don't know if we could get calendars with the same timezone but different country
    //      In case this is possible, filter all calendars using the country of the first calendar using the same timezone than the user
    const calendarsFromSameCountry = getHolidaysCalendarsFromCountryCode(calendars, countryCode);

    if (calendarsFromSameCountry.length === 1) {
        // If there is only one Calendar for this country, return this calendar

        return calendarsFromSameCountry[0];
    } else if (calendarsFromSameCountry.length > 0) {
        // Else, we have several calendars for the same country, with different languages

        // Get the holiday calendar with the same language code as the language set by the user in settings
        const defaultCalendarFromLanguage = findHolidaysCalendarByLanguageCode(calendarsFromSameCountry, languageCode);

        // If there is a calendar with the same language as the user has in settings, return this one.
        // Else return the first calendar from the country selected
        return defaultCalendarFromLanguage ? defaultCalendarFromLanguage : calendarsFromSameCountry[0];
    }
};

/**
 * Get the default calendar pre-selected in the HolidaysCalendarsModal.
 * Result can be undefined if nothing is found
 * This default calendar is calculated based on the user timezone and user language code
 */
export const getDefaultHolidaysCalendar = (
    calendars: HolidaysDirectoryCalendar[],
    tzid: string,
    languageCode: string
) => {
    // Get all calendars in the same time zone as the user
    const calendarsFromTimezone = getHolidaysCalendarsFromTimeZone(calendars, tzid);

    // If some calendars are found
    if (calendarsFromTimezone.length > 0) {
        return findHolidaysCalendarByCountryCodeAndLanguageCode(
            calendars,
            calendarsFromTimezone[0].CountryCode,
            languageCode
        );
    }

    // If no option is found based on the time zone, return undefined
    return undefined;
};

export const getJoinHolidaysCalendarData = async ({
    holidaysCalendar,
    addresses,
    getAddressKeys,
    color,
    notifications,
}: {
    holidaysCalendar: HolidaysDirectoryCalendar;
    addresses: Address[];
    getAddressKeys: GetAddressKeys;
    color: string;
    notifications: NotificationModel[];
}) => {
    const {
        CalendarID,
        Passphrase,
        SessionKey: { Key, Algorithm },
    } = holidaysCalendar;

    const primaryAddress = getPrimaryAddress(addresses);
    const primaryAddressKey = (await getAddressKeys(primaryAddress.ID))[0];
    if (!primaryAddressKey) {
        throw new Error('No primary address key');
    }

    const { privateKey, publicKey } = primaryAddressKey;

    const [{ encryptedSessionKey }, signature] = await Promise.all([
        encryptPassphraseSessionKey({
            sessionKey: { data: base64StringToUint8Array(Key), algorithm: Algorithm } as SessionKey,
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
            DefaultFullDayNotifications: modelToNotifications(notifications),
        },
    };
};
