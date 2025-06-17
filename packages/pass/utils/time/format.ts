import { format, formatISO, formatRelative, intervalToDuration, isThisWeek } from 'date-fns';
import { c, msgid } from 'ttag';

import type { Maybe } from '@proton/pass/types';
import { dateLocale } from '@proton/shared/lib/i18n';
import capitalize from '@proton/utils/capitalize';
import identity from '@proton/utils/identity';

import { epochToMs } from './epoch';

export const formatEpoch = (dateFormat: string) => (epoch: number) =>
    `${format(epochToMs(epoch), dateFormat, { locale: dateLocale })}`;

export const epochToDateTime = formatEpoch('dd MMM yyyy, HH:mm');
export const epochToDate = formatEpoch('dd MMM yyyy');

type RelativeDaysAgoOptions = {
    /** format value is 'dd MMM yyyy, HH:mm' */
    formatDate?: (value: string) => string;
    /** format value is "Today/Tomorrow/Monday-Sunday at 10:30AM" */
    formatDays?: (value: string) => string;
};

export const epochToRelativeDaysAgo = (epoch: number, options?: RelativeDaysAgoOptions) => {
    const date = new Date(epochToMs(epoch));

    return isThisWeek(date)
        ? (options?.formatDays ?? capitalize)(formatRelative(date, new Date(), { locale: dateLocale }))
        : (options?.formatDate ?? identity)(epochToDateTime(epoch));
};

const isExpired = (epoch: number): boolean => {
    const start = Date.now();
    const end = new Date(epochToMs(epoch));
    return start > end.getTime();
};

export const epochToRelativeDuration = (epoch: number): string => {
    const start = Date.now();
    const end = new Date(epochToMs(epoch));

    let { years = 0, months = 0, days = 0, hours = 0, minutes = 0 } = intervalToDuration({ start, end });

    if (years) return c('Label').ngettext(msgid`${years} year`, `${years} years`, years);
    if (months) return c('Label').ngettext(msgid`${months} month`, `${months} months`, months);

    if (days) {
        if (hours >= 23) days++;
        return c('Label').ngettext(msgid`${days} day`, `${days} days`, days);
    }

    if (hours) {
        if (minutes >= 59) hours++;
        return c('Label').ngettext(msgid`${hours} hour`, `${hours} hours`, hours);
    }

    return c('Label').ngettext(msgid`${minutes} minute`, `${minutes} minutes`, minutes);
};

type RemainingDurationOptions = {
    format?: (remaining: string) => string;
    expiredLabel?: string;
};

export const epochToRemainingDuration = (epoch: number, options?: RemainingDurationOptions): string => {
    if (isExpired(epoch)) return options?.expiredLabel ?? c('Label').t`Expired`;
    const format = options?.format ?? identity;
    return format(epochToRelativeDuration(epoch));
};

export const formatTimestamp = (timestamp: string): Maybe<string> => {
    try {
        return format(new Date(timestamp), 'PP', { locale: dateLocale });
    } catch {}
};

export const formatPlaceholder = () => format(new Date(new Date().getFullYear(), 11, 31), 'P', { locale: dateLocale });

export const formatISODate = (date: Date) => formatISO(date).split('T')[0];
