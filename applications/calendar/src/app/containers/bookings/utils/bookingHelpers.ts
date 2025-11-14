import {
    addDays,
    addHours,
    addMinutes,
    areIntervalsOverlapping,
    eachDayOfInterval,
    endOfWeek,
    isBefore,
    isSameDay,
    isWeekend,
    set,
    setMinutes,
    startOfDay,
    startOfWeek,
} from 'date-fns';
import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { convertTimestampToTimezone, fromLocalDate, toLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import isTruthy from '@proton/utils/isTruthy';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../calendar/interface';
import {
    BOOKING_SLOT_ID,
    BookingFormValidationReasons,
    BookingLocation,
    DEFAULT_RANGE_END_HOUR,
    DEFAULT_RANGE_START_HOUR,
    MAX_BOOKING_SLOTS,
    TEMPORARY_BOOKING_SLOT,
} from '../bookingsProvider/interface';
import type { BookingFormData, BookingFormValidation, BookingRange, Slot } from '../bookingsProvider/interface';

export const createBookingLink = (secretBytes: Uint8Array<ArrayBuffer>) => {
    const base64Secret = uint8ArrayToPaddedBase64URLString(secretBytes);

    return `${window.location.origin}/bookings#${base64Secret}`;
};

export const getBookingLocationOption = () => {
    return [
        { text: MEET_APP_NAME, value: BookingLocation.MEET },
        { text: c('Location').t`In person`, value: BookingLocation.IN_PERSON },
    ];
};

export const isBookingSlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewEvent => {
    return event.uniqueId.startsWith(BOOKING_SLOT_ID);
};

export const isTemporaryBookingSlotEvent = (
    event: CalendarViewEvent | CalendarViewBusyEvent
): event is CalendarViewEvent => {
    return event.uniqueId.startsWith(TEMPORARY_BOOKING_SLOT);
};

export const convertSlotToCalendarViewEvents = (
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

export const generateSlotsFromRange = ({
    rangeID,
    start,
    end,
    duration,
    timezone,
}: {
    rangeID: string;
    start: Date;
    end: Date;
    duration: number;
    timezone: string;
}): Slot[] => {
    let currentStart = start;

    const slots: Slot[] = [];
    while (isBefore(currentStart, end)) {
        const currentEnd = addMinutes(currentStart, duration);
        const slotID = `${BOOKING_SLOT_ID}-${currentStart.getTime().toString()}-${currentEnd.getTime().toString()}`;

        // Only add the slot if it fits completely within the range
        if (currentEnd.getTime() <= end.getTime()) {
            slots.push({
                rangeID,
                id: slotID,
                start: currentStart,
                end: currentEnd,
                timezone,
            });
        }

        currentStart = currentEnd;
    }

    return slots;
};

export const validateFormData = (data: BookingFormData): BookingFormValidation | undefined => {
    if (data.bookingSlots.length >= MAX_BOOKING_SLOTS) {
        return {
            type: 'error',
            reason: BookingFormValidationReasons.TIME_SLOT_LIMIT,
            message: c('Info').t`You can’t have more than ${MAX_BOOKING_SLOTS} booking slots on a page.`,
        };
    }

    if (data.summary.trim().length === 0) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.TITLE_REQUIRED,
        };
    }

    if (data.bookingSlots.length === 0) {
        return {
            type: 'warning',
            reason: BookingFormValidationReasons.TIME_SLOT_REQUIRED,
        };
    }

    return undefined;
};

// The keys MUST be sorted alphabetically.
// We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatData = ({
    description,
    location,
    summary,
    withProtonMeetLink,
}: {
    description: string;
    location: string;
    summary: string;
    withProtonMeetLink: boolean;
}) => {
    return JSON.stringify({ description, location, summary, withProtonMeetLink });
};

// The keys MUST be sorted alphabetically
// // We didn't used a replacer to avoid any potential issue with nested objects.
export const JSONFormatTextData = ({
    EndTime,
    RRule,
    StartTime,
    Timezone,
}: {
    EndTime: number;
    RRule: string | null;
    StartTime: number;
    Timezone: string;
}) => {
    return JSON.stringify({ EndTime, RRule, StartTime, Timezone });
};

export const generateBookingRangeID = (start: Date, end: Date) => {
    return `${BOOKING_SLOT_ID}-${start.getTime()}-${end.getTime()}`;
};

const createTodayBookingRange = (date: Date, timezone: string, today: Date) => {
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

const createBookingRange = (date: Date, timezone: string) => {
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

export const validateBookingRange = ({
    newRangeId,
    start,
    end,
    existingRanges,
    excludeRangeId,
}: {
    newRangeId: string;
    start: Date;
    end: Date;
    existingRanges: BookingRange[];
    excludeRangeId?: string;
}): string | null => {
    for (const range of existingRanges) {
        if (excludeRangeId && range.id === excludeRangeId) {
            continue;
        }

        if (range.id === newRangeId) {
            return c('Info').t`Booking already exists.`;
        }

        if (areIntervalsOverlapping({ start, end }, { start: range.start, end: range.end })) {
            return c('Info').t`Booking overlaps with an existing booking.`;
        }
    }

    return null;
};

export const roundToNextHalfHour = (date: Date): Date => {
    const minutes = date.getMinutes();

    const normalized = set(date, {
        seconds: 0,
        milliseconds: 0,
    });

    return minutes < 30 ? setMinutes(normalized, 30) : addHours(setMinutes(normalized, 0), 1);
};
