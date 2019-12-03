import { c } from 'ttag';

import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { dateLocale } from 'proton-shared/lib/i18n';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';

/**
 * Given a list of existing alarms ordered by a Occurrence key,
 * insert a new alarm in the proper place in the list
 * @param {Object} newAlarm
 * @param {Array} existingAlarms
 *
 * @return {Array}
 */
export const insertAlarm = (newAlarm, existingAlarms = []) => {
    const { Occurrence } = newAlarm;
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
