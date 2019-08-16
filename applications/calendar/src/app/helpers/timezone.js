import { listTimeZones, findTimeZone, getZonedTime } from 'timezone-support';

/**
 * Get current timezone by using Intl
 * if not available use timezone-support lib and pick the first timezone from the current date timezone offset
 * @returns {String}
 */
export const getTimezone = () => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch (error) {
        const date = new Date();
        const timezoneOffset = date.getTimezoneOffset();
        const timezones = listTimeZones();
        return timezones.find((tz) => {
            const { zone = {} } = getZonedTime(date, findTimeZone(tz));
            return zone.offset === timezoneOffset;
        });
    }
};
