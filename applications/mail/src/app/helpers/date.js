import { format, formatDistanceToNow as dateFnsFormatDistanceToNow, isToday } from 'date-fns';
import { dateLocale } from 'proton-shared/lib/i18n';

export const formatSimpleDate = (date) => format(date, isToday(date) ? 'p' : 'PP', { locale: dateLocale });

export const formatFullDate = (date) => format(date, 'PPPPp', { locale: dateLocale });

export const formatDistanceToNow = (date) => dateFnsFormatDistanceToNow(date, { locale: dateLocale, addSuffix: true });
