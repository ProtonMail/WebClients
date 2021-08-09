import {
    format,
    formatDistanceToNow as dateFnsFormatDistanceToNow,
    isToday,
    isYesterday,
    isThisWeek,
    isTomorrow,
} from 'date-fns';
import { dateLocale } from '@proton/shared/lib/i18n';
import { c } from 'ttag';

export const formatSimpleDate = (date: Date) => {
    if (isToday(date)) {
        return format(date, 'p', { locale: dateLocale });
    }
    if (isYesterday(date)) {
        return c('Time').t`Yesterday`;
    }
    if (isThisWeek(date)) {
        return format(date, 'EEEE', { locale: dateLocale });
    }
    return format(date, 'PPP', { locale: dateLocale });
};

export const formatFullDate = (date: Date) => format(date, 'PPPPp', { locale: dateLocale });

export const formatDistanceToNow = (date: Date) =>
    dateFnsFormatDistanceToNow(date, { locale: dateLocale, addSuffix: true });

export const formatFileNameDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH_mm_ssxxx", { locale: dateLocale });

export const formatScheduledDateString = (date: Date | number) => {
    if (isToday(date)) {
        return c('Date label').t`today`;
    }

    if (isTomorrow(date)) {
        return c('Date label').t`tomorrow`;
    }

    const formattedDate = format(date, 'PPPP', { locale: dateLocale });
    // translator: This segment is part of a longer sentence which looks like this "Message will be sent on Tuesday, May 11 at 12:30 PM"
    return c('Date label').t`on ${formattedDate}`;
};

export const formatScheduledTimeString = (date: Date | number) => {
    return format(date, 'p', { locale: dateLocale });
};

export const formatScheduledDate = (date: Date | number) => {
    return {
        dateString: formatScheduledDateString(date),
        formattedTime: formatScheduledTimeString(date),
    };
};
