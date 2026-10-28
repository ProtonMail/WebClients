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
import type { Conversation } from '../../../../types';

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

export const getScheduleRunLabel = ({
    isRunning,
    isQueued,
    isFirstInQueue,
    isPaused,
    startedAt,
}: {
    isRunning: boolean;
    isQueued: boolean;
    isFirstInQueue: boolean;
    isPaused: boolean;
    startedAt?: string;
}): string | undefined => {
    if (isQueued) {
        if (isFirstInQueue) {
            // translator: Status of the first task in the execution queue. It will run next, after any execution currently in progress finishes.
            return c('collider_2025:Status').t`Queued · Running next`;
        }
        // translator: Status of a task waiting in the execution queue behind other tasks. It has not started running yet.
        return c('collider_2025:Status').t`Queued`;
    }
    if (isRunning) {
        const elapsed = startedAt ? Math.max(0, Date.now() - Date.parse(startedAt)) : 0;
        if (!Number.isFinite(elapsed) || elapsed < MINUTE) {
            // translator: Status text for a scheduled task that is still running. Its execution started less than a minute ago, or the start time is unavailable.
            return c('collider_2025:Info').t`Started just now`;
        }
        if (elapsed < HOUR) {
            const count = Math.floor(elapsed / MINUTE);
            // translator: Status text for a scheduled task that is still running. ${count} is the number of whole minutes since execution started, e.g. "Started 5 minutes ago".
            return c('collider_2025:Info').ngettext(
                msgid`Started ${count} minute ago`,
                `Started ${count} minutes ago`,
                count
            );
        }
        if (elapsed < DAY) {
            const count = Math.floor(elapsed / HOUR);
            // translator: Status text for a scheduled task that is still running. ${count} is the number of whole hours since execution started, e.g. "Started 2 hours ago".
            return c('collider_2025:Info').ngettext(
                msgid`Started ${count} hour ago`,
                `Started ${count} hours ago`,
                count
            );
        }
        const count = Math.floor(elapsed / DAY);
        // translator: Status text for a scheduled task that is still running. ${count} is the number of whole 24-hour days since execution started, e.g. "Started 2 days ago".
        return c('collider_2025:Info').ngettext(msgid`Started ${count} day ago`, `Started ${count} days ago`, count);
    }
    if (isPaused) {
        // translator: Status text for a disabled scheduled task. "Resume" means enabling its schedule again; this text is informational, not a button.
        return c('collider_2025:Info').t`Resume to run again`;
    }
};

export const getScheduleRunHistoryLabel = (scheduleRun: Conversation['scheduleRun']): string | undefined => {
    if (!scheduleRun) return;
    switch (scheduleRun.status) {
        case 'running':
            // translator: Run history status for a scheduled task whose execution is in progress.
            return c('collider_2025:Status').t`Running`;
        case 'failed':
            // translator: Run history status for a scheduled task whose execution ended with an error.
            return c('collider_2025:Status').t`Failed`;
        case 'interrupted':
            // translator: Run history status for a scheduled task whose execution stopped before completion.
            return c('collider_2025:Status').t`Interrupted`;
    }
    if (scheduleRun.run.manual) {
        // translator: Run history label for a task the user started with the "Run now" action, rather than its scheduled time.
        return c('collider_2025:Status').t`Ran manually`;
    }
    if (scheduleRun.run.late) {
        // translator: Run history label for a task the scheduler reports as late. The cause of the delay is unknown.
        return c('collider_2025:Status').t`Ran late`;
    }
    // translator: Run history label for a completed task the scheduler did not report as late. Older runs without lateness information also use this label.
    return c('collider_2025:Status').t`On schedule`;
};
