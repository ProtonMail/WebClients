import type { BookingPageEditData } from 'applications/calendar/src/app/store/internalBooking/interface';
import {
    addDays,
    differenceInMinutes,
    eachDayOfInterval,
    endOfWeek,
    isBefore,
    isSameDay,
    isWeekend,
    set,
    startOfDay,
    startOfWeek,
} from 'date-fns';

import {
    convertUTCDateTimeToZone,
    fromLocalDate,
    fromUTCDate,
    toLocalDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import isTruthy from '@proton/utils/isTruthy';

import type { CalendarViewEvent } from '../../../calendar/interface';
import type { BookingFormData, BookingRange, RecurringRangeDisplay } from '../../bookingsProvider/interface';
import {
    BOOKING_SLOT_ID,
    BookingRangeError,
    DEFAULT_RANGE_END_HOUR,
    DEFAULT_RANGE_START_HOUR,
} from '../../bookingsProvider/interface';
import { fromTimestampToUTCDate, roundToNextHalfHour } from '../timeHelpers';

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

export const generateRecurringRanges = (
    userSettings: UserSettings,
    startDate: Date,
    bookingRanges: BookingRange[]
): RecurringRangeDisplay[] => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });

    // We want to make sure the stored dates for the range is in UTC
    const utc = toUTCDate(fromLocalDate(startDate));

    return eachDayOfInterval({
        start: startOfWeek(utc, { weekStartsOn }),
        end: endOfWeek(utc, { weekStartsOn }),
    }).map((day) => ({
        id: day.getTime(),
        ranges: bookingRanges.filter((range) => range.start.getDay() === day.getDay()),
        date: day,
    }));
};

/**
 * Returns an array of booking range going from 9am to 5pm on work days of the current week
 */
export const generateDefaultBookingRange = (
    userSettings: UserSettings,
    startDate: Date,
    timezone: string,
    isRecurring: boolean
): BookingRange[] => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });

    // We want to make sure the stored dates for the range is in UTC
    const utc = toUTCDate(fromLocalDate(startDate));
    const todayUTC = toLocalDate(convertUTCDateTimeToZone(fromUTCDate(new Date()), timezone));

    return eachDayOfInterval({
        start: startOfWeek(utc, { weekStartsOn }),
        end: endOfWeek(utc, { weekStartsOn }),
    })
        .filter((day) => !isWeekend(day))
        .map((day) => {
            if (isRecurring) {
                return createBookingRange(day, timezone);
            }

            if (isBefore(day, startOfDay(todayUTC))) {
                return null;
            }

            if (isSameDay(day, startOfDay(todayUTC))) {
                return createTodayBookingRange(day, timezone, todayUTC);
            }

            return createBookingRange(day, timezone);
        })
        .filter(isTruthy);
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
    formData: BookingFormData,
    date: Date
): CalendarViewEvent[] => {
    if (!formData.bookingRanges) {
        return [];
    }

    return formData.bookingRanges.map((range) => {
        let utcStart = toUTCDate(fromLocalDate(range.start));
        let utcEnd = toUTCDate(fromLocalDate(range.end));

        // We need to adjust the range date when creating a recurring page so it's visible when changing week
        if (formData.recurring) {
            const weekdayDelta = range.start.getDay() - date.getDay();
            const targetDay = addDays(date, weekdayDelta);

            const adjustedStartLocal = set(addDays(date, weekdayDelta), {
                hours: range.start.getHours(),
                minutes: range.start.getMinutes(),
                seconds: range.start.getSeconds(),
                milliseconds: range.start.getMilliseconds(),
            });

            const adjustedEndLocal = set(targetDay, {
                hours: range.end.getHours(),
                minutes: range.end.getMinutes(),
                seconds: range.end.getSeconds(),
                milliseconds: range.end.getMilliseconds(),
            });

            utcStart = toUTCDate(fromLocalDate(adjustedStartLocal));
            utcEnd = toUTCDate(fromLocalDate(adjustedEndLocal));
        }

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

/**
 * Returns the initial start date when recurring. Alternatively, it rounds the date to the next half hour if the user dragged past the current time.
 */
export const getRangeDateStart = (formData: BookingFormData, initialStartDate: Date) => {
    if (formData.recurring) {
        return initialStartDate;
    }

    return isBefore(initialStartDate, new Date()) ? roundToNextHalfHour(new Date()) : initialStartDate;
};

export const generateRangeFromSlots = (editData: BookingPageEditData): BookingRange[] => {
    const formattedSlots = editData.slots
        .map((slot) => ({
            ...slot,
            start: fromTimestampToUTCDate(slot.start, slot.timezone),
            end: fromTimestampToUTCDate(slot.end, slot.timezone),
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (formattedSlots.length === 0) {
        return [];
    }

    const ranges: BookingRange[] = [];

    let currentStart = formattedSlots[0].start;
    let currentEnd = formattedSlots[0].end;
    const timezone = formattedSlots[0].timezone;

    for (let i = 1; i < formattedSlots.length; i += 1) {
        const slot = formattedSlots[i];
        const isContiguous = slot.start.getTime() === currentEnd.getTime();

        if (isContiguous) {
            currentEnd = slot.end;
            continue;
        }

        ranges.push({
            id: generateBookingRangeID(currentStart, currentEnd),
            start: currentStart,
            end: currentEnd,
            timezone,
        });

        currentStart = slot.start;
        currentEnd = slot.end;
    }

    ranges.push({
        id: generateBookingRangeID(currentStart, currentEnd),
        start: currentStart,
        end: currentEnd,
        timezone,
    });

    return ranges;
};

export const computeRangesErrors = (ranges: BookingRange[], duration: number) => {
    return ranges.map((range) => {
        const isTooShort = differenceInMinutes(range.end, range.start) < duration;
        return isTooShort ? { ...range, error: BookingRangeError.TOO_SHORT } : { ...range, error: null };
    });
};
