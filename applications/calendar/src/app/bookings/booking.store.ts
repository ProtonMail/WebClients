import { format, fromUnixTime, isSameDay } from 'date-fns';
import { create } from 'zustand';

import { getTimezone } from '@proton/shared/lib/date/timezone';
import { dateLocale } from '@proton/shared/lib/i18n';

export type BookingTimeslot = {
    id: string;
    startTime: number;
    endTime: number;
    timezone: string;
    rrule?: string;
    bookingKeyPacket: string;
    detachedSignature: string;
};

export type BookingDetails = {
    calendarId: string;
    bookingUid: string;
    summary: string;
    description: string;
    location: string;
    duration: number | undefined;
    timezone: string | undefined;
    bookingKeySalt: string;
    inviterDisplayName: string;
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
    setBookingSlots: (bookingSlots: BookingTimeslot[]) => void;
    filterBookingSlotPerDay: (date: Date) => BookingTimeslot[];
    getDateKeySet: () => Set<string>;
}

/**
 * Converts a timestamp to YYYY-MM-DD string in local timezone
 */
// TODO MOVE IN HELPER
export const getDateKey = (timestamp: number): string => {
    return format(fromUnixTime(timestamp), 'yyyy-MM-dd', { locale: dateLocale });
};

export const useBookingStore = create<BookingStore>((set, get) => ({
    isLoading: false,
    hasLoaded: false,
    selectedDate: new Date(),
    selectedTimezone: getTimezone(),

    bookingSlots: [],
    bookingDetails: null,
    selectedBookingSlot: null,

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
            const slotDate = fromUnixTime(slot.startTime);
            return isSameDay(date, slotDate);
        });
    },

    setBookingSlots: (bookingSlots: BookingTimeslot[]) => {
        const newTimeSlots = [...get().bookingSlots, ...bookingSlots].sort((a, b) => a.startTime - b.startTime);

        set({
            bookingSlots: newTimeSlots,
        });
    },

    getDateKeySet: () => {
        const dates = get().bookingSlots.map((slot) => getDateKey(slot.startTime));
        return new Set(dates);
    },

    setSelectedDate: (date: Date) => {
        set({ selectedDate: date });
    },

    setSelectedBookingSlot: (slot: BookingTimeslot) => {
        set({ selectedBookingSlot: slot });
    },

    setSelectedTimezone: (timezone: string) => {
        set({ selectedTimezone: timezone });
    },
}));
