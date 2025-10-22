import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { useFlag } from '@proton/unleash';

import { BookingDetails } from './components/BookingDetails/BookingDetails';
import { BookingPageLayout } from './components/BookingPageLaout';

// Catch-all that redirects non-supported URL to the origin
const RedirectToOrigin = () => {
    useEffect(() => {
        window.location.replace(window.location.origin);
    }, []);

    return null;
};

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
            <Switch>
                <Route path="/:bookingId" exact component={BookingDetails} />
                <Route component={RedirectToOrigin} />
            </Switch>
        </BookingPageLayout>
    );
};
