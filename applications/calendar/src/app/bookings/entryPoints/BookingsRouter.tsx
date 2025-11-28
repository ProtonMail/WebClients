import { useEffect, useRef } from 'react';
import { Route, Switch } from 'react-router-dom';

import { BookingPage } from '../components/BookingPage/BookingPage';
import { BookingPageLayout } from '../components/BookingPageLayout';
import { BookingSuccess } from '../components/BookingSuccess';
import { NoMatch, Reason } from '../components/NoMatch';
import { useExternalBookingLoader } from '../useExternalBookingLoader';

interface Props {
    isGuest: boolean;
}

export const BookingsRouter = ({ isGuest }: Props) => {
    const initialized = useRef(false);
    const { loadPublicBooking } = useExternalBookingLoader();

    useEffect(() => {
        if (!initialized.current) {
            void loadPublicBooking(new Date());
            initialized.current = true;
        }
    }, [loadPublicBooking]);

    return (
        <BookingPageLayout>
            <Switch>
                {/* TODO how could we have a shared basename instead of the array */}
                <Route path={['/bookings', '/bookings/guest']} exact component={BookingPage} />
                <Route path="/bookings/success" exact render={() => <BookingSuccess isGuest={isGuest} />} />
                <Route>
                    <NoMatch reason={Reason.notFound} />
                </Route>
            </Switch>
        </BookingPageLayout>
    );
};
