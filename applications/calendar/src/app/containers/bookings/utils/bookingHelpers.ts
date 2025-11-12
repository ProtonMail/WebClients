import {
    addDays,
    addMinutes,
    areIntervalsOverlapping,
    eachDayOfInterval,
    endOfWeek,
    isBefore,
    isSameDay,
    isWeekend,
    startOfDay,
    startOfWeek,
} from 'date-fns';
import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { fromLocalDate, toUTCDate } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { UserSettings } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../calendar/interface';
import {
    BOOKING_SLOT_ID,
    BookingFormValidationReasons,
    BookingLocation,
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
    bookingRange: BookingRange[] | null
): CalendarViewEvent[] => {
    if (!bookingRange) {
        return [];
    }

    return bookingRange.map((range) => ({
        uniqueId: range.id,
        isAllDay: false,
        isAllPartDay: false,
        start: range.start,
        end: range.end,
        data: {
            calendarData,
        },
    }));
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

const createBookingRange = (date: Date, timezone: string) => {
    const { year, month, day } = fromLocalDate(date);

    // Now safely create UTC dates for 9AM–5PM *on the same local day*
    const start = toUTCDate({ year, month, day, hours: 9 });
    const end = toUTCDate({ year, month, day, hours: 17 });

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
    timezone: string
): BookingRange[] => {
    const weekStartsOn = getWeekStartsOn({ WeekStart: userSettings.WeekStart });

    // We want to make sure the stored dates for the range is in UTC
    const date = fromLocalDate(startDate);
    const utc = toUTCDate({ ...date });

    return eachDayOfInterval({
        start: startOfWeek(utc, { weekStartsOn }),
        end: endOfWeek(utc, { weekStartsOn }),
    })
        .filter((day) => !isWeekend(day))
        .map((day) => {
            return createBookingRange(day, timezone);
        });
};

export const createBookingRangeNextAvailableTime = (bookingRange: BookingRange[], timezone: string): BookingRange => {
    const now = new Date();
    const today = startOfDay(now);
    const tomorrow = addDays(today, 1);

    // We return tomorrow if it's free
    if (!bookingRange.some((range) => isSameDay(range.start, tomorrow))) {
        return createBookingRange(tomorrow, timezone);
    }

    let nextAvailableTime = tomorrow;
    bookingRange.forEach((range) => {
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
