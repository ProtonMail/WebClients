import { BrowserRouter, Route, Switch } from 'react-router-dom';

import UnAuthenticated from '@proton/components/containers/authentication/UnAuthenticated';
import ThemeProvider from '@proton/components/containers/themes/ThemeProvider';

import config from '../config';

export const BookingPageContainer = () => {
    return (
        <UnAuthenticated>
            <BrowserRouter>
                <Switch>
                    <Route path="/bookings/:bookingID">
                        <p>Bookings detail route</p>
                    </Route>
                    <Route path="/bookings">
                        <p>Root route</p>
                    </Route>
                </Switch>
            </BrowserRouter>
        </UnAuthenticated>
    );
};

export const BookingsApp = () => {
    return (
        <ThemeProvider appName={config.APP_NAME}>
            <BookingPageContainer />
        </ThemeProvider>
    );
};
