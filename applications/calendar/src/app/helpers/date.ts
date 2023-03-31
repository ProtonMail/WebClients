import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromUTCDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';

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
