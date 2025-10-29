import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { useFlag } from '@proton/unleash';

import { BookingDetails } from './components/BookingDetails/BookingDetails';
import { BookingPageLayout } from './components/BookingPageLaout';
import { NoMatch, Reason } from './components/NoMatch';

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
                <Route path="/" exact component={BookingDetails} />
                <Route>
                    <NoMatch reason={Reason.notFound} />
                </Route>
            </Switch>
        </BookingPageLayout>
    );
};
