import { format, fromUnixTime } from 'date-fns';
import { create } from 'zustand';

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

export type BookingTimeslotWithDate = BookingTimeslot & {
    date: Date;
};

export type BookingDaySlots = {
    date: Date;
    timeslots: BookingTimeslotWithDate[];
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

export type BookingSlotDetails = {
    startTime: Date;
    endTime: Date;
};

interface BookingStore {
    bookingDetails: BookingDetails | null;
    bookingSlotDetails: BookingSlotDetails | null;
    timeslots: Map<string, BookingDaySlots>;
    isLoading: boolean;
    hasLoaded: boolean;
    selectedDate: Date;
    selectedTimezone: string;

    setLoading: (loading: boolean) => void;
    setBookingDetails: (details: BookingDetails) => void;
    getBookingDetails: () => BookingDetails | null;
    setBookingSlotDetails: (details: BookingSlotDetails) => void;
    getBookingSlotDetails: () => BookingSlotDetails | null;
    setTimeslots: (timeslots: BookingTimeslot[]) => void;
    getTimeslotsByDate: (date: Date) => BookingTimeslotWithDate[];
    getAllTimeslots: () => BookingTimeslotWithDate[];
    getAllDaySlots: () => BookingDaySlots[];
    getDaysWithSlots: () => Set<string>;
    setSelectedDate: (date: Date) => void;
    getSelectedDate: () => Date;
    setSelectedTimezone: (timezone: string) => void;
    getSelectedTimezone: () => string;
    clear: () => void;
}

/**
 * Converts a Date object to YYYY-MM-DD string in local timezone
 */
const getLocalDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd', { locale: dateLocale });
};

/**
 * Converts a timestamp to YYYY-MM-DD string in local timezone
 */
const getDateKey = (timestamp: number): string => {
    return format(fromUnixTime(timestamp), 'yyyy-MM-dd', { locale: dateLocale });
};

/**
 * Groups timeslots by date
 */
const groupTimeslotsByDate = (timeslots: BookingTimeslot[]): Map<string, BookingDaySlots> => {
    const grouped = new Map<string, BookingDaySlots>();

    timeslots.forEach((timeslot) => {
        const date = fromUnixTime(timeslot.startTime);
        const dateKey = getDateKey(timeslot.startTime);
        const timeslotWithDate: BookingTimeslotWithDate = { ...timeslot, date };

        const existing = grouped.get(dateKey);

        if (existing) {
            existing.timeslots.push(timeslotWithDate);
        } else {
            grouped.set(dateKey, {
                date,
                timeslots: [timeslotWithDate],
            });
        }
    });

    grouped.forEach((daySlots) => {
        daySlots.timeslots.sort((a, b) => {
            return a.startTime - b.startTime;
        });
    });

    return grouped;
};

export const useBookingStore = create<BookingStore>((set, get) => ({
    bookingDetails: null,
    bookingSlotDetails: null,
    timeslots: new Map(),
    isLoading: false,
    hasLoaded: false,
    selectedDate: new Date(),
    selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

    setLoading: (loading: boolean) => {
        set({ isLoading: loading });
        if (!loading && !get().hasLoaded) {
            set({ hasLoaded: true });
        }
    },

    setBookingDetails: (details: BookingDetails) => {
        set({ bookingDetails: details });
    },

    getBookingDetails: () => {
        return get().bookingDetails;
    },

    setBookingSlotDetails: (details: BookingSlotDetails) => {
        set({ bookingSlotDetails: details });
    },

    getBookingSlotDetails: () => {
        return get().bookingSlotDetails;
    },

    setTimeslots: (timeslots: BookingTimeslot[]) => {
        const grouped = groupTimeslotsByDate(timeslots);
        const currentTimeslots = get().timeslots;
        const mergedTimeslots = new Map(currentTimeslots);

        grouped.forEach((value, key) => {
            mergedTimeslots.set(key, value);
        });

        set({ timeslots: mergedTimeslots });
    },

    getTimeslotsByDate: (date: Date) => {
        const dateKey = getLocalDateKey(date);
        const daySlots = get().timeslots.get(dateKey);
        return daySlots?.timeslots.toSorted((a, b) => a.startTime - b.startTime) || [];
    },

    getAllTimeslots: () => {
        const timeslots: BookingTimeslotWithDate[] = [];
        get().timeslots.forEach((daySlots) => {
            timeslots.push(...daySlots.timeslots);
        });
        return timeslots;
    },

    getAllDaySlots: () => {
        return Array.from(get().timeslots.values()).sort((a, b) => {
            return a.date.getTime() - b.date.getTime();
        });
    },

    getDaysWithSlots: () => {
        return new Set(get().timeslots.keys());
    },

    setSelectedDate: (date: Date) => {
        set({ selectedDate: date });
    },

    getSelectedDate: () => {
        return get().selectedDate;
    },

    setSelectedTimezone: (timezone: string) => {
        set({ selectedTimezone: timezone });
    },

    getSelectedTimezone: () => {
        return get().selectedTimezone;
    },

    clear: () => {
        set({
            bookingSlotDetails: null,
            bookingDetails: null,
            timeslots: new Map(),
            isLoading: false,
            hasLoaded: false,
            selectedDate: new Date(),
            selectedTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
    },
}));
