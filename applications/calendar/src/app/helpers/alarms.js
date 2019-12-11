import { c } from 'ttag';

import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { dateLocale } from 'proton-shared/lib/i18n';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';

export const getAlarmMessage = (component, now, tzid) => {
    const {
        dtstart,
        summary: { value: title }
    } = component;

    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const utcStartDate = propertyToUTCDate(dtstart);
    const startDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(utcStartDate), tzid));
    const nowDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));

    const formatOptions = { locale: dateLocale };
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

    const formattedDate = formatUTC(startDateTimezoned, 'PPP', formatOptions);
    if (isInFuture) {
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }
    return c('Alarm notification').t`${title} started on ${formattedDate} at ${formattedHour}`;
};
