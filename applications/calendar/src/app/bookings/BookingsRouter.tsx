import { useEffect } from 'react';
import { Route } from 'react-router-dom';

import { useFlag } from '@proton/unleash';

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

    return <Route path="/" exact render={() => <p data-testid="booking-app">Booking app</p>} />;
};
