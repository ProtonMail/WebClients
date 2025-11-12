import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { BookingDetails } from '../components/BookingDetails/BookingDetails';
import { BookingPageLayout } from '../components/BookingPageLayout';
import { BookingSuccess } from '../components/BookingSuccess';
import { NoMatch, Reason } from '../components/NoMatch';
import { useExternalBookingLoader } from '../useExternalBookingLoader';

interface Props {
    isGuest?: boolean;
}

export const BookingsRouter = ({}: Props) => {
    const { loadPublicBooking } = useExternalBookingLoader();

    useEffect(() => {
        void loadPublicBooking(new Date());
    }, [loadPublicBooking]);

    return (
        <BookingPageLayout>
            <Switch>
                {/* TODO how could we have a shared basename instead of the array */}
                <Route path={['/bookings', '/bookings/guest']} exact component={BookingDetails} />
                <Route path="/bookings/success" exact component={BookingSuccess} />
                <Route>
                    <NoMatch reason={Reason.notFound} />
                </Route>
            </Switch>
        </BookingPageLayout>
    );
};
