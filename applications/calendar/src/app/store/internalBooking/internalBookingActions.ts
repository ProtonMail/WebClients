import { createAsyncThunk } from '@reduxjs/toolkit';
import { c } from 'ttag';

import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import { getDecryptedPassphraseAndCalendarKeysThunk } from '@proton/calendar/calendarBootstrap/keys';
import { createBookingPage, getBookingPageDetails, updateBookingPage } from '@proton/shared/lib/api/calendarBookings';

import type { APIBooking, SerializedFormData } from '../../containers/bookings/bookingsTypes';
import { getCalendarAndOwner } from '../../containers/bookings/utils/calendar/calendarHelper';
import { decryptBookingPageSecrets } from '../../containers/bookings/utils/crypto/bookingDecryption';
import {
    encryptBookingPage,
    encryptBookingPageEdition,
} from '../../containers/bookings/utils/crypto/bookingEncryption';
import type { CalendarThunkExtra } from '../store';
import type { BookingPageCreationReturn, BookingPageEditData, BookingPageEditionReturn } from './interface';

export const loadBookingPage = createAsyncThunk<BookingPageEditData, string, CalendarThunkExtra>(
    'internalBookings/loadPage',
    async (payload, thunkExtra) => {
        if (!thunkExtra.extra.unleashClient.isEnabled('EditCalendarBookings')) {
            return {
                slots: [],
                bookingId: payload,
                encryptedSecret: '',
                encryptedContent: '',
                bookingKeySalt: '',
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
                bookingKeySalt: BookingPage.BookingKeySalt,
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
    if (!thunkExtra.extra.unleashClient.isEnabled('CalendarBookings')) {
        return;
    }

    const calendars = thunkExtra.getState().calendars.value;
    if (!payload.selectedCalendar) {
        throw new Error('Missing selected calendar');
    }

    const calData = getCalendarAndOwner(payload.selectedCalendar, calendars);
    if (!calData) {
        throw new Error('No calendar data found');
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

export const editBookingPage = createAsyncThunk<
    BookingPageEditionReturn | undefined,
    SerializedFormData,
    CalendarThunkExtra
>('internalBookings/editPage', async (payload, thunkExtra) => {
    if (!thunkExtra.extra.unleashClient.isEnabled('EditCalendarBookings')) {
        return;
    }

    if (!payload.selectedCalendar) {
        throw new Error('Missing selected calendar');
    }

    try {
        const editData = thunkExtra.getState().internalBookings.value?.bookingPageEditData;
        if (!editData) {
            throw new Error('No booking page edit data found');
        }

        const calData = getCalendarAndOwner(payload.selectedCalendar, thunkExtra.getState().calendars.value);
        if (!calData) {
            return;
        }

        const [{ decryptionKeys, signingKeys }, { verifyingKeys }, { decryptedCalendarKeys }] = await Promise.all([
            thunkExtra.dispatch(
                getAddressKeysByUsageThunk({
                    AddressID: calData.ownerAddress.AddressID,
                    withV6SupportForEncryption: true,
                    withV6SupportForSigning: false,
                })
            ),
            thunkExtra.dispatch(getVerificationPreferencesThunk({ email: calData.ownerAddress.Email, lifetime: 0 })),
            thunkExtra.dispatch(getDecryptedPassphraseAndCalendarKeysThunk({ calendarID: calData.calendar.ID })),
        ]);

        const { data, failedToVerify } = await decryptBookingPageSecrets({
            encryptedSecret: editData.encryptedSecret,
            selectedCalendar: calData.calendar.ID,
            decryptionKeys,
            verifyingKeys,
        });

        if (failedToVerify) {
            thunkExtra.extra.notificationManager.createNotification({
                text: c('Info').t`Could not verify signature over booking page data`,
                type: 'error',
            });
        }

        const { EncryptedContent, Slots } = await encryptBookingPageEdition({
            editData,
            calendarID: calData.calendar.ID,
            updateData: payload,
            signingKeys,
            decryptedSecret: data,
            calendarKeys: decryptedCalendarKeys,
        });

        const response = await thunkExtra.extra.api<{ BookingPage: APIBooking }>(
            updateBookingPage(editData.bookingId, {
                EncryptedContent,
                Slots,
            })
        );

        return { bookingPage: response.BookingPage, initialBookingPage: payload };
    } catch (e) {
        throw e;
    }
});
