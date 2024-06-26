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

export const timeRemaining = (epoch: number) => {
    const start = Date.now();
    const end = new Date(epochToMs(epoch));

    let { days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start, end });

    if (days) {
        if (hours >= 23) days++;
        return c('Label').ngettext(msgid`${days} day`, `${days} days`, days);
    }

    if (hours) {
        if (minutes >= 59) hours++;
        return c('Label').ngettext(msgid`${hours} hour`, `${hours} hours`, hours);
    }

    if (minutes) return c('Label').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes);

    return c('Label').t`Expired link`;
};
