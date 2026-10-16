/** RFC 5545 BYDAY tokens (e.g. `MO`, `TU`). */
export type WeekdayToken = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

/** Special value to indicate that the schedule should run in the user's local timezone. */
export const ALWAYS_LOCAL_TIMEZONE_ID = 'always_local_time' as const;

/** Type for the special value to indicate that the schedule should run in the user's local timezone. */
type AlwaysLocalTimezoneId = typeof ALWAYS_LOCAL_TIMEZONE_ID;

/** IANA timezone identifier (e.g. `Europe/Zurich`). */
type TimezoneId = string;

interface RecurrenceSchedule {
    /** Timezone-agnostic wall-clock hour (0–23). */
    hour: number;
    /** Timezone-agnostic wall-clock minute (0–59). */
    minute: number;
    /** IANA timezone the schedule should run in, or `always_local_time` to run in the user's local timezone. */
    timezone: TimezoneId | AlwaysLocalTimezoneId;
}

interface OnceRecurrenceRule extends RecurrenceSchedule {
    frequency: 'ONCE';
    /** Timezone-agnostic calendar date in `YYYY-MM-DD` format. */
    date: string;
}

interface DailyRecurrenceRule extends RecurrenceSchedule {
    frequency: 'DAILY';
}

interface WeeklyRecurrenceRule extends RecurrenceSchedule {
    frequency: 'WEEKLY';
    /** Days of the week the schedule should run on (e.g. `['MO', 'TU']`). */
    byWeekDay: WeekdayToken[];
}

interface MonthlyRecurrenceRule extends RecurrenceSchedule {
    frequency: 'MONTHLY';
    /** Days of the month the schedule should run on (e.g. `[1, 15]`). */
    byMonthDay: number[];
}

export type RecurrenceRule = OnceRecurrenceRule | DailyRecurrenceRule | WeeklyRecurrenceRule | MonthlyRecurrenceRule;

export type RecurrenceRuleFrequency = RecurrenceRule['frequency'];
