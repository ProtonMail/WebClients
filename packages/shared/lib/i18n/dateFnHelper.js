import { format } from 'date-fns';
import { dateLocale } from './index';

export const formatWithLocale = (date, formatString) => {
    return format(date, formatString, { locale: dateLocale });
};
