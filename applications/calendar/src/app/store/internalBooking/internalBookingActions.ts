import { createAsyncThunk } from '@reduxjs/toolkit';

import { getBookingPageDetails } from '@proton/shared/lib/api/calendarBookings';

import type { APIBooking } from '../../containers/bookings/bookingsTypes';
import type { CalendarThunkExtra } from '../store';
import type { BookingPageEditData } from './interface';

export const loadBookingPage = createAsyncThunk<BookingPageEditData, string, CalendarThunkExtra>(
    'internalBookings/loadPage',
    async (payload, thunkExtra) => {
        if (!thunkExtra.extra.unleashClient.isEnabled('EditCalendarBookings')) {
            return {
                slots: [],
                bookingId: payload,
                encryptedSecret: '',
                encryptedContent: '',
            };
        }

        try {
            const { BookingPage } = await thunkExtra.extra.api<{ BookingPage: APIBooking }>(
                getBookingPageDetails(payload)
            );

            const formattedSlots = BookingPage.Slots.map((slot) => ({
                start: slot.StartTime,
                end: slot.EndTime,
                timezone: slot.Timezone,
                duration: slot.Duration,
                rrule: slot.RRule,
            }));

            return {
                slots: formattedSlots,
                bookingId: BookingPage.ID,
                encryptedSecret: BookingPage.EncryptedSecret,
                encryptedContent: BookingPage.EncryptedContent,
            };
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn(e);
            throw e;
        }
    }
);
