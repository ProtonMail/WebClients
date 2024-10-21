import { format } from '@proton/shared/lib/date-fns-utc';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import { dateLocale } from '@proton/shared/lib/i18n';
import { SETTINGS_TIME_FORMAT, type UserSettings } from '@proton/shared/lib/interfaces';

/**
 * Given a date, if we are to display a single time zone offset for the whole day,
 * we pick the UTC offset at noon. DST changes usually happens at 2:00,
 * so the offset at noon is more representative of the offset of the day.
 */
export const getNoonDateForTimeZoneOffset = ({
    date,
    dateTzid,
    targetTzid,
}: {
    date: Date;
    dateTzid: string;
    targetTzid: string;
}) => {
    // Extract year, month and day in the date time zone
    const dateTimeInDateTzid = convertUTCDateTimeToZone(fromUTCDate(date), dateTzid);
    // Pick noon of that date
    const noonDateTimeInDateTzid = {
        ...dateTimeInDateTzid,
        hours: 12,
        minutes: 0,
        seconds: 0,
    };

    // Return date corresponding to the noon above in the target time zone
    return toUTCDate(convertZonedDateTimeToUTC(noonDateTimeInDateTzid, targetTzid));
};

export const formatShortTime = (utcDate: Date, userSettings: UserSettings) => {
    const timeString = format(utcDate, 'p', { locale: dateLocale });
    const is12HourFormat = timeString.includes('AM') || timeString.includes('PM');

    if (
        userSettings.TimeFormat === SETTINGS_TIME_FORMAT.H12 ||
        (is12HourFormat && userSettings.TimeFormat === SETTINGS_TIME_FORMAT.LOCALE_DEFAULT)
    ) {
        if (format(utcDate, 'mm') === '00') {
            // If it's a full hour, display only the hour with AM/PM in lowercase
            return format(utcDate, 'ha', { locale: dateLocale }).toLowerCase();
        } else {
            // Otherwise, display the hour with minutes and AM/PM in lowercase
            return format(utcDate, 'h:mma', { locale: dateLocale }).toLowerCase().replace(/\s/g, ''); // strip spaces
        }
    }

    return timeString;
};
