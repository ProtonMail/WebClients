import type { BookingPageCreationPayload } from '../interfaces/calendar/Bookings';

export const createBookingPage = (data: BookingPageCreationPayload) => ({
    url: 'calendar/v1/booking',
    method: 'POST',
    data,
});

export const queryPublicBookingPage = (
    bookingUid: string,
    { startTime, endTime }: { startTime: number; endTime: number }
) => ({
    url: `calendar/v1/booking/external/${bookingUid}`,
    method: 'GET',
    params: {
        Start: startTime,
        End: endTime,
    },
});
