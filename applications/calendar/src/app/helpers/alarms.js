import { c } from 'ttag';

import { isIcalAllDay } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';
import { truncate } from 'proton-shared/lib/helpers/string';

/**
 * Given a raw event, the date when it starts, the date now and a timezone id,
 * generate a notification message for the event
 * @param {object} component
 * @param {Date} start
 * @param {Date} now
 * @param {string} tzid
 * @param {object} formatOptions    format options.
 * @returns {string}
 */
export const getAlarmMessage = (component, start, now, tzid, formatOptions) => {
    const {
        summary: { value }
    } = component;
    const title = truncate(value, 100);

    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const startDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(start), tzid));
    const nowDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));

    const formattedHour = formatUTC(startDateTimezoned, 'p', formatOptions);

    const isAllDay = isIcalAllDay(component);
    const isInFuture = startDateTimezoned >= nowDateTimezoned;

    if (isSameDay(nowDateTimezoned, startDateTimezoned)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} started today`;
        }
        if (isInFuture) {
            return c('Alarm notification').t`${title} will start at ${formattedHour}`;
        }
        return c('Alarm notification').t`${title} started at ${formattedHour}`;
    }

    if (isNextDay(nowDateTimezoned, startDateTimezoned)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start tomorrow`;
        }
        return c('Alarm notification').t`${title} will start tomorrow at ${formattedHour}`;
    }

    if (isSameMonth(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isSameYear(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do MMMM', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isAllDay) {
        const formattedDateWithoutTime = formatUTC(startDateTimezoned, 'PPPP', formatOptions);
        return c('Alarm notification').t`${title} will start on ${formattedDateWithoutTime}`;
    }
    const formattedDateWithTime = formatUTC(startDateTimezoned, 'PPPPp', formatOptions);
    if (isInFuture) {
        return c('Alarm notification').t`${title} will start on ${formattedDateWithTime}`;
    }
    return c('Alarm notification').t`${title} started on ${formattedDateWithTime}`;
};
