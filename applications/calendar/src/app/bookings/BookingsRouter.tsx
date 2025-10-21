import { Route } from 'react-router-dom';

export const BookingsRouter = () => {
    return (
        <>
            <Route path="/" exact render={() => <p>Root route</p>} />
            <Route path="/:bookingID" render={() => <p>Bookings detail route</p>} />
        </>
    );
};
