import { BookingAuthApp } from './authenticated/BookingAuthApp';
import { BookingGuestApp } from './guest/BookingGuestApp';

export const BookingsEntry = () => {
    // Quick check to redirect the user to the guest app if they are not authenticated
    if (window.location.pathname.includes('/guest')) {
        return <BookingGuestApp />;
    } else {
        return <BookingAuthApp />;
    }
};
