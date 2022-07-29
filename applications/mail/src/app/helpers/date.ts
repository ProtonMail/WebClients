import { formatDistanceToNow as dateFnsFormatDistanceToNow, format, isThisWeek, isToday, isYesterday } from 'date-fns';
import { c } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';

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
    return format(date, 'PP', { locale: dateLocale });
};

export const formatFullDate = (date: Date) => format(date, 'PPPPp', { locale: dateLocale });

export const formatDistanceToNow = (date: Date) =>
    dateFnsFormatDistanceToNow(date, { locale: dateLocale, addSuffix: true });

export const formatFileNameDate = (date: Date) => format(date, "yyyy-MM-dd'T'HH_mm_ssxxx", { locale: dateLocale });

export const formatScheduledTimeString = (date: Date | number) => {
    return format(date, 'p', { locale: dateLocale });
};

export const formatDateToHuman = (date: Date | number) => {
    return {
        dateString: format(date, 'PPPP', { locale: dateLocale }),
        formattedTime: formatScheduledTimeString(date),
    };
};
