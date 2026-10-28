import { c, msgid } from 'ttag';

import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces';

import { shouldUse12HourClock } from '../../../../../utils/timeFormat';

interface MeetingScheduleInput {
    startTime: Date;
    endTime: Date;
    timeZone: string;
    rrule: string | null;
    timeFormat: SETTINGS_TIME_FORMAT;
    now: Date;
    deviceTimeZone: string;
}

interface CalendarDate {
    year: number;
    month: number;
    day: number;
}

const WEEKDAY_CODES = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;
type WeekdayCode = (typeof WEEKDAY_CODES)[number];

const WORK_WEEK: WeekdayCode[] = ['MO', 'TU', 'WE', 'TH', 'FR'];

type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

type RecurrencePattern =
    | { kind: 'daily'; interval: number }
    | { kind: 'weekly'; interval: number; weekdays: WeekdayCode[] }
    | { kind: 'monthly'; interval: number; dayOfMonth: number }
    | { kind: 'yearly'; interval: number; month: number; dayOfMonth: number }
    | { kind: 'frequencyOnly'; frequency: RecurrenceFrequency };

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const getLocale = () => dateLocale.code || 'en-US';

const getCalendarDate = (date: Date, timeZone: string): CalendarDate => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
    }).formatToParts(date);
    const read = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    return { year: read('year'), month: read('month'), day: read('day') };
};

const getDayNumber = ({ year, month, day }: CalendarDate) => Date.UTC(year, month - 1, day) / MILLISECONDS_PER_DAY;

const getWeekdayCode = (calendarDate: CalendarDate): WeekdayCode => {
    const sundayFirstIndex = new Date(
        Date.UTC(calendarDate.year, calendarDate.month - 1, calendarDate.day)
    ).getUTCDay();
    return WEEKDAY_CODES[(sundayFirstIndex + 6) % 7];
};

const formatMonthDay = (date: Date, timeZone: string) =>
    new Intl.DateTimeFormat(getLocale(), { timeZone, month: 'short', day: 'numeric' }).format(date);

const formatDateLabel = (date: Date, now: Date, timeZone: string) => {
    const dayDifference = getDayNumber(getCalendarDate(date, timeZone)) - getDayNumber(getCalendarDate(now, timeZone));

    if (dayDifference === 0) {
        const monthDay = formatMonthDay(date, timeZone);
        return c('Meeting schedule').t`Today · ${monthDay}`;
    }
    if (dayDifference === 1) {
        const monthDay = formatMonthDay(date, timeZone);
        return c('Meeting schedule').t`Tomorrow · ${monthDay}`;
    }

    const isCurrentYear = getCalendarDate(date, timeZone).year === getCalendarDate(now, timeZone).year;
    return new Intl.DateTimeFormat(getLocale(), {
        timeZone,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        ...(isCurrentYear ? {} : { year: 'numeric' }),
    }).format(date);
};

const formatTime = (date: Date, timeZone: string, timeFormat: SETTINGS_TIME_FORMAT) => {
    const use12Hour = shouldUse12HourClock(timeFormat);
    const parts = new Intl.DateTimeFormat(getLocale(), {
        timeZone,
        hour: use12Hour ? 'numeric' : '2-digit',
        minute: '2-digit',
        hourCycle: use12Hour ? 'h12' : 'h23',
    }).formatToParts(date);
    const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';

    if (!use12Hour) {
        return `${read('hour')}:${read('minute')}`;
    }
    const minutes = read('minute') === '00' ? '' : `:${read('minute')}`;
    return `${read('hour')}${minutes}${read('dayPeriod').toLowerCase()}`;
};

const isWeekdayCode = (value: string): value is WeekdayCode => WEEKDAY_CODES.some((code) => code === value);

const toArray = <T>(value: T | T[] | undefined): T[] => {
    if (value === undefined) {
        return [];
    }
    return Array.isArray(value) ? value : [value];
};

const SUPPORTED_FREQUENCIES: RecurrenceFrequency[] = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];

const isSupportedFrequency = (value: string | undefined): value is RecurrenceFrequency =>
    SUPPORTED_FREQUENCIES.some((frequency) => frequency === value);

const parseRecurrencePattern = (rrule: string, startDate: CalendarDate): RecurrencePattern | null => {
    let parsed: ReturnType<typeof fromRruleString> | undefined;
    try {
        parsed = fromRruleString(rrule);
    } catch {
        return null;
    }
    if (!parsed || !isSupportedFrequency(parsed.freq)) {
        return null;
    }

    const frequency = parsed.freq;
    const interval = parsed.interval ?? 1;
    const byDay = toArray(parsed.byday);
    const byMonthDay = toArray(parsed.bymonthday);
    const frequencyOnly: RecurrencePattern = { kind: 'frequencyOnly', frequency };

    if (parsed.bysetpos !== undefined) {
        return frequencyOnly;
    }

    switch (frequency) {
        case 'DAILY':
            return { kind: 'daily', interval };
        case 'WEEKLY': {
            if (!byDay.every(isWeekdayCode)) {
                return frequencyOnly;
            }
            const weekdays = byDay.length > 0 ? byDay : [getWeekdayCode(startDate)];
            return { kind: 'weekly', interval, weekdays };
        }
        case 'MONTHLY': {
            if (byDay.length > 0 || byMonthDay.length > 1 || byMonthDay.some((day) => day < 1)) {
                return frequencyOnly;
            }
            return { kind: 'monthly', interval, dayOfMonth: byMonthDay[0] ?? startDate.day };
        }
        case 'YEARLY': {
            const hasUnsupportedRule = [byDay, byMonthDay, toArray(parsed.bymonth)].some((rule) => rule.length > 0);
            if (hasUnsupportedRule) {
                return frequencyOnly;
            }
            return { kind: 'yearly', interval, month: startDate.month, dayOfMonth: startDate.day };
        }
    }
};

