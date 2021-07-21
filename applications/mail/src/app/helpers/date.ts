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

export const formatScheduledDate = (date: Date | number) => {
    const formattedDate = format(date, 'EEEE, MMMM d', { locale: dateLocale });
    const formattedTime = format(date, 'p', { locale: dateLocale });

    // translator: This segment is part of a longer sentence which looks like this "Message will be sent on Tuesday, May 11 at 12:30 PM"
    let dateString = c('Date label').t`on ${formattedDate}`;

    if (isToday(date)) {
        dateString = c('Date label').t`today`;
    }

    if (isTomorrow(date)) {
        dateString = c('Date label').t`tomorrow`;
    }

    return { dateString, formattedTime };
};
