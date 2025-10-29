import type { BookingPageCreationPayload } from '../interfaces/calendar/Bookings';

export const createBookingPage = (data: BookingPageCreationPayload) => ({
    url: 'calendar/v1/booking',
    method: 'POST',
    data,
});
