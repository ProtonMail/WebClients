import { c } from 'ttag';

import { isNextDay, isSameDay, isSameMonth, isSameYear, format as formatUTC } from '../date-fns-utc';

interface Arguments {
    isAllDay: boolean;
    title: string;
    startFakeUTCDate: Date;
    nowFakeUTCDate: Date;
    formatOptions: any;
}
const getAlarmMessageText = ({ title, isAllDay, startFakeUTCDate, nowFakeUTCDate, formatOptions }: Arguments) => {
    const formattedHour = formatUTC(startFakeUTCDate, 'p', formatOptions);
    // because of browser timer imprecisions, allow for a 1 minute margin to determine simultaneity
    const isNow = Math.abs(+startFakeUTCDate - +nowFakeUTCDate) <= 30 * 1000;
    const isInFuture = startFakeUTCDate > nowFakeUTCDate;

    if (isNow) {
        return c('Alarm notification').t`${title} starts now`;
    }

    if (!isInFuture) {
        if (isSameDay(nowFakeUTCDate, startFakeUTCDate)) {
            if (isAllDay) {
                return c('Alarm notification').t`${title} starts today`;
            }
            return c('Alarm notification').t`${title} started at ${formattedHour}`;
        }
        if (isNextDay(startFakeUTCDate, nowFakeUTCDate)) {
            if (isAllDay) {
                return c('Alarm notification').t`${title} started yesterday`;
            }
            return c('Alarm notification').t`${title} started yesterday at ${formattedHour}`;
        }

        if (isSameMonth(nowFakeUTCDate, startFakeUTCDate)) {
            const formattedDate = formatUTC(startFakeUTCDate, 'eeee do', formatOptions);
            if (isAllDay) {
                return c('Alarm notification').t`${title} started on ${formattedDate}`;
            }
            return c('Alarm notification').t`${title} started on ${formattedDate} at ${formattedHour}`;
        }

        if (isSameYear(nowFakeUTCDate, startFakeUTCDate)) {
            const formattedDate = formatUTC(startFakeUTCDate, 'eeee do MMMM', formatOptions);
            if (isAllDay) {
                return c('Alarm notification').t`${title} started on ${formattedDate}`;
            }
            return c('Alarm notification').t`${title} started on ${formattedDate} at ${formattedHour}`;
        }

        if (isAllDay) {
            const formattedDateWithoutTime = formatUTC(startFakeUTCDate, 'PPPP', formatOptions);
            return c('Alarm notification').t`${title} started on ${formattedDateWithoutTime}`;
        }
        const formattedDateWithTime = formatUTC(startFakeUTCDate, 'PPPPp', formatOptions);
        return c('Alarm notification').t`${title} started on ${formattedDateWithTime}`;
    }

    if (isSameDay(nowFakeUTCDate, startFakeUTCDate)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} starts today`;
        }
        return c('Alarm notification').t`${title} will start at ${formattedHour}`;
    }

    if (isNextDay(nowFakeUTCDate, startFakeUTCDate)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start tomorrow`;
        }
        return c('Alarm notification').t`${title} will start tomorrow at ${formattedHour}`;
    }

    if (isSameMonth(nowFakeUTCDate, startFakeUTCDate)) {
        const formattedDate = formatUTC(startFakeUTCDate, 'eeee do', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isSameYear(nowFakeUTCDate, startFakeUTCDate)) {
        const formattedDate = formatUTC(startFakeUTCDate, 'eeee do MMMM', formatOptions);
        if (isAllDay) {
            return c('Alarm notification').t`${title} will start on ${formattedDate}`;
        }
        return c('Alarm notification').t`${title} will start on ${formattedDate} at ${formattedHour}`;
    }

    if (isAllDay) {
        const formattedDateWithoutTime = formatUTC(startFakeUTCDate, 'PPPP', formatOptions);
        return c('Alarm notification').t`${title} will start on ${formattedDateWithoutTime}`;
    }

    const formattedDateWithTime = formatUTC(startFakeUTCDate, 'PPPPp', formatOptions);
    return c('Alarm notification').t`${title} will start on ${formattedDateWithTime}`;
};

export default getAlarmMessageText;
