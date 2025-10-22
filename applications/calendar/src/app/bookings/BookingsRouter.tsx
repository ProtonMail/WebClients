import { useEffect } from 'react';
import { Route } from 'react-router-dom';

import { useFlag } from '@proton/unleash';

import { BookingDetails } from './components/BookingDetails';
import { BookingPageLayout } from './components/BookingPageLaout';

export const BookingsRouter = () => {
    const isEnabled = useFlag('CalendarExternalBookings');

    useEffect(() => {
        if (!isEnabled) {
            window.location.replace(window.location.origin);
        }
    }, [isEnabled]);

    if (!isEnabled) {
        return null;
    }

    return (
        <BookingPageLayout>
            <Route path="/" exact render={() => <BookingDetails />} />
        </BookingPageLayout>
    );
};
