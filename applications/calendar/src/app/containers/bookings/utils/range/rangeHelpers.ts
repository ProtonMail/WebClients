import {
    addDays,
    eachDayOfInterval,
    endOfWeek,
    isBefore,
    isSameDay,
    isWeekend,
    set,
    startOfDay,
    startOfWeek,
} from 'date-fns';

import { convertTimestampToTimezone, fromLocalDate, toLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import isTruthy from '@proton/utils/isTruthy';

import type { CalendarViewEvent } from '../../../calendar/interface';
import type { BookingRange } from '../../bookingsProvider/interface';
import { BOOKING_SLOT_ID, DEFAULT_RANGE_END_HOUR, DEFAULT_RANGE_START_HOUR } from '../../bookingsProvider/interface';

export const generateBookingRangeID = (start: Date, end: Date) => {
    return `${BOOKING_SLOT_ID}-${start.getTime()}-${end.getTime()}`;
};

export const createTodayBookingRange = (date: Date, timezone: string, today: Date) => {
    const nextHour = today.getHours() + 1;

    if (nextHour >= DEFAULT_RANGE_END_HOUR) {
        return undefined;
    }

    const start =
        nextHour < DEFAULT_RANGE_START_HOUR
            ? set(date, { hours: DEFAULT_RANGE_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
            : set(date, { hours: nextHour, minutes: 0, seconds: 0, milliseconds: 0 });
    const end = set(date, { hours: DEFAULT_RANGE_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    return {
        id: generateBookingRangeID(start, end),
        start,
        end,
        timezone,
    };
};

export const createBookingRange = (date: Date, timezone: string) => {
    const start = set(date, { hours: DEFAULT_RANGE_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });
    const end = set(date, { hours: DEFAULT_RANGE_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    return {
        id: generateBookingRangeID(start, end),
        start,
        end,
        timezone,
    };
};

/**
 * Returns an array of booking range going from 9am to 5pm on work days of the current week
 */
export const generateDefaultBookingRange = (
    userSettings: UserSettings,
    startDate: Date,
    timezone: string,
    isRecurringRange: boolean = true
): BookingRange[] => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });

    // We want to make sure the stored dates for the range is in UTC
    const date = fromLocalDate(startDate);
    const utc = toUTCDate({ ...date });
    const todayUTC = toLocalDate(convertTimestampToTimezone(Date.now() / 1000, timezone));

    return (
        eachDayOfInterval({
            start: startOfWeek(utc, { weekStartsOn }),
            end: endOfWeek(utc, { weekStartsOn }),
        })
            // TODO remove this once we handle recurring slots
            // remove all days in the past
            .filter((day) => {
                return isRecurringRange ? true : !isBefore(day, startOfDay(todayUTC));
            })
            .filter((day) => !isWeekend(day))
            .map((day) => {
                // TODO remove this once we handle recurring slots
                // If today, we want to remove slots before the current hour
                if (!isRecurringRange && isSameDay(day, startOfDay(todayUTC))) {
                    return createTodayBookingRange(day, timezone, todayUTC);
                }
                return createBookingRange(day, timezone);
            })
            .filter(isTruthy)
    );
};

export const createBookingRangeNextAvailableTime = ({
    bookingRanges,
    userSettings,
    timezone,
    startDate,
}: {
    bookingRanges: BookingRange[];
    userSettings: UserSettings;
    timezone: string;
    startDate?: Date;
}): BookingRange => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });
    const tomorrow = startDate ? startOfWeek(startDate, { weekStartsOn }) : addDays(new Date(), 1);

    // We return tomorrow if it's free
    if (!bookingRanges.some((range) => isSameDay(range.start, tomorrow))) {
        return createBookingRange(tomorrow, timezone);
    }

    let nextAvailableTime = tomorrow;
    bookingRanges.forEach((range) => {
        if (isSameDay(range.start, nextAvailableTime)) {
            nextAvailableTime = addDays(nextAvailableTime, 1);
        } else {
            return createBookingRange(nextAvailableTime, timezone);
        }
    });

    return createBookingRange(nextAvailableTime, timezone);
};

export const convertBookingRangesToCalendarViewEvents = (
    calendarData: VisualCalendar,
    bookingRanges: BookingRange[] | null
): CalendarViewEvent[] => {
    if (!bookingRanges) {
        return [];
    }

    return bookingRanges.map((range) => {
        const localStart = fromLocalDate(range.start);
        const utcStart = toUTCDate(localStart);

        const localEnd = fromLocalDate(range.end);
        const utcEnd = toUTCDate(localEnd);

        return {
            uniqueId: range.id,
            isAllDay: false,
            isAllPartDay: false,
            start: utcStart,
            end: utcEnd,
            data: {
                calendarData,
            },
        };
    });
};
