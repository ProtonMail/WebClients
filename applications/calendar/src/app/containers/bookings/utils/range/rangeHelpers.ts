import type { BookingPageEditData } from 'applications/calendar/src/app/store/internalBooking/interface';
import {
    addDays,
    addMinutes,
    areIntervalsOverlapping,
    differenceInCalendarDays,
    differenceInMinutes,
    eachDayOfInterval,
    endOfWeek,
    isBefore,
    isSameDay,
    isWeekend,
    isWithinInterval,
    set,
    startOfDay,
    startOfWeek,
    subMinutes,
} from 'date-fns';

import {
    convertUTCDateTimeToZone,
    fromLocalDate,
    fromUTCDate,
    toLocalDate,
    toUTCDate,
} from '@proton/shared/lib/date/timezone';
import type { SETTINGS_WEEK_START, UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import isTruthy from '@proton/utils/isTruthy';

import type { CalendarViewEvent } from '../../../calendar/interface';
import type { BookingFormData, BookingRange, Intersection, RecurringRangeDisplay } from '../../interface';
import { BOOKING_SLOT_ID, BookingRangeError, DEFAULT_RANGE_END_HOUR, DEFAULT_RANGE_START_HOUR } from '../../interface';
import { fromTimestampToUTCDate, roundToNextHalfHour } from '../timeHelpers';

export const generateBookingRangeID = (start: Date, end: Date) => {
    return `${BOOKING_SLOT_ID}-${start.getTime()}-${end.getTime()}`;
};

export const createTodayBookingRange = (date: Date, timezone: string, today: Date, duration: number) => {
    const roundedTime = roundToNextHalfHour(today);

    if (roundedTime.getHours() >= DEFAULT_RANGE_END_HOUR) {
        return undefined;
    }

    const start =
        roundedTime.getHours() < DEFAULT_RANGE_START_HOUR
            ? set(date, { hours: DEFAULT_RANGE_START_HOUR, minutes: 0, seconds: 0, milliseconds: 0 })
            : set(date, {
                  hours: roundedTime.getHours(),
                  minutes: roundedTime.getMinutes(),
                  seconds: 0,
                  milliseconds: 0,
              });

    const end = set(date, { hours: DEFAULT_RANGE_END_HOUR, minutes: 0, seconds: 0, milliseconds: 0 });

    if (differenceInMinutes(end, start) < duration) {
        return undefined;
    }

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
        ranges: bookingRanges
            .filter((range) => range.start.getDay() === day.getDay())
            .sort((a, b) => a.start.getTime() - b.start.getTime()),
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
    duration: number,
    isRecurring: boolean
): BookingRange[] => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });

    // When doing recurrign we want to use the current week as starting date and not calendar date
    let start = new Date();
    if (!isRecurring) {
        start = isBefore(startDate, start) ? start : startDate;
    }

    // We want to make sure the stored dates for the range is in UTC
    const utc = toUTCDate(fromLocalDate(start));
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
                return createTodayBookingRange(day, timezone, todayUTC, duration);
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
    const now = new Date();
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });
    let tomorrow = addDays(now, 1);
    if (startDate) {
        tomorrow = isBefore(startDate, now) ? addDays(now, 1) : startOfWeek(startDate, { weekStartsOn });
    }

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
    date: Date,
    userSettings: UserSettings
): CalendarViewEvent[] => {
    if (!formData.bookingRanges) {
        return [];
    }
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });
    const weekStart = startOfWeek(date, { weekStartsOn });

    return formData.bookingRanges.map((range) => {
        let utcStart = toUTCDate(fromLocalDate(range.start));
        let utcEnd = toUTCDate(fromLocalDate(range.end));

        // We need to adjust the range date when creating a recurring page so it's visible when changing week
        if (formData.recurring) {
            // Calculate the day offset from the week start range.start.getDay() gives us 0-6 (Sun-Sat)
            // We need to find the correct offset based on the user's week start preference
            const rangeWeekday = range.start.getDay();
            let dayOffset = rangeWeekday - weekStartsOn;
            if (dayOffset < 0) {
                dayOffset += 7;
            }

            const targetDay = addDays(weekStart, dayOffset);

            const adjustedStartLocal = set(targetDay, {
                hours: range.start.getHours(),
                minutes: range.start.getMinutes(),
                seconds: range.start.getSeconds(),
                milliseconds: range.start.getMilliseconds(),
            });

            // When editing a booking range, users could have changed the timezone and the range is in two days
            // This ensure that we add one day if this is the case
            const endTargetDay = addDays(targetDay, differenceInCalendarDays(range.end, range.start));
            const adjustedEndLocal = set(endTargetDay, {
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
export const getRangeDateStart = (formData: BookingFormData, initialStartDate: Date, timezone: string) => {
    if (formData.recurring) {
        return initialStartDate;
    }

    const nowWithTz = toLocalDate(convertUTCDateTimeToZone(fromUTCDate(new Date()), timezone));

    return isBefore(initialStartDate, nowWithTz) ? roundToNextHalfHour(nowWithTz) : initialStartDate;
};

export const generateRangeFromSlots = (editData: BookingPageEditData, timezone: string): BookingRange[] => {
    const formattedSlots = editData.slots
        .map((slot) => ({
            ...slot,
            start: fromTimestampToUTCDate(slot.start, timezone),
            end: fromTimestampToUTCDate(slot.end, timezone),
        }))
        .sort((a, b) => a.start.getTime() - b.start.getTime());

    if (formattedSlots.length === 0) {
        return [];
    }

    const ranges: BookingRange[] = [];

    let currentStart = formattedSlots[0].start;
    let currentEnd = formattedSlots[0].end;

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

export const computeRangeErrors = (range: BookingRange, duration: number): BookingRange => {
    const isTooShort = differenceInMinutes(range.end, range.start) < duration;
    return isTooShort ? { ...range, error: BookingRangeError.TOO_SHORT } : { ...range, error: undefined };
};

export const computeRangesErrors = (ranges: BookingRange[], duration: number): BookingRange[] => {
    return ranges.map((range) => {
        return computeRangeErrors(range, duration);
    });
};

export const normalizeBookingRangeToTimeOfWeek = (date: Date, weekStart: SETTINGS_WEEK_START) => {
    const today = new Date();
    const weekStartsOn = getWeekStartsOn({ WeekStart: weekStart });
    const currentWeekStart = startOfWeek(today, { weekStartsOn });

    // When the user has set a different week start, we need to apply the offset with the "standard" week start to normalize the date
    const targetDayOfWeek = date.getDay();
    let dayOffset = targetDayOfWeek - weekStartsOn;

    // When week start is "on the previous week" (e.g. Saturday), and the target on the current week (e.g. Tuesday),
    // the offset will be < 0 (because we get the one from the previous week).
    // To use the target date from the current week, we need to add 7.
    if (dayOffset < 0) {
        dayOffset += 7;
    }

    const targetDay = addDays(currentWeekStart, dayOffset);

    return new Date(
        targetDay.getFullYear(),
        targetDay.getMonth(),
        targetDay.getDate(),
        date.getHours(),
        date.getMinutes(),
        0,
        0
    );
};

export const splitMidnightRecurringSpanningRange = ({
    oldRange,
    normalizedStart,
    normalizedEnd,
    originalStart,
}: {
    oldRange: BookingRange;
    normalizedStart: Date;
    normalizedEnd: Date;
    originalStart: Date;
}): { firstRange: BookingRange; secondRange: BookingRange } => {
    // First range ends at midnight on the next day
    const firstRangeEnd = startOfDay(addDays(normalizedStart, 1));
    const firstRange: BookingRange = {
        id: generateBookingRangeID(originalStart, firstRangeEnd),
        start: normalizedStart,
        end: firstRangeEnd,
        timezone: oldRange.timezone,
    };

    // Second range starts at midnight
    const secondRangeStart = startOfDay(normalizedEnd);
    const secondRangeId = generateBookingRangeID(secondRangeStart, normalizedEnd);
    const secondRange: BookingRange = {
        id: secondRangeId,
        start: secondRangeStart,
        end: normalizedEnd,
        timezone: oldRange.timezone,
    };

    return { firstRange, secondRange };
};

export const getIsBookingsIntersection = ({
    start,
    end,
    bookingRanges,
}: {
    start: Date;
    end: Date;
    bookingRanges: BookingRange[];
}): Intersection | null => {
    const intersection = bookingRanges.find((range) => {
        return areIntervalsOverlapping({ start, end }, { start: range.start, end: range.end });
    });

    if (!intersection) {
        return null;
    }

    // The intersection is happening at the end of a range
    if (isWithinInterval(start, intersection)) {
        return { start: intersection.end, end };
    }

    // The intersection is happening at the start of a range
    if (isWithinInterval(end, intersection)) {
        return { start, end: intersection.start };
    }

    return null;
};

export const getIsRecurringBookingsIntersection = ({
    start,
    end,
    bookingRanges,
    weekStart,
}: {
    start: Date;
    end: Date;
    bookingRanges: BookingRange[];
    weekStart: SETTINGS_WEEK_START;
}): Intersection | null => {
    // In the recurring scenario, the user can try to add ranges in future weeks
    // To compute intersections properly, dates needs to be normalized so that we check intersections "on the same day"
    const normalizedStart = normalizeBookingRangeToTimeOfWeek(start, weekStart);
    const normalizedEnd = normalizeBookingRangeToTimeOfWeek(end, weekStart);

    const overlappingRange = bookingRanges
        .filter((range) => range.start.getDay() === start.getDay())
        .find((range) => {
            const normalizedRangeStart = normalizeBookingRangeToTimeOfWeek(range.start, weekStart);
            const normalizedRangeEnd = normalizeBookingRangeToTimeOfWeek(range.end, weekStart);

            return areIntervalsOverlapping(
                { start: normalizedStart, end: normalizedEnd },
                { start: normalizedRangeStart, end: normalizedRangeEnd }
            );
        });

    if (!overlappingRange) {
        return null;
    }

    const normalizedOverlapStart = normalizeBookingRangeToTimeOfWeek(overlappingRange.start, weekStart);
    const normalizedOverlapEnd = normalizeBookingRangeToTimeOfWeek(overlappingRange.end, weekStart);

    // The intersection is happening at the end of a range
    if (isWithinInterval(normalizedStart, { start: normalizedOverlapStart, end: normalizedOverlapEnd })) {
        const minutesDiff = differenceInMinutes(normalizedOverlapEnd, normalizedStart);
        const adjustedStart = addMinutes(start, minutesDiff);
        return { start: adjustedStart, end };
    }

    // The intersection is happening at the start of a range
    if (isWithinInterval(normalizedEnd, { start: normalizedOverlapStart, end: normalizedOverlapEnd })) {
        const minutesDiff = differenceInMinutes(normalizedEnd, normalizedOverlapStart);
        const adjustedEnd = subMinutes(end, minutesDiff);
        return { start, end: adjustedEnd };
    }

    return null;
};
