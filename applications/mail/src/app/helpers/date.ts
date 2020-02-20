import { format, formatDistanceToNow as dateFnsFormatDistanceToNow, isToday } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

export const formatSimpleDate = (date: Date) => format(date, isToday(date) ? 'p' : 'PP', { locale: dateLocale });

export const formatFullDate = (date: Date) => format(date, 'PPPPp', { locale: dateLocale });

export const formatDistanceToNow = (date: Date) =>
    dateFnsFormatDistanceToNow(date, { locale: dateLocale, addSuffix: true });
