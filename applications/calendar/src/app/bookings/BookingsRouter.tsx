import { BrowserRouter, Route, Switch } from 'react-router-dom';

export const BookingsRouter = () => {
    return (
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
    );
};
