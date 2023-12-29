import { c } from 'ttag';

import { MINUTE } from '../../constants';
import { format as formatUTC, isNextDay, isSameDay, isSameMonth, isSameYear } from '../../date-fns-utc';

const getStartsTodayText = (title: string) => {
    return c('Alarm notification').t`${title} starts today`;
};

const getStartsAtText = (title: string, formattedHour: string) => {
    return c('Alarm notification').t`${title} starts at ${formattedHour}`;
};

const getStartsOnText = (title: string, formattedDate: string) => {
    return c('Alarm notification').t`${title} starts on ${formattedDate}`;
};

const getStartsOnAtText = (title: string, formattedDate: string, formattedHour: string) => {
    return c('Alarm notification').t`${title} starts on ${formattedDate} at ${formattedHour}`;
};

const getStartedAtText = (title: string, formattedHour: string) => {
    return c('Alarm notification').t`${title} started at ${formattedHour}`;
};

const getStartedOnText = (title: string, formattedDate: string) => {
    return c('Alarm notification').t`${title} started on ${formattedDate}`;
};

const getStartedOnAtText = (title: string, formattedDate: string, formattedHour: string) => {
    return c('Alarm notification').t`${title} started on ${formattedDate} at ${formattedHour}`;
};

interface Arguments {
    isAllDay: boolean;
    title: string;
    startFakeUTCDate: Date;
    nowFakeUTCDate: Date;
    formatOptions: any;
}
const getAlarmMessageText = ({ title, isAllDay, startFakeUTCDate, nowFakeUTCDate, formatOptions }: Arguments) => {
    const formattedHour = formatUTC(startFakeUTCDate, 'p', formatOptions);
    // because of browser timer imprecision, allow for a one-minute margin to determine simultaneity
    const isNow = Math.abs(+startFakeUTCDate - +nowFakeUTCDate) <= MINUTE / 2;
    const isInFuture = startFakeUTCDate > nowFakeUTCDate;

    if (isNow) {
        return c('Alarm notification').t`${title} starts now`;
    }

    if (!isInFuture) {
        if (isSameDay(nowFakeUTCDate, startFakeUTCDate)) {
            if (isAllDay) {
                return getStartsTodayText(title);
            }
            return getStartedAtText(title, formattedHour);
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
                return getStartedOnText(title, formattedDate);
            }
            return getStartedOnAtText(title, formattedDate, formattedHour);
        }

        if (isSameYear(nowFakeUTCDate, startFakeUTCDate)) {
            const formattedDate = formatUTC(startFakeUTCDate, 'eeee do MMMM', formatOptions);
            if (isAllDay) {
                return getStartedOnText(title, formattedDate);
            }
            return getStartedOnAtText(title, formattedDate, formattedHour);
        }

        if (isAllDay) {
            const formattedDateWithoutTime = formatUTC(startFakeUTCDate, 'PPPP', formatOptions);
            return getStartedOnText(title, formattedDateWithoutTime);
        }
        const formattedDateWithTime = formatUTC(startFakeUTCDate, 'PPPPp', formatOptions);
        return getStartedOnText(title, formattedDateWithTime);
    }

    if (isSameDay(nowFakeUTCDate, startFakeUTCDate)) {
        if (isAllDay) {
            return getStartsTodayText(title);
        }
        return getStartsAtText(title, formattedHour);
    }

    if (isNextDay(nowFakeUTCDate, startFakeUTCDate)) {
        if (isAllDay) {
            return c('Alarm notification').t`${title} starts tomorrow`;
        }
        return c('Alarm notification').t`${title} starts tomorrow at ${formattedHour}`;
    }

    if (isSameMonth(nowFakeUTCDate, startFakeUTCDate)) {
        const formattedDate = formatUTC(startFakeUTCDate, 'eeee do', formatOptions);
        if (isAllDay) {
            return getStartsOnText(title, formattedDate);
        }
        return getStartsOnAtText(title, formattedDate, formattedHour);
    }

    if (isSameYear(nowFakeUTCDate, startFakeUTCDate)) {
        const formattedDate = formatUTC(startFakeUTCDate, 'eeee do MMMM', formatOptions);
        if (isAllDay) {
            return getStartsOnText(title, formattedDate);
        }
        return getStartsOnAtText(title, formattedDate, formattedHour);
    }

    if (isAllDay) {
        const formattedDateWithoutTime = formatUTC(startFakeUTCDate, 'PPPP', formatOptions);
        return getStartsOnText(title, formattedDateWithoutTime);
    }

    const formattedDateWithTime = formatUTC(startFakeUTCDate, 'PPPPp', formatOptions);
    return getStartsOnText(title, formattedDateWithTime);
};

export default getAlarmMessageText;
