import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

import { useWriteableCalendars } from '@proton/calendar/calendars/hooks';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import { BookingState } from './interface';

interface BookingsContextValue {
    createNewBookingsPage: () => void;
    bookingsState: BookingState;
    writeableCalendars: VisualCalendar[];
    loadingWriteableCalendars: boolean;
}

const BookingsContext = createContext<BookingsContextValue | undefined>(undefined);

export const BookingsProvider = ({ children }: { children: ReactNode }) => {
    const [bookingsState, setBookingsState] = useState<BookingState>(BookingState.OFF);

    const [writeableCalendars = [], loadingWriteableCalendars] = useWriteableCalendars();

    const createNewBookingsPage = () => {
        setBookingsState(BookingState.CREATE_NEW);
    };

    const value: BookingsContextValue = {
        createNewBookingsPage: createNewBookingsPage,
        bookingsState: bookingsState,
        writeableCalendars,
        loadingWriteableCalendars,
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
