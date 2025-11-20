import { createAsyncThunk } from '@reduxjs/toolkit';

import { getBookingPageDetails } from '@proton/shared/lib/api/calendarBookings';

import type { APIBooking } from '../../containers/bookings/bookingsTypes';
import type { CalendarThunkExtra } from '../store';

// TODO move this elsewhere
interface LoadBookingPageReturn {
    slots: any[];
    bookingId: string;
}

export const loadBookingPage = createAsyncThunk<LoadBookingPageReturn, string, CalendarThunkExtra>(
    'internalBookings/loadPage',
    async (payload, thunkExtra) => {
        if (!thunkExtra.extra.unleashClient.isEnabled('EditCalendarBookings')) {
            return {
                slots: [],
                bookingId: payload,
            };
        }

        try {
            const { BookingPage } = await thunkExtra.extra.api<{ BookingPage: APIBooking }>(
                getBookingPageDetails(payload)
            );

            const pages = thunkExtra.getState().internalBookings.value;
            // eslint-disable-next-line no-console
            console.log({ BookingPage, pages });

            // todo handle this
            return {
                slots: [],
                bookingId: BookingPage.ID,
            };
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e);
            throw e;
        }
    }
);
