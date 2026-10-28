import { formatInTimeZone } from 'date-fns-tz';
import { c, msgid } from 'ttag';

import { fromRruleString } from '@proton/shared/lib/calendar/vcal';
import { getShortenDayFormat } from '@proton/shared/lib/date/date';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { SETTINGS_DATE_FORMAT, SETTINGS_TIME_FORMAT } from '@proton/shared/lib/interfaces/UserSettings';

import { getExplicitDateFormatPattern } from '../../../../../utils/dateFormat';
import { shouldUse12HourClock } from '../../../../../utils/timeFormat';

interface MeetingScheduleInput {
    startTime: Date;
    endTime: Date;
    timeZone: string;
    rrule: string | null;
    timeFormat: SETTINGS_TIME_FORMAT;
    dateFormat: SETTINGS_DATE_FORMAT;
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

const formatMonthDay = (date: Date, timeZone: string, dateFormat: SETTINGS_DATE_FORMAT) => {
    const pattern = getExplicitDateFormatPattern(dateFormat, { month: 'MMM', withYear: false });
    if (pattern) {
        return formatInTimeZone(date, timeZone, pattern, { locale: dateLocale });
    }
    return new Intl.DateTimeFormat(getLocale(), { timeZone, month: 'short', day: 'numeric' }).format(date);
};

const formatDateLabel = (date: Date, now: Date, timeZone: string, dateFormat: SETTINGS_DATE_FORMAT) => {
    const dayDifference = getDayNumber(getCalendarDate(date, timeZone)) - getDayNumber(getCalendarDate(now, timeZone));

    if (dayDifference === 0) {
        const monthDay = formatMonthDay(date, timeZone, dateFormat);
        return c('Meeting schedule').t`Today · ${monthDay}`;
    }
    if (dayDifference === 1) {
        const monthDay = formatMonthDay(date, timeZone, dateFormat);
        return c('Meeting schedule').t`Tomorrow · ${monthDay}`;
    }

    const isCurrentYear = getCalendarDate(date, timeZone).year === getCalendarDate(now, timeZone).year;
    const pattern = getExplicitDateFormatPattern(dateFormat, { month: 'MMM', withYear: !isCurrentYear });
    if (pattern) {
        return formatInTimeZone(date, timeZone, `EEE, ${pattern}`, { locale: dateLocale });
    }
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
    const locale = getLocale();
    const formatter = new Intl.DateTimeFormat(locale, {
        timeZone,
        hour: use12Hour ? 'numeric' : '2-digit',
        minute: '2-digit',
        hourCycle: use12Hour ? 'h12' : 'h23',
    });

    if (!use12Hour || !locale.startsWith('en')) {
        return formatter.format(date);
    }

    const parts = formatter.formatToParts(date);
    const read = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
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

const formatWeekdayName = (code: WeekdayCode, weekday: 'long' | 'short') =>
    new Intl.DateTimeFormat(getLocale(), { timeZone: 'UTC', weekday }).format(
        Date.UTC(2024, 0, 1) + WEEKDAY_CODES.indexOf(code) * MILLISECONDS_PER_DAY
    );

const sortWeekdays = (weekdays: WeekdayCode[]) => WEEKDAY_CODES.filter((code) => weekdays.includes(code));

const formatWeekdayList = (weekdays: WeekdayCode[]) => {
    const names = sortWeekdays(weekdays).map((code) => formatWeekdayName(code, 'short'));
    const lastWeekday = names[names.length - 1];
    const leadingWeekdays = names.slice(0, -1).join(', ');
    return c('Meeting schedule').t`${leadingWeekdays} and ${lastWeekday}`;
};

const isWorkWeek = (weekdays: WeekdayCode[]) =>
    weekdays.length === WORK_WEEK.length && WORK_WEEK.every((code) => weekdays.includes(code));

const phraseRecurrence = (pattern: RecurrencePattern, dateFormat: SETTINGS_DATE_FORMAT): string => {
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
            if (weekdays.length === 1) {
                const weekdayName = formatWeekdayName(weekdays[0], 'long');
                return interval === 1
                    ? c('Meeting schedule').t`Repeats every ${weekdayName}`
                    : c('Meeting schedule').ngettext(
                          msgid`Repeats every ${interval} week on ${weekdayName}`,
                          `Repeats every ${interval} weeks on ${weekdayName}`,
                          interval
                      );
            }
            const weekdayList = formatWeekdayList(weekdays);
            return interval === 1
                ? c('Meeting schedule, several weekdays').t`Repeats every ${weekdayList}`
                : c('Meeting schedule, several weekdays').ngettext(
                      msgid`Repeats every ${interval} week on ${weekdayList}`,
                      `Repeats every ${interval} weeks on ${weekdayList}`,
                      interval
                  );
        }
        case 'monthly': {
            const { interval } = pattern;
            const ordinalDay = getShortenDayFormat(new Date(2024, 0, pattern.dayOfMonth));
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
            const monthDay = formatMonthDay(
                new Date(Date.UTC(2024, pattern.month - 1, pattern.dayOfMonth)),
                'UTC',
                dateFormat
            );
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
    dateFormat,
    now,
    deviceTimeZone,
}: MeetingScheduleInput): { dateTime: string; recurrence: string | null } => {
    const startDate = getCalendarDate(startTime, timeZone);
    const endsOnSameDay = getDayNumber(startDate) === getDayNumber(getCalendarDate(endTime, timeZone));

    const startDateLabel = formatDateLabel(startTime, now, timeZone, dateFormat);
    const startTimeLabel = formatTime(startTime, timeZone, timeFormat);
    const endTimeLabel = formatTime(endTime, timeZone, timeFormat);

    const schedule = endsOnSameDay
        ? c('Meeting schedule').t`${startDateLabel}, ${startTimeLabel} to ${endTimeLabel}`
        : (() => {
              const endDateLabel = formatDateLabel(endTime, now, timeZone, dateFormat);
              return c('Meeting schedule').t`${startDateLabel}, ${startTimeLabel} to ${endDateLabel}, ${endTimeLabel}`;
          })();

    const dateTime = timeZone === deviceTimeZone ? schedule : `${schedule} (${timeZone})`;

    const pattern = rrule === null ? null : parseRecurrencePattern(rrule, startDate);

    return { dateTime, recurrence: pattern === null ? null : phraseRecurrence(pattern, dateFormat) };
};