const formatOrdinal = (value: number) => {
    const locale = getLocale();
    if (!locale.startsWith('en')) {
        return String(value);
    }
    const suffixes: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };
    return `${value}${suffixes[new Intl.PluralRules('en', { type: 'ordinal' }).select(value)]}`;
};

const formatWeekdays = (weekdays: WeekdayCode[]) => {
    const sorted = WEEKDAY_CODES.filter((code) => weekdays.includes(code));
    const mondayReference = Date.UTC(2024, 0, 1);
    const names = sorted.map((code) =>
        new Intl.DateTimeFormat(getLocale(), {
            timeZone: 'UTC',
            weekday: sorted.length === 1 ? 'long' : 'short',
        }).format(mondayReference + WEEKDAY_CODES.indexOf(code) * MILLISECONDS_PER_DAY)
    );
    return new Intl.ListFormat(getLocale(), { style: 'long', type: 'conjunction' }).format(names);
};

const isWorkWeek = (weekdays: WeekdayCode[]) =>
    weekdays.length === WORK_WEEK.length && WORK_WEEK.every((code) => weekdays.includes(code));

const phraseRecurrence = (pattern: RecurrencePattern): string => {
    switch (pattern.kind) {
        case 'daily': {
            const { interval } = pattern;
            return interval === 1
                ? c('Meeting schedule').t`Repeats daily`
                : c('Meeting schedule').ngettext(
                      msgid`Repeats every ${interval} day`,
                      `Repeats every ${interval} days`,
                      interval
                  );
        }
        case 'weekly': {
            const { interval, weekdays } = pattern;
            if (interval === 1 && isWorkWeek(weekdays)) {
                return c('Meeting schedule').t`Repeats every weekday`;
            }
            const days = formatWeekdays(weekdays);
            return interval === 1
                ? c('Meeting schedule').t`Repeats every ${days}`
                : c('Meeting schedule').ngettext(
                      msgid`Repeats every ${interval} week on ${days}`,
                      `Repeats every ${interval} weeks on ${days}`,
                      interval
                  );
        }
        case 'monthly': {
            const { interval } = pattern;
            const ordinalDay = formatOrdinal(pattern.dayOfMonth);
            return interval === 1
                ? c('Meeting schedule').t`Repeats on the ${ordinalDay} of each month`
                : c('Meeting schedule').ngettext(
                      msgid`Repeats every ${interval} month on the ${ordinalDay}`,
                      `Repeats every ${interval} months on the ${ordinalDay}`,
                      interval
                  );
        }
        case 'yearly': {
            const { interval } = pattern;
            const monthDay = formatMonthDay(new Date(Date.UTC(2024, pattern.month - 1, pattern.dayOfMonth)), 'UTC');
            return interval === 1
                ? c('Meeting schedule').t`Repeats every year on ${monthDay}`
                : c('Meeting schedule').ngettext(
                      msgid`Repeats every ${interval} year on ${monthDay}`,
                      `Repeats every ${interval} years on ${monthDay}`,
                      interval
                  );
        }
        case 'frequencyOnly':
            switch (pattern.frequency) {
                case 'DAILY':
                    return c('Meeting schedule').t`Repeats daily`;
                case 'WEEKLY':
                    return c('Meeting schedule').t`Repeats weekly`;
                case 'MONTHLY':
                    return c('Meeting schedule').t`Repeats monthly`;
                case 'YEARLY':
                    return c('Meeting schedule').t`Repeats yearly`;
            }
    }
};

export const formatMeetingSchedule = ({
    startTime,
    endTime,
    timeZone,
    rrule,
    timeFormat,
    now,
    deviceTimeZone,
}: MeetingScheduleInput): { dateTime: string; recurrence: string | null } => {
    const startDate = getCalendarDate(startTime, timeZone);
    const endsOnSameDay = getDayNumber(startDate) === getDayNumber(getCalendarDate(endTime, timeZone));

    const startDateLabel = formatDateLabel(startTime, now, timeZone);
    const startTimeLabel = formatTime(startTime, timeZone, timeFormat);
    const endTimeLabel = formatTime(endTime, timeZone, timeFormat);

    const schedule = endsOnSameDay
        ? c('Meeting schedule').t`${startDateLabel}, ${startTimeLabel} to ${endTimeLabel}`
        : (() => {
              const endDateLabel = formatDateLabel(endTime, now, timeZone);
              return c('Meeting schedule').t`${startDateLabel}, ${startTimeLabel} to ${endDateLabel}, ${endTimeLabel}`;
          })();

    const dateTime = timeZone === deviceTimeZone ? schedule : `${schedule} (${timeZone})`;

    const pattern = rrule === null ? null : parseRecurrencePattern(rrule, startDate);

    return { dateTime, recurrence: pattern === null ? null : phraseRecurrence(pattern) };
};
