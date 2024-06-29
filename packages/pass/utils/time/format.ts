import { format, formatRelative, intervalToDuration, isThisWeek } from 'date-fns';
import { c, msgid } from 'ttag';

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

type TimeRemaining = { label: string; isExpired: boolean };
export const timeRemaining = (epoch: number): TimeRemaining => {
    const start = Date.now();
    const end = new Date(epochToMs(epoch));

    if (start > end.getTime()) return { label: c('Label').t`Expired link`, isExpired: true };

    let { days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start, end });

    if (days) {
        if (hours >= 23) days++;
        return { label: c('Label').ngettext(msgid`${days} day`, `${days} days`, days), isExpired: false };
    }

    if (hours) {
        if (minutes >= 59) hours++;
        return { label: c('Label').ngettext(msgid`${hours} hour`, `${hours} hours`, hours), isExpired: false };
    }

    return {
        label: c('Label').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes),
        isExpired: false,
    };
};
