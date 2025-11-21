import type {
    BookingPageCreationPayload,
    BookingPageEditPayload,
    BookingSlotConfirmationPayload,
} from '../interfaces/calendar/Bookings';

export const getUserBookingPage = () => ({
    url: `calendar/v1/booking`,
    method: 'GET',
});

export const createBookingPage = (data: BookingPageCreationPayload) => ({
    url: 'calendar/v1/booking',
    method: 'POST',
    data,
});

export const updateBookingPage = (bookingId: string, data: BookingPageEditPayload) => ({
    url: `calendar/v1/booking/${bookingId}`,
    method: 'PUT',
    data,
});

export const getBookingPageDetails = (bookingUid: string) => ({
    url: `calendar/v1/booking/${bookingUid}`,
    method: 'GET',
});

export const queryPublicBookingPage = (
    bookingId: string,
    { startTime, endTime }: { startTime: number; endTime: number }
) => ({
    url: `calendar/v1/booking/external/${bookingId}`,
    method: 'GET',
    params: {
        Start: startTime,
        End: endTime,
    },
});
export const confirmBookingSlot = (bookingId: string, slotId: string, data: BookingSlotConfirmationPayload) => ({
    url: `calendar/v1/booking/external/${bookingId}/slots/${slotId}/confirm`,
    method: 'POST',
    data,
});

export const deleteBookingPage = (bookingId: string) => ({
    url: `calendar/v1/booking/${bookingId}`,
    method: 'DELETE',
});

export const getNextAvailableSlot = (bookingId: string, startTime: number) => ({
    url: `calendar/v1/booking/external/${bookingId}/next-slot`,
    method: 'GET',
    params: {
        StartTime: startTime,
    },
});
