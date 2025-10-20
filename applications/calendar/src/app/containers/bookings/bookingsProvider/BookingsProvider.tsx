import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { addMilliseconds } from 'date-fns';

import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewBusyEvent, CalendarViewEvent } from '../../calendar/interface';
import { BOOKING_SLOT_ID, BookingState, type Slot } from './interface';

interface BookingsContextValue {
    isBookingActive: boolean;
    toggleBookingPageCreation: () => void;
    bookingsState: BookingState;
    writeableCalendars: VisualCalendar[];
    loadingWriteableCalendars: boolean;
    bookingSlots: Slot[];
    addBookingSlot: (startDate: Date, eventDuration: number) => void;
    removeBookingSlot: (slotId: string) => void;
    convertSlotToCalendarViewEvents: (visualCalendar?: VisualCalendar) => CalendarViewEvent[];
    isBookingSlotEvent: (event: CalendarViewEvent | CalendarViewBusyEvent) => event is CalendarViewEvent;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

// TODO used as temporary value, will be replaced with value coming from the booking form.
// The value will be based on the even duration of the selected calendar.
const tmpEventDurationMinute = 120;
const tmpEventDurationMiliSeconds = tmpEventDurationMinute * 60 * 1000;

// TODO maybe a reset booking slot method might be useful
// TODO change the view to weekly view when starting a new booking page
export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);
    const [bookingSlots, setBookingSlots] = useState<Slot[]>([]);

    const [writeableCalendars = [], loadingWriteableCalendars] = useWriteableCalendars();

    const toggleBookingPageCreation = () => {
        if (bookingsState === BookingState.CREATE_NEW) {
            setBookingsState(BookingState.OFF);
            setBookingSlots([]);
        } else {
            setBookingsState(BookingState.CREATE_NEW);
        }
    };

    // TODO what should happen if we add a slot in the past
    const addBookingSlot = (startDate: Date, eventDuration: number) => {
        const duration = Math.min(eventDuration, tmpEventDurationMiliSeconds);

        setBookingSlots([
            ...bookingSlots,
            {
                id: `${BOOKING_SLOT_ID}-${startDate.getTime().toString()}`,
                start: startDate,
                end: addMilliseconds(startDate, duration),
            },
        ]);
    };

    const removeBookingSlot = (slotId: string) => {
        setBookingSlots(bookingSlots.filter((slot) => slot.id !== slotId));
    };

    const convertSlotToCalendarViewEvents = (visualCalendar?: VisualCalendar): CalendarViewEvent[] => {
        if (!visualCalendar) {
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
                calendarData: visualCalendar,
            },
        }));
    };

    const isBookingSlotEvent = (event: CalendarViewEvent | CalendarViewBusyEvent): event is CalendarViewEvent => {
        return event.uniqueId.startsWith(BOOKING_SLOT_ID);
    };

    const value: BookingsContextValue = {
        isBookingActive: bookingsState === BookingState.CREATE_NEW || bookingsState === BookingState.EDIT_EXISTING,
        toggleBookingPageCreation,
        bookingsState,
        writeableCalendars,
        loadingWriteableCalendars,
        bookingSlots,
        addBookingSlot,
        removeBookingSlot,
        convertSlotToCalendarViewEvents,
        isBookingSlotEvent,
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
