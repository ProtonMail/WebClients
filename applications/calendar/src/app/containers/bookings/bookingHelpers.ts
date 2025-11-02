import { addMinutes, isBefore } from 'date-fns';
import { c } from 'ttag';

import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import { uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar/Calendar';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../calendar/interface';
import type { BookingFormData, BookingFormValidation, BookingRange, Slot } from './bookingsProvider/interface';
import {
    BOOKING_SLOT_ID,
    BookingLocation,
    MAX_BOOKING_SLOTS,
    TEMPORARY_BOOKING_SLOT,
} from './bookingsProvider/interface';

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
            message: c('Info').t`You can’t have more than ${MAX_BOOKING_SLOTS} booking slots on a page.`,
        };
    }

    if (data.title.trim().length === 0) {
        return {
            type: 'warning',
        };
    }

    if (data.bookingSlots.length === 0) {
        return {
            type: 'warning',
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
