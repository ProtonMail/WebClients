import { formatInTimeZone } from 'date-fns-tz';

export const calendarDateFormats = (date: Date, timezone?: string) => {
    let localCompactWithTimezone: string | undefined = undefined;

    if (timezone) {
        localCompactWithTimezone = formatInTimeZone(date, timezone, "yyyyMMdd'T'HHmmss");
    }

    const utcCompact = formatInTimeZone(date, 'UTC', "yyyyMMdd'T'HHmmss'Z'");
    const utcISO = formatInTimeZone(date, 'UTC', "yyyy-MM-dd'T'HH:mm:ss'Z'");

    return {
        localCompactWithTimezone,
        utcCompact,
        utcISO,
    };
};
