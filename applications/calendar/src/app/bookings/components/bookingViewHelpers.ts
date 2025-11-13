import { addDays, differenceInMinutes, endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';

import type { ActiveBreakpoint } from '@proton/components/hooks/useActiveBreakpoint';
import {
    convertTimestampToTimezone,
    fromUTCDateToLocalFakeUTCDate,
    toLocalDate,
} from '@proton/shared/lib/date/timezone';

import { DEFAULT_EVENT_DURATION } from '../../containers/bookings/bookingsProvider/interface';
import type { BookingDetails, BookingTimeslot } from '../booking.store';

/**
 * Convert a time slot start time to a local date.
 * First convert the start time using the slot timezeone, then to local date and finish with timezone from store
 * @param slot the slot to convert
 * @param timezone timezone from the state, not the one from the slot
 * @returns date that can be used in display
 */
export const fromTimeSlotToUTCDate = (slot: BookingTimeslot, timezone: string) => {
    const timeslotDate = convertTimestampToTimezone(slot.startTime, slot.timezone);
    const utc = toLocalDate({ ...timeslotDate });
    return fromUTCDateToLocalFakeUTCDate(utc, false, timezone);
};

const getTime = (date: Date) => {
    return new Date(2000, 0, 1, date.getHours(), date.getMinutes());
};

/**
 * Returns the earliest time between to dates, the dates are adjusted to the same day
 */
const getEarliestTime = (leftDate: Date, rightDate?: Date) => {
    if (!rightDate) {
        return getTime(leftDate);
    }

    const adjustedLeft = getTime(leftDate);
    const adjustedRight = getTime(rightDate);

    return isBefore(adjustedLeft, adjustedRight) ? adjustedLeft : adjustedRight;
};

/**
 * Returns the latest time between to dates, the dates are adjusted to the same day
 */
const getLatestTime = (leftDate: Date, rightDate?: Date) => {
    if (!rightDate) {
        return getTime(leftDate);
    }

    const adjustedLeft = getTime(leftDate);
    const adjustedRight = getTime(rightDate);

    return isAfter(adjustedLeft, adjustedRight) ? adjustedLeft : adjustedRight;
};

interface GenerateRangeBookingArrayParams {
    gridSize: number;
    latestSlot: Date;
    earliestSlot: Date;
    bookingDuration: number;
}

/**
 * Generate a two-dimensional array of param.gridSize width and the number of slots per day depth
 *
 * @param param.gridSize number of days in the array
 * @param param.latestSlot latest slot in the array, used for array depth calculation
 * @param param.earliestSlot earliest slot in the array, used for array depth calculation
 * @param param.bookingDuration duration of each slot in minutes, used for array depth calculation
 * @returns array the array of bookings, slotsPerDay the number of slots per day
 */
const generateRangeBookingArray = ({
    gridSize,
    latestSlot,
    earliestSlot,
    bookingDuration,
}: GenerateRangeBookingArrayParams) => {
    const slotsPerDay = Math.floor(differenceInMinutes(latestSlot, earliestSlot) / bookingDuration) + 1;
    const array = new Array(gridSize).fill(null).map(() => new Array(slotsPerDay).fill(null));
    return { array, slotsPerDay };
};

export const getGridCount = (activeBreakpoint: ActiveBreakpoint) => {
    switch (activeBreakpoint) {
        case 'xsmall':
        case 'small':
            return 3;
        case 'medium':
            return 5;
        case 'large':
        case 'xlarge':
        case '2xlarge':
            return 7;
    }
};

export const getDaysRange = (gridSize: number, startDate: Date) => {
    const tmpRange: Date[] = [];

    for (let i = 0; i < gridSize; i++) {
        const date = addDays(startOfDay(startDate), i);
        tmpRange.push(date);
    }

    return tmpRange;
};

export const getDaysSlotRange = (
    gridSize: number,
    bookingDetails: BookingDetails,
    filterBookingSlotPerDay: (date: Date) => BookingTimeslot[],
    selectedDate: Date
) => {
    // We want to take extreme here
    let earliestSlot: Date = getTime(endOfDay(selectedDate));
    let latestSlot: Date = getTime(startOfDay(selectedDate));

    const slotRange: BookingTimeslot[][] = [];
    for (let i = 0; i < gridSize; i++) {
        const date = addDays(startOfDay(selectedDate), i);

        const newTimeslot = filterBookingSlotPerDay(date);
        slotRange.push(newTimeslot);

        if (!newTimeslot.length) {
            continue;
        }

        earliestSlot = getEarliestTime(earliestSlot, newTimeslot[0].tzDate);
        latestSlot = getLatestTime(latestSlot, newTimeslot[newTimeslot.length - 1].tzDate);
    }

    const bookingDuration = bookingDetails.duration || DEFAULT_EVENT_DURATION;

    // Return if no slots to show in the current range
    const hasAnyEvents = slotRange.some((day) => day.length > 0);
    if (!hasAnyEvents) {
        return [];
    }

    const { array, slotsPerDay } = generateRangeBookingArray({ gridSize, latestSlot, earliestSlot, bookingDuration });

    slotRange.forEach((day, dayIndex) => {
        if (day.length === 0) {
            array[dayIndex] = new Array(slotsPerDay).fill(undefined);
            return;
        }

        day.forEach((slot) => {
            const difference = differenceInMinutes(getTime(slot.tzDate), earliestSlot);
            const index = Math.floor(difference / bookingDuration);
            array[dayIndex][index] = slot;
        });
    });

    return array;
};
