import { addDays, format } from 'date-fns';
import { c } from 'ttag';

import type { WeekStartsOn } from '@proton/shared/lib/date-fns-utc/interface';
import { formatIntlDate } from '@proton/shared/lib/date/formatIntlDate';
import { dateLocale } from '@proton/shared/lib/i18n';

import type { RecurrenceRule, WeekdayToken } from '../../../../components/RecurrenceRuleFieldset/types';
import { sortWeekdayTokensByDisplayOrder } from '../../../../components/RecurrenceRuleFieldset/utils';

/** Gets a reference date for a weekday token. */
const getReferenceDate = (token: WeekdayToken): Date => {
    const offsets = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 };
    return addDays(new Date(2024, 0, 1), offsets[token]);
};

/** Checks if a set of weekdays is equal to a set of expected weekdays. */
const isWeekdaySet = (days: WeekdayToken[], expected: readonly WeekdayToken[]): boolean => {
    if (days.length !== expected.length) {
        return false;
    }

    const selected = new Set(days);

    return expected.every((day) => selected.has(day));
};

/**
 * Creates a human-readable cadence label for the schedule.
 * @param rule - The recurrence rule to get the cadence label for, e.g.
 * ```
 * {
 *     frequency: 'WEEKLY',
 *     byWeekDay: ['MO', 'TU', 'WE', 'TH', 'FR'],
 *     hour: 7,
 *     minute: 45,
 * }
 * ```
 * @returns A human-readable cadence label for the schedule (e.g. "Weekdays at 7:45 AM").
 */
export const getScheduleCadenceLabel = (rule: RecurrenceRule, weekStartsOn: WeekStartsOn): string => {
    // UTC is only a formatting container for wall-clock fields, not the schedule's execution timezone.
    const timeLabel = formatIntlDate(new Date(Date.UTC(2000, 0, 1, rule.hour, rule.minute)), {
        timeStyle: 'short',
        timeZone: 'UTC',
    });

    switch (rule.frequency) {
        case 'DAILY':
            // translator: Schedule cadence label for a daily task. ${timeLabel} is a localized time (e.g. "7:45 AM").
            return c('collider_2025:Label').t`Daily at ${timeLabel}`;
        case 'WEEKLY': {
            if (isWeekdaySet(rule.byWeekDay, ['MO', 'TU', 'WE', 'TH', 'FR'])) {
                // translator: Schedule cadence label for weekdays (Monday through Friday). ${timeLabel} is a localized time.
                return c('collider_2025:Label').t`Weekdays at ${timeLabel}`;
            }

            if (rule.byWeekDay.length === 1) {
                const dayName = format(getReferenceDate(rule.byWeekDay[0]), 'EEEE', { locale: dateLocale });
                // translator: Schedule cadence for a single weekday. ${dayName} is e.g. "Friday"; ${timeLabel} is a localized time.
                return c('collider_2025:Label').t`Every ${dayName} at ${timeLabel}`;
            }

            const dayNames = sortWeekdayTokensByDisplayOrder(rule.byWeekDay, weekStartsOn)
                .map((token) => format(getReferenceDate(token), 'EEE', { locale: dateLocale }))
                .join(', ');
            // translator: Schedule cadence for weekly tasks on specific days. ${dayNames} is comma-separated weekday names; ${timeLabel} is a localized time.
            return c('collider_2025:Label').t`Weekly on ${dayNames} at ${timeLabel}`;
        }
        case 'MONTHLY': {
            const days = [...rule.byMonthDay]
                .sort((a, b) => a - b)
                // Localized ordinal day of month (e.g. "1st", "5th").
                .map((dayOfMonth) => format(new Date(2000, 0, dayOfMonth), 'do', { locale: dateLocale }))
                .join(', ');
            // translator: Schedule cadence for monthly tasks. ${days} is comma-separated localized ordinal days (e.g. "1st, 5th"); ${timeLabel} is a localized time.
            return c('collider_2025:Label').t`Monthly on ${days} at ${timeLabel}`;
        }
        case 'ONCE': {
            const [year, month, day] = rule.date.split('-').map(Number);
            const onceAt = new Date(Date.UTC(year, month - 1, day, rule.hour, rule.minute));
            const dateTimeLabel = formatIntlDate(onceAt, {
                dateStyle: 'short',
                timeStyle: 'short',
                timeZone: 'UTC',
            });
            // translator: Schedule cadence for a one-time task. ${dateTimeLabel} is a locale-formatted date and time.
            return c('collider_2025:Label').t`Once on ${dateTimeLabel}`;
        }
        default:
            return timeLabel;
    }
};
