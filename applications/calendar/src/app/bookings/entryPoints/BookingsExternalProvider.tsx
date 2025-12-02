import type { ReactNode } from 'react';
import React, { createContext, useContext } from 'react';

interface BookingExternalContextInterface {
    isGuest: boolean;
}

const BookingExternalContext = createContext<BookingExternalContextInterface | undefined>(undefined);

interface BookingExternalProviderProps {
    isGuest: boolean;
    children: ReactNode;
}

export const BookingExternalProvider = ({ isGuest, children }: BookingExternalProviderProps) => {
    return <BookingExternalContext.Provider value={{ isGuest }}>{children}</BookingExternalContext.Provider>;
};

export const useBookingsProvider = () => {
    const context = useContext(BookingExternalContext);
    if (context === undefined) {
        throw new Error('useGuest must be used within a GuestProvider');
    }
    return context;
};
