import { c } from 'ttag';

import { propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { toUTCDate, fromUTCDate, convertUTCDateTimeToZone } from 'proton-shared/lib/date/timezone';
import formatUTC from 'proton-shared/lib/date-fns-utc/format';
import { dateLocale } from 'proton-shared/lib/i18n';
import { isSameDay, isNextDay, isSameMonth, isSameYear } from 'proton-shared/lib/date-fns-utc/index';

export const getAlarmMessage = ({ dtstart, summary: { value: title } }, now, tzid) => {
    // Determine if the event is happening in timezoned today, tomorrow, this month or this year.
    // For that, compute the UTC times of the timezoned end of today, end of month and end of year
    const UTCStartDate = propertyToUTCDate(dtstart);
    const startDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(UTCStartDate), tzid));
    const nowDateTimezoned = toUTCDate(convertUTCDateTimeToZone(fromUTCDate(now), tzid));

    const formatOptions = { locale: dateLocale };
    const formattedHour = formatUTC(startDateTimezoned, 'p', formatOptions);

    if (isSameDay(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start at ${formattedHour}`;
    }
    if (isNextDay(nowDateTimezoned, startDateTimezoned)) {
        return c('Alarm notification').t`${title} will start tomorrow at ${formattedHour}`;
    }
    if (isSameMonth(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do', formatOptions);
        return c('Alarm notification').t`${title} will start ${formattedDate} at ${formattedHour}`;
    }
    if (isSameYear(nowDateTimezoned, startDateTimezoned)) {
        const formattedDate = formatUTC(startDateTimezoned, 'eeee do MMMM', formatOptions);
        return c('Alarm notification').t`${title} will start ${formattedDate} at ${formattedHour}`;
    }
    const formattedDate = formatUTC(startDateTimezoned, 'PPPp', formatOptions);
    return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
};
