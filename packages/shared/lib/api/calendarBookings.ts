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

export const updateBookingPage = (bookingUID: string, data: BookingPageEditPayload) => ({
    url: `calendar/v1/booking/${bookingUID}`,
    method: 'PUT',
    data,
});

export const getBookingPageDetails = (bookingUID: string) => ({
    url: `calendar/v1/booking/${bookingUID}`,
    method: 'GET',
});

export const queryPublicBookingPage = (
    bookingUID: string,
    { startTime, endTime }: { startTime: number; endTime: number }
) => ({
    url: `calendar/v1/booking/external/${bookingUID}`,
    method: 'GET',
    params: {
        Start: startTime,
        End: endTime,
    },
});
export const confirmBookingSlot = (bookingUID: string, slotId: string, data: BookingSlotConfirmationPayload) => ({
    url: `calendar/v1/booking/external/${bookingUID}/slots/${slotId}/confirm`,
    method: 'POST',
    data,
});

export const deleteBookingPage = (bookingUID: string) => ({
    url: `calendar/v1/booking/${bookingUID}`,
    method: 'DELETE',
});

export const getNextAvailableSlot = (bookingUID: string, startTime: number) => ({
    url: `calendar/v1/booking/external/${bookingUID}/next-slot`,
    method: 'GET',
    params: {
        StartTime: startTime,
    },
});
