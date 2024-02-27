import { format, formatRelative, isThisWeek } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import capitalize from '@proton/utils/capitalize';

export const getFormattedDateFromTimestamp = (timestamp: number) => {
    return `${format(new Date(timestamp * 1000), 'dd MMM yyyy, HH:mm', { locale: dateLocale })}`;
};

export const getFormattedDayFromTimestamp = (timestamp: number) => {
    return format(new Date(timestamp * 1000), 'dd MMM yyyy', { locale: dateLocale });
};

export const getRelativeDateFromTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    if (isThisWeek(date)) {
        return `${capitalize(formatRelative(date, new Date(), { locale: dateLocale }))}`;
    }
    return getFormattedDateFromTimestamp(timestamp);
};
