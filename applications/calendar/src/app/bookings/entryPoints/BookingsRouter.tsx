import { Route, Switch } from 'react-router-dom';

import { BookingDetails } from '../components/BookingDetails/BookingDetails';
import { BookingPageLayout } from '../components/BookingPageLaout';
import { BookingSuccess } from '../components/BookingSuccess';
import { NoMatch, Reason } from '../components/NoMatch';

interface Props {
    isGuest?: boolean;
}

export const BookingsRouter = ({}: Props) => {
    return (
        <BookingPageLayout>
            <Switch>
                {/* TODO how could we have a shared basename instead of the array */}
                <Route path={['/bookings', '/bookings/guest']} exact component={BookingDetails} />
                <Route path={['/bookings/success', '/bookings/success/guest']} exact component={BookingSuccess} />
                <Route>
                    <NoMatch reason={Reason.notFound} />
                </Route>
            </Switch>
        </BookingPageLayout>
    );
};
