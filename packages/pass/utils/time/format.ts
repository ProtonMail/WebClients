import { format, formatRelative, isThisWeek } from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import capitalize from '@proton/utils/capitalize';

import { epochToMs } from './epoch';

export const formatEpoch = (dateFormat: string) => (epoch: number) =>
    `${format(epochToMs(epoch), dateFormat, { locale: dateLocale })}`;

export const epochToDateTime = formatEpoch('dd MMM yyyy, HH:mm');
export const epochToDate = formatEpoch('dd MMM yyyy');

export const epochToRelativeDate = (epoch: number) => {
    const date = new Date(epochToMs(epoch));

    return isThisWeek(date)
        ? `${capitalize(formatRelative(date, new Date(), { locale: dateLocale }))}`
        : epochToDateTime(epoch);
};
