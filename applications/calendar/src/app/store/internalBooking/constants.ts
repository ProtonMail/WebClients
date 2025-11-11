import type { InternalBookingStateType } from './interalBookingSlice';

export const initialState: InternalBookingStateType = {
    value: {
        bookingPages: [],
    },
    error: undefined,
    meta: {
        fetchedAt: 0,
        fetchedEphemeral: true,
    },
};
