import { createAsyncThunk } from '@reduxjs/toolkit';

import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { getDecryptedPassphraseAndCalendarKeysThunk } from '@proton/calendar/calendarBootstrap/keys';
import { createBookingPage, getBookingPageDetails } from '@proton/shared/lib/api/calendarBookings';

import type { APIBooking, SerializedFormData } from '../../containers/bookings/bookingsTypes';
import { getCalendarAndOwner } from '../../containers/bookings/utils/calendar/calendarHelper';
import { encryptBookingPage } from '../../containers/bookings/utils/crypto/bookingEncryption';
import type { CalendarThunkExtra } from '../store';
import type { BookingPageCreationReturn, BookingPageEditData } from './interface';

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

export const createNewBookingPage = createAsyncThunk<
    BookingPageCreationReturn | undefined,
    SerializedFormData,
    CalendarThunkExtra
>('internalBookings/createPage', async (payload, thunkExtra) => {
    const calendars = thunkExtra.getState().calendars.value;
    if (!payload.selectedCalendar) {
        throw new Error('Missing selected calendar');
    }

    const calData = getCalendarAndOwner(payload.selectedCalendar, calendars);
    if (!calData) {
        return undefined;
    }

    const [{ encryptionKey, signingKeys }, { decryptedCalendarKeys }] = await Promise.all([
        thunkExtra.dispatch(
            getAddressKeysByUsageThunk({
                AddressID: calData.ownerAddress.AddressID,
                withV6SupportForEncryption: true,
                withV6SupportForSigning: false,
            })
        ),
        thunkExtra.dispatch(getDecryptedPassphraseAndCalendarKeysThunk({ calendarID: calData.calendar.ID })),
    ]);

    const data = await encryptBookingPage({
        formData: payload,
        calendarKeys: decryptedCalendarKeys,
        encryptionKey,
        signingKeys,
        calendarID: calData.calendar.ID,
    });

    const { BookingLink: bookingLink, ...apiPayload } = data;

    const response = await thunkExtra.extra.api<{ BookingPage: any; Code: number }>(
        createBookingPage({ ...apiPayload, CalendarID: calData.calendar.ID })
    );

    return { bookingPage: response.BookingPage, initialBookingPage: payload, bookingLink };
});
