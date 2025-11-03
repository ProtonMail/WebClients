import { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';

import { Loader } from '@proton/components';
import { useFlag } from '@proton/unleash';

import { BookingDetails } from './components/BookingDetails/BookingDetails';
import { BookingPageLayout } from './components/BookingPageLaout';
import { BookingSuccess } from './components/BookingSuccess';
import { NoMatch, Reason } from './components/NoMatch';

export const BookingsRouter = () => {
    const isEnabled = useFlag('CalendarExternalBookings');

    useEffect(() => {
        if (!isEnabled) {
            window.location.replace(window.location.origin);
        }
    }, [isEnabled]);

    if (!isEnabled) {
        return <Loader />;
    }

    return (
        <BookingPageLayout>
            <Switch>
                <Route path="/" exact component={BookingDetails} />
                <Route path="/success" exact component={BookingSuccess} />
                <Route>
                    <NoMatch reason={Reason.notFound} />
                </Route>
            </Switch>
        </BookingPageLayout>
    );
};
