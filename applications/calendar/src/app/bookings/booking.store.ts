import { isSameDay, startOfDay } from 'date-fns';
import { create } from 'zustand';

import { getTimezone } from '@proton/shared/lib/date/timezone';
import uniqueBy from '@proton/utils/uniqueBy';

import { fromTimestampToUTCDate } from '../containers/bookings/utils/timeHelpers';
import { getDateKey } from './utils/bookingsHelpers';

export type BookingTimeslot = {
    id: string;
    // This date is adjusted to the selected timezone of the page. Use this to avoid problems.
    tzDate: Date;
    startTime: number;
    endTime: number;
    timezone: string;
    rrule?: string;
    bookingKeyPacket: string;
    detachedSignature: string;
};

export type BookingDetails = {
    calendarId: string;
    bookingUID: string;
    summary: string;
    description: string;
    location: string;
    duration: number | undefined;
    timezone: string | undefined;
    bookingKeySalt: string;
    inviterDisplayName?: string;
    inviterEmail: string;
    withProtonMeetLink: boolean;
};

interface BookingStore {
    isLoading: boolean;
    setLoading: (loading: boolean) => void;
    hasLoaded: boolean;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    selectedTimezone: string;
    setSelectedTimezone: (timezone: string) => void;

    bookingDetails: BookingDetails | null;
    setBookingDetails: (details: BookingDetails) => void;
    selectedBookingSlot: BookingTimeslot | null;
    setSelectedBookingSlot: (slot: BookingTimeslot) => void;

    bookingSlots: BookingTimeslot[];
    setBookingSlots: (bookingSlots: Omit<BookingTimeslot, 'tzDate'>[]) => void;
    filterBookingSlotPerDay: (date: Date) => BookingTimeslot[];
    nextAvailableSlot: BookingTimeslot | null;
    setNextAvailableSlot: (slot: Omit<BookingTimeslot, 'tzDate'> | null) => void;
    getDateKeySet: () => Set<string>;

    loadedRanges: { start: number; end: number }[];
    setLoadedRanges: (newRange: { start: number; end: number }[]) => void;

    failedToVerify: boolean;
    setFailedToVerify: (value: boolean) => void;
}

export const useBookingStore = create<BookingStore>((set, get) => ({
    isLoading: false,
    hasLoaded: false,
    selectedDate: new Date(),
    selectedTimezone: getTimezone(),

    bookingSlots: [],
    bookingDetails: null,
    selectedBookingSlot: null,
    nextAvailableSlot: null,

    loadedRanges: [],

    failedToVerify: false,

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
        if (!loading && !get().hasLoaded) {
            set({ hasLoaded: true });
        }
    },

    setBookingDetails: (details: BookingDetails) => {
        set({ bookingDetails: details });
    },

    filterBookingSlotPerDay: (date: Date) => {
        return get().bookingSlots.filter((slot) => {
            return isSameDay(date, slot.tzDate);
        });
    },

    setBookingSlots: (bookingSlots: Omit<BookingTimeslot, 'tzDate'>[]) => {
        const newSlots = bookingSlots.map((slot) => ({
            ...slot,
            tzDate: fromTimestampToUTCDate(slot.startTime, get().selectedTimezone),
        }));

        const newTimeSlots = [...get().bookingSlots, ...newSlots].sort((a, b) => a.startTime - b.startTime);

        set({
            // Recurring events have the same ID, so we need to check both id and startTime to remove duplicates
            bookingSlots: uniqueBy(newTimeSlots, (slot: BookingTimeslot) => `${slot.id}-${slot.startTime}`),
        });
    },

    setNextAvailableSlot: (bookingSlot: Omit<BookingTimeslot, 'tzDate'> | null) => {
        if (!bookingSlot) {
            set({ nextAvailableSlot: null });
            return;
        }

        const nextAvailableSlot = {
            ...bookingSlot,
            tzDate: fromTimestampToUTCDate(bookingSlot.startTime, get().selectedTimezone),
        };
        const updatedTimeSlots = [...get().bookingSlots, nextAvailableSlot].sort((a, b) => a.startTime - b.startTime);

        // Also add the next slot in bookingSlots in case it's too far in the future and not loaded by default
        set({
            nextAvailableSlot,
            // Recurring events have the same ID, so we need to check both id and startTime to remove duplicates
            bookingSlots: uniqueBy(updatedTimeSlots, (slot: BookingTimeslot) => `${slot.id}-${slot.startTime}`),
        });
    },

    getDateKeySet: () => {
        const dates = get().bookingSlots.map((slot) => getDateKey(slot.startTime));
        return new Set(dates);
    },

    setSelectedDate: (date: Date) => {
        set({ selectedDate: startOfDay(date) });
    },

    setSelectedBookingSlot: (slot: BookingTimeslot) => {
        set({ selectedBookingSlot: slot });
    },

    setSelectedTimezone: (timezone: string) => {
        const newSlots = get().bookingSlots.map((slot) => ({
            ...slot,
            tzDate: fromTimestampToUTCDate(slot.startTime, timezone),
        }));

        set({ selectedTimezone: timezone, bookingSlots: newSlots });
    },

    setLoadedRanges: (newRanges: { start: number; end: number }[]) => {
        set({
            loadedRanges: [...get().loadedRanges, ...newRanges],
        });
    },

    setFailedToVerify: (value: boolean) => {
        set({ failedToVerify: value });
    },
}));
