import { create } from 'zustand';

export type BookingTimeslot = {
    id: string;
    startTime: number;
    endTime: number;
    timezone: string;
    rrule: string | undefined;
};

export type BookingTimeslotWithDate = BookingTimeslot & {
    date: Date;
};

export type BookingDaySlots = {
    date: Date;
    timeslots: BookingTimeslotWithDate[];
};

export type BookingDetails = {
    bookingUid: string;
    summary: string;
    description: string;
    location: string;
    duration: number | undefined;
    timezone: string | undefined;
};

interface BookingStore {
    bookingDetails: BookingDetails | null;
    timeslots: Map<string, BookingDaySlots>;
    isLoading: boolean;
    hasLoaded: boolean;

    setLoading: (loading: boolean) => void;
    setBookingDetails: (details: BookingDetails) => void;
    getBookingDetails: () => BookingDetails | null;
    setTimeslots: (timeslots: BookingTimeslot[]) => void;
    getTimeslotsByDate: (date: Date) => BookingTimeslotWithDate[];
    getAllTimeslots: () => BookingTimeslotWithDate[];
    getAllDaySlots: () => BookingDaySlots[];
    clear: () => void;
}

/**
 * Converts a timestamp to YYYY-MM-DD string
 */
const getDateKey = (timestamp: number): string => {
    return new Date(timestamp * 1000).toISOString().split('T')[0];
};

/**
 * Groups timeslots by date
 */
const groupTimeslotsByDate = (timeslots: BookingTimeslot[]): Map<string, BookingDaySlots> => {
    const grouped = new Map<string, BookingDaySlots>();

    timeslots.forEach((timeslot) => {
        const date = new Date(timeslot.startTime * 1000);
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
    timeslots: new Map(),
    isLoading: false,
    hasLoaded: false,

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

    setTimeslots: (timeslots: BookingTimeslot[]) => {
        const grouped = groupTimeslotsByDate(timeslots);
        set({ timeslots: grouped });
    },

    getTimeslotsByDate: (date: Date) => {
        const dateKey = date.toISOString().split('T')[0];
        const daySlots = get().timeslots.get(dateKey);
        return daySlots?.timeslots || [];
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

    clear: () => {
        set({
            bookingDetails: null,
            timeslots: new Map(),
            isLoading: false,
            hasLoaded: false,
        });
    },
}));
