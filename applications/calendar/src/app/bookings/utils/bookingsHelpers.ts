import {
    addWeeks,
    differenceInCalendarWeeks,
    endOfDay,
    endOfWeek,
    format,
    fromUnixTime,
    getUnixTime,
    startOfDay,
    startOfWeek,
} from 'date-fns';

import { dateLocale } from '@proton/shared/lib/i18n';
import type { ExternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import type { BookingTimeslot } from '../booking.store';
import { WEEKS_IN_MINI_CALENDAR } from '../constants';

const MAX_WEEK_SECOND = 7 * 24 * 60 * 60;

/**
 * Transforms an available slot from the external booking page API payload
 * into the internal BookingTimeslot format used by the booking store.
 *
 * @param availableSlot - Available slot data from the API response
 * @returns Transformed timeslot object compatible with the booking store
 *
 * @example
 * const timeslot = transformAvailableSlotToTimeslot({
 *   ID: 'slot_123',
 *   StartTime: 1737216000,
 *   EndTime: 1737219600,
 *   Timezone: 'America/New_York',
 *   RRule: 'FREQ=WEEKLY;BYDAY=MO',
 *   BookingKeyPacket: 'encrypted_key...'
 * });
 */
export const transformAvailableSlotToTimeslot = (
    availableSlot: ExternalBookingPagePayload['AvailableSlots'][number]
): Omit<BookingTimeslot, 'tzDate'> => ({
    id: availableSlot.ID,
    startTime: availableSlot.StartTime,
    endTime: availableSlot.EndTime,
    timezone: availableSlot.Timezone,
    rrule: availableSlot.RRule ? availableSlot.RRule : undefined,
    bookingKeyPacket: availableSlot.BookingKeyPacket,
    detachedSignature: availableSlot.DetachedSignature,
});

export interface WeekRange {
    start: number;
    end: number;
}

export const generateWeeklyRangeSimple = (startDate: Date, endDate?: Date) => {
    const weekRangeSimple = [];

    const numberOfWeeks = endDate
        ? Math.max(1, differenceInCalendarWeeks(endDate, startDate) + 1)
        : WEEKS_IN_MINI_CALENDAR;

    for (let i = 0; i < numberOfWeeks; i++) {
        const start = getUnixTime(startOfDay(startOfWeek(addWeeks(startDate, i))));
        const end = getUnixTime(endOfDay(endOfWeek(addWeeks(startDate, i))));

        // When having DST transition happening in the range, the time frame between start and end can be bigger than
        // 7 days, leading to a backend error.
        const updatedEnd = Math.min(end, start + MAX_WEEK_SECOND - 1);

        weekRangeSimple.push({
            start,
            end: updatedEnd,
        });
    }

    return weekRangeSimple;
};

/**
 * Converts a timestamp to YYYY-MM-DD string in local timezone
 */
export const getDateKey = (timestamp: number): string => {
    return format(fromUnixTime(timestamp), 'yyyy-MM-dd', { locale: dateLocale });
};
