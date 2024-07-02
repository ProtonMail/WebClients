import { format, formatRelative, intervalToDuration, isThisWeek } from 'date-fns';
import { c, msgid } from 'ttag';

import { dateLocale } from '@proton/shared/lib/i18n';
import capitalize from '@proton/utils/capitalize';
import identity from '@proton/utils/identity';

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

type TimeRemainingOptions = {
    format?: (remaining: string) => string;
    expiredLabel?: string;
};

export const timeRemaining = (epoch: number, options?: TimeRemainingOptions): string => {
    const start = Date.now();
    const end = new Date(epochToMs(epoch));
    const format = options?.format ?? identity;

    if (start > end.getTime()) return options?.expiredLabel ?? c('Label').t`Expired`;

    let { days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start, end });

    if (days) {
        if (hours >= 23) days++;
        return format(c('Label').ngettext(msgid`${days} day`, `${days} days`, days));
    }

    if (hours) {
        if (minutes >= 59) hours++;
        return format(c('Label').ngettext(msgid`${hours} hour`, `${hours} hours`, hours));
    }

    return format(c('Label').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes));
};
