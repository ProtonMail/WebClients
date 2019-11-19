import { c } from 'ttag';

import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';

/**
 * Given a list of existing alarms ordered by a NextOccurrence key,
 * insert a new alarm in the proper place in the list
 * @param {Object} newAlarm
 * @param {Array} existingAlarms
 *
 * @return {Array}
 */
export const insertAlarm = (newAlarm, existingAlarms = []) => {
    const { NextOccurrence } = newAlarm;
    const { newAlarms } = existingAlarms.reduce(
        (acc, alarm) => {
            if (!acc.done && NextOccurrence <= alarm.NextOccurrence) {
                acc.newAlarms.push(newAlarm, alarm);
                acc.done = true;
            } else {
                acc.newAlarms.push(alarm);
            }
            return acc;
        },
        { newAlarms: [], done: false }
    );
    // if the new alarm was not added (either because it must be added last or there were no existing alarms), add it at the end
    return newAlarms.length === existingAlarms.length ? [...existingAlarms, newAlarm] : [...newAlarms];
};

export const getAlarmMessage = (rawEvent, now, tzid) => {
    const {
        dtstart,
        summary: { value: title }
    } = rawEvent;

    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const UTCStartDate = propertyToUTCDate(dtstart);
    const startTimeZoned = convertUTCDateTimeToZone(fromUTCDate(UTCStartDate), tzid);
    const startDateTimeZoned = toUTCDate(startTimeZoned);
    const nowTimezoned = convertUTCDateTimeToZone(fromUTCDate(new Date(now)), tzid);
    const nowDateTimezoned = toUTCDate(nowTimezoned);

    const isToday = isSameDay(nowDateTimezoned, startDateTimeZoned);
    const isTomorrow = isNextDay(nowDateTimezoned, startDateTimeZoned);
    const isThisMonth = isSameMonth(nowDateTimezoned, startDateTimeZoned);
    const isThisYear = isSameYear(nowDateTimezoned, startDateTimeZoned);

    if (isToday) {
        return c('Alarm notification').t`${title} will start at ${formatUTC(startDateTimeZoned, 'p')}`;
    }
    if (isTomorrow) {
        return c('Alarm notification').t`${title} will start tomorrow at ${formatUTC(startDateTimeZoned, 'p')}`;
    }
    if (isThisMonth) {
        return c('Alarm notification').t`${title} will start ${formatUTC(startDateTimeZoned, 'eeee do')} at ${formatUTC(
            startDateTimeZoned,
            'p'
        )}`;
    }
    if (isThisYear) {
        return c('Alarm notification').t`${title} will start ${formatUTC(
            startDateTimeZoned,
            'eeee do MMMM'
        )} at ${formatUTC(startDateTimeZoned, 'p')}`;
    }
    return c('Alarm notification').t`${title} will start on ${formatUTC(startDateTimeZoned, 'PPPp')}`;
};
