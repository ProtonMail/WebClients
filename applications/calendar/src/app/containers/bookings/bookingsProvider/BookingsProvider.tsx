import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { addMilliseconds } from 'date-fns';

import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewEvent } from '../../calendar/interface';
import { BookingState, type Slot } from './interface';

interface BookingsContextValue {
    isBookingActive: boolean;
    createNewBookingsPage: () => void;
    bookingsState: BookingState;
    writeableCalendars: VisualCalendar[];
    loadingWriteableCalendars: boolean;
    bookingSlots: Slot[];
    addBookingSlot: (startDate: Date, eventDuration: number) => void;
    removeBookingSlot: (slotId: string) => void;
    convertSlotToCalendarViewEvents: (createEventCalendar?: VisualCalendar) => CalendarViewEvent[];
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

// TODO maybe a reset booking slot method might be useful
// TODO change the view to weekly view when starting a new booking page
export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);
    const [bookingSlots, setBookingSlots] = useState<Slot[]>([]);

    const [writeableCalendars = [], loadingWriteableCalendars] = useWriteableCalendars();

    const createNewBookingsPage = () => {
        setBookingsState(BookingState.CREATE_NEW);
    };

    // TODO what should happen if we add a slot in the past
    const addBookingSlot = (startDate: Date, eventDuration: number) => {
        const duration = Math.min(eventDuration, 120 * 60 * 1000);

        setBookingSlots([
            ...bookingSlots,
            {
                id: `booking-slot-${startDate.getTime().toString()}`,
                start: startDate,
                end: addMilliseconds(startDate, duration),
            },
        ]);
    };

    const removeBookingSlot = (slotId: string) => {
        setBookingSlots(bookingSlots.filter((slot) => slot.id !== slotId));
    };

    const convertSlotToCalendarViewEvents = (createEventCalendar?: VisualCalendar): CalendarViewEvent[] => {
        if (!createEventCalendar) {
            return [];
        }

        return bookingSlots.map((slot: any) => ({
            uniqueId: slot.id,
            isAllDay: false,
            isAllPartDay: false,
            start: slot.start,
            end: slot.end,
            data: {
                // TODO change this to the selected visual calendar coming from the form
                calendarData: createEventCalendar,
            },
        }));
    };

    const value: BookingsContextValue = {
        isBookingActive: bookingsState === BookingState.CREATE_NEW || bookingsState === BookingState.EDIT_EXISTING,
        createNewBookingsPage,
        bookingsState,
        writeableCalendars,
        loadingWriteableCalendars,
        bookingSlots,
        addBookingSlot,
        removeBookingSlot,
        convertSlotToCalendarViewEvents,
    };

    return <BookingsContext.Provider value={value}>{children}</BookingsContext.Provider>;
};

export const useBookings = () => {
    const context = useContext(BookingsContext);
    if (context === undefined) {
        throw new Error('useBookings must be used within a BookingsContext');
    }
    return context;
};
