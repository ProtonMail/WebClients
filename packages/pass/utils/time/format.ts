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

/** Creates a Date object from a YYYY-MM-DD string in the user's local timezone.
 * This function avoids timezone drift issues that occur when using the Date constructor
 * with ISO date strings. The Date constructor interprets 'YYYY-MM-DD' as UTC midnight,
 * which then gets converted to local time and can shift to the previous day.
 *
 * ```
 * new Date('1990-12-14')
 * > Thu Dec 13 1990 19:00:00 GMT-0500 (EST) -- Wrong day
 *
 * dateFromYYYYMMDD('1990-12-14')
 * > Fri Dec 14 1990 00:00:00 GMT-0500 (EST) -- Correct day
 * ```
 */
export const dateFromYYYYMMDD = (yyyymmdd: string): Maybe<Date> => {
    if (!/^\d{4}-\d{1,2}-\d{1,2}$/.test(yyyymmdd)) return;
    const [year, month, day] = yyyymmdd.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (isFinite(date.getTime())) return date;
};

/** Formats a `YYYY-MM-DD` date string into a human-readable format.
 * Avoids timezone drift by using `dateFromYYYYMMDD` internally. */
export const formatYYYYMMDD = (yyyymmdd: string): Maybe<string> => {
    try {
        const date = dateFromYYYYMMDD(yyyymmdd);
        if (date) return format(date, 'PP', { locale: dateLocale });
    } catch {}
};

/** Formats a Date object to ISO date string (YYYY-MM-DD format) in UTC. */
export const formatISODate = (date: Date) => formatISO(date).split('T')[0];

/** Creates a sample date using December 31st of the current year to demonstrate
 * the date format to users. Uses day 31 to avoid ambiguity between month/day
 * ordering in different locales (since no month has 31 as a valid month number).
 *
 * ```
 * formatPlaceholder() // → "12/31/2024" (in en-US)
 * formatPlaceholder() // → "31/12/2024" (in en-GB)
 * ```
 */
export const formatPlaceholder = () => format(new Date(new Date().getFullYear(), 11, 31), 'P', { locale: dateLocale });
