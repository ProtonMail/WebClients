import { c } from 'ttag';

import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { dateLocale } from 'proton-shared/lib/i18n';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';

/**
 * Given an object with calendar IDs as keys and lists of ordered alarms as values,
 * insert a new alarm in the proper place in the proper list
 * @param {Object} newAlarm
 * @param {Object} calendarAlarms
 * @param {String} calendarID
 *
 * @return {Array}
 */
export const insertAlarm = (newAlarm, calendarAlarms, calendarID) =>
    Object.keys(calendarAlarms).reduce((acc, ID) => {
        if (ID !== calendarID) {
            acc[ID] = calendarAlarms[ID];
            return acc;
        }
        const { Occurrence } = newAlarm;
        const existingAlarms = calendarAlarms[ID] || [];
        const { newAlarms } = existingAlarms.reduce(
            (acc, alarm) => {
                if (!acc.done && Occurrence <= alarm.Occurrence) {
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
        const newOrderedAlarms =
            newAlarms.length === existingAlarms.length ? [...existingAlarms, newAlarm] : [...newAlarms];
        acc[ID] = newOrderedAlarms;
        return acc;
    }, {});

/**
 * Given an object with calendar IDs as keys and lists of alarms as values,
 * delete an alarm if it's found in any of those lists
 * @param {String} alarmID
 * @param {Object} calendarAlarms
 * @returns {Object}
 */
export const deleteAlarm = (alarmID, calendarAlarms = {}) =>
    Object.keys(calendarAlarms).reduce((acc, calendarID) => {
        acc[calendarID] = calendarAlarms[calendarID].filter(({ ID }) => ID !== alarmID);
        return acc;
    }, {});

export const getAlarmMessage = (rawEvent, now, tzid) => {
    const {
        dtstart,
        summary: { value: title }
    } = rawEvent;

    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const UTCStartDate = propertyToUTCDate(dtstart);
    const startDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(UTCStartDate), tzid));
    const nowDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(new Date(now)), tzid));

    const formattedHour = formatUTC(startDateTimezoned, 'p', { locale: dateLocale });

    if (isSameDay(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start at ${formattedHour}`;
    }
    if (isNextDay(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start tomorrow at ${formattedHour}`;
    }
    if (isSameMonth(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start ${formatUTC(startDateTimezoned, 'eeee do', {
            locale: dateLocale
        })} at ${formattedHour}`;
    }
    if (isSameYear(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start ${formatUTC(startDateTimezoned, 'eeee do MMMM', {
            locale: dateLocale
        })} at ${formattedHour}`;
    }
    return c('Alarm notification').t`${title} will start on ${formatUTC(startDateTimezoned, 'PPPp', {
        locale: dateLocale
    })} at ${formattedHour}`;
};
