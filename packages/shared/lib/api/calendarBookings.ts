import type { BookingPageCreationPayload, BookingSlotConfirmationPayload } from '../interfaces/calendar/Bookings';

export const getUserBookingPage = () => ({
    url: `calendar/v1/booking`,
    method: 'GET',
});

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
export const confirmBookingSlot = (bookingUid: string, slotId: string, data: BookingSlotConfirmationPayload) => ({
    url: `calendar/v1/booking/external/${bookingUid}/slots/${slotId}/confirm`,
    method: 'POST',
    data,
});
