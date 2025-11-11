import { addDays, differenceInMinutes, endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';

import { DEFAULT_EVENT_DURATION } from '../../containers/bookings/bookingsProvider/interface';
import type { BookingDetails, BookingTimeslotWithDate } from '../booking.store';

const today = new Date();

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
    getTimeslotsByDate: (date: Date) => BookingTimeslotWithDate[]
) => {
    // We want to take extreme here
    let earliestSlot: Date = getTime(endOfDay(today));
    let latestSlot: Date = getTime(startOfDay(today));

    const slotRange: BookingTimeslotWithDate[][] = [];
    for (let i = 0; i < gridSize; i++) {
        const date = addDays(startOfDay(today), i);

        const timeslots = getTimeslotsByDate(date);
        slotRange.push(timeslots);

        const earliest = timeslots.length > 0 ? timeslots.at(0)?.date : undefined;
        earliestSlot = getEarliestTime(earliestSlot, earliest);

        const latest = timeslots.length > 0 ? timeslots[timeslots.length - 1].date : undefined;
        latestSlot = getLatestTime(latestSlot, latest);
    }

    const bookingDuration = bookingDetails.duration || DEFAULT_EVENT_DURATION;

    const { array, slotsPerDay } = generateRangeBookingArray({ gridSize, latestSlot, earliestSlot, bookingDuration });

    slotRange.forEach((day, dayIndex) => {
        if (day.length === 0) {
            array[dayIndex] = new Array(slotsPerDay).fill(undefined);
            return;
        }

        day.forEach((slot) => {
            const difference = differenceInMinutes(getTime(slot.date), earliestSlot);
            const index = Math.floor(difference / bookingDuration);
            array[dayIndex][index] = slot;
        });
    });

    return array;
};
