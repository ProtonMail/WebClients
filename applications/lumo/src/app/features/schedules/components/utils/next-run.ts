import { c, msgid } from 'ttag';

import { DAY, HOUR, MINUTE } from '@proton/shared/lib/constants';
import {
    convertUTCDateTimeToZone,
    convertZonedDateTimeToUTC,
    fromLocalDate,
    fromUTCDate,
    toLocalDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';

import type { RecurrenceRule } from '../../../../components/RecurrenceRuleFieldset/types';
import { ALWAYS_LOCAL_TIMEZONE_ID } from '../../../../components/RecurrenceRuleFieldset/types';
import { WEEKDAY_TOKENS_BY_CALENDAR_INDEX } from '../../../../components/RecurrenceRuleFieldset/utils';

/** The next future occurrence, using the same wall-clock/timezone conversion as the editor's validation. */
export const getNextScheduleRun = (rule: RecurrenceRule, now: Date): Date | undefined => {
    const isLocal = rule.timezone === ALWAYS_LOCAL_TIMEZONE_ID;
    const toRunDate = (date: {
        year: number;
        month: number;
        day: number;
        hours: number;
        minutes: number;
        seconds: number;
    }) => (isLocal ? toLocalDate(date) : toUTCDate(convertZonedDateTimeToUTC(date, rule.timezone)));

    if (rule.frequency === 'ONCE') {
        const [year, month, day] = rule.date.split('-').map(Number);
        const runAt = toRunDate({ year, month, day, hours: rule.hour, minutes: rule.minute, seconds: 0 });
        return runAt > now ? runAt : undefined;
    }

    const today = isLocal ? fromLocalDate(now) : convertUTCDateTimeToZone(fromUTCDate(now), rule.timezone);
    // Advance calendar dates in UTC so browser-local DST cannot alter the date being considered.
    const calendarDate = new Date(Date.UTC(today.year, today.month - 1, today.day));

    // The longest supported gap is a monthly 31st skipping a short month (at most 61 days).
    for (let offset = 0; offset <= 62; offset++) {
        const dayMatches =
            rule.frequency === 'DAILY' ||
            (rule.frequency === 'WEEKLY' &&
                rule.byWeekDay.includes(WEEKDAY_TOKENS_BY_CALENDAR_INDEX[calendarDate.getUTCDay()])) ||
            (rule.frequency === 'MONTHLY' && rule.byMonthDay.includes(calendarDate.getUTCDate()));

        if (dayMatches) {
            const runAt = toRunDate({
                ...fromUTCDate(calendarDate),
                hours: rule.hour,
                minutes: rule.minute,
                seconds: 0,
            });
            if (runAt > now) return runAt;
        }
        calendarDate.setUTCDate(calendarDate.getUTCDate() + 1);
    }
};

/** A compact approximation in minutes, hours, or days. */
export const getScheduleNextRunLabel = (rule: RecurrenceRule, now: Date): string | undefined => {
    const nextRun = getNextScheduleRun(rule, now);
    if (!nextRun) return;

    const remaining = nextRun.getTime() - now.getTime();

    if (remaining < HOUR * 2) {
        const count = Math.ceil(remaining / MINUTE);
        // translator: Time until a scheduled task's next run. ${count} is the number of minutes remaining, rounded up to at least one minute.
        return c('collider_2025:Info').ngettext(
            msgid`Next run in ${count} minute`,
            `Next run in ${count} minutes`,
            count
        );
    }

    if (remaining < DAY * 2) {
        const count = Math.floor(remaining / HOUR);
        // translator: Approximate time until a scheduled task's next run. ${count} is the number of whole hours remaining.
        return c('collider_2025:Info').ngettext(msgid`Next run in ${count} hour`, `Next run in ${count} hours`, count);
    }

    const count = Math.floor(remaining / DAY);
    // translator: Approximate time until a scheduled task's next run. ${count} is the number of whole 24-hour days remaining.
    return c('collider_2025:Info').ngettext(msgid`Next run in ${count} day`, `Next run in ${count} days`, count);
};
