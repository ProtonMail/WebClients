import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import { truncate } from 'proton-shared/lib/helpers/string';
import getAlarmMessageText from './getAlarmMessageText';

/**
 * Given a raw event, (optionally) its starting date, the date now and a timezone id,
 * generate a notification message for the event
 * @param {object} component
 * @param {Date} start (optional)
 * @param {Date} now
 * @param {string} tzid
 * @param {object} formatOptions    format options.
 * @returns {string}
 */
export const getAlarmMessage = ({ component, start, now, tzid, formatOptions }) => {
    const {
        dtstart,
        summary: { value }
    } = component;
    const title = truncate(value, 100);
    const utcStartDate = start || propertyToUTCDate(dtstart);

    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const startDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStartDate), tzid));
    const nowDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));

    const isAllDay = isIcalAllDay(component);

    return getAlarmMessageText({
        title,
        isAllDay,
        startDateTimezoned,
        nowDateTimezoned,
        formatOptions
    });
};
