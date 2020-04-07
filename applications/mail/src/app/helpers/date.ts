import { format, formatDistanceToNow as dateFnsFormatDistanceToNow, isToday, isYesterday, isThisWeek } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';
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
