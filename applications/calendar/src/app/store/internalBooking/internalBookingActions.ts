import { createAsyncThunk } from '@reduxjs/toolkit';

import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import { getDecryptedPassphraseAndCalendarKeysThunk } from '@proton/calendar/calendarBootstrap/keys';
import { createBookingPage, getBookingPageDetails, updateBookingPage } from '@proton/shared/lib/api/calendarBookings';

import type { APIBooking, SerializedFormData } from '../../containers/bookings/bookingsTypes';
import { getCalendarAndOwner } from '../../containers/bookings/utils/calendar/calendarHelper';
import { decryptAndVerifyBookingPageSecret } from '../../containers/bookings/utils/crypto/bookingDecryption';
import {
    encryptBookingPage,
    encryptBookingPageEdition,
} from '../../containers/bookings/utils/crypto/bookingEncryption';
import { verifyBookingSlots } from '../../containers/bookings/utils/crypto/bookingVerification';
import type { CalendarThunkExtra } from '../store';
import type {
    BookingPageCreationReturn,
    BookingPageEditData,
    BookingPageEditionReturn,
    VerificationError,
} from './interface';

export const loadBookingPage = createAsyncThunk<
    Omit<BookingPageEditData, 'verificationErrors'> & {
        verificationErrors: Omit<VerificationError, 'secretVerificationError' | 'contentVerificationError'>;
    },
    string,
    CalendarThunkExtra
>('internalBookings/loadPage', async (payload, thunkExtra) => {
    const emptyReturn = {
        slots: [],
        bookingUID: payload,
        encryptedSecret: '',
        encryptedContent: '',
        bookingKeySalt: '',
        verificationErrors: {
            slotVerificationError: false,
        },
    };

    try {
        const { BookingPage } = await thunkExtra.extra.api<{ BookingPage: APIBooking }>(getBookingPageDetails(payload));

        const calData = getCalendarAndOwner(BookingPage.CalendarID, thunkExtra.getState().calendars.value);
        if (!calData) {
            return emptyReturn;
        }

        const verificationPreferences = await thunkExtra.dispatch(
            getVerificationPreferencesThunk({ email: calData.ownerAddress.Email, lifetime: 0 })
        );

        const slotVerification = await verifyBookingSlots({
            bookingSlots: BookingPage.Slots,
            bookingUID: BookingPage.BookingUID,
            verificationPreferences,
        });

        const formattedSlots = BookingPage.Slots.map((slot) => ({
            start: slot.StartTime,
            end: slot.EndTime,
            timezone: slot.Timezone,
            rrule: slot.RRule,
        }));

        return {
            slots: formattedSlots,
            bookingUID: BookingPage.ID,
            encryptedSecret: BookingPage.EncryptedSecret,
            encryptedContent: BookingPage.EncryptedContent,
            bookingKeySalt: BookingPage.BookingKeySalt,
            verificationErrors: {
                slotVerificationError: slotVerification.failedToVerify,
            },
        };
    } catch (e) {
        // eslint-disable-next-line no-console
        console.warn(e);
        throw e;
    }
});

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
                withV6SupportForEncryption: false,
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
    if (!payload.selectedCalendar) {
        throw new Error('Missing selected calendar');
    }

    try {
        const editData = thunkExtra.getState().internalBookings.value?.bookingPageEditData;
        const bookingPage = thunkExtra
            .getState()
            .internalBookings.value?.bookingPages.find((page) => page.id === editData?.bookingUID);

        if (!editData || !bookingPage) {
            throw new Error('No booking page edit data found');
        }

        const calData = getCalendarAndOwner(payload.selectedCalendar, thunkExtra.getState().calendars.value);
        if (!calData) {
            return;
        }

        const [{ decryptionKeys, encryptionKey, signingKeys }, { decryptedCalendarKeys }] = await Promise.all([
            thunkExtra.dispatch(
                getAddressKeysByUsageThunk({
                    AddressID: calData.ownerAddress.AddressID,
                    withV6SupportForEncryption: false,
                    withV6SupportForSigning: false,
                })
            ),
            thunkExtra.dispatch(getDecryptedPassphraseAndCalendarKeysThunk({ calendarID: calData.calendar.ID })),
        ]);

        const decryptedSecret = await decryptAndVerifyBookingPageSecret({
            bookingUID: bookingPage.bookingUID,
            encryptedSecret: editData.encryptedSecret,
            selectedCalendar: calData.calendar.ID,
            decryptionKeys,
            // We skip verification here as it was already done and is stored in the booking page
            verificationPreferences: null,
        });

        const pageData = await encryptBookingPageEdition({
            editData,
            calendarID: calData.calendar.ID,
            updateData: payload,
            signingKeys,
            encryptionKey,
            decryptedSecret: decryptedSecret.data,
            calendarKeys: decryptedCalendarKeys,
        });

        const response = await thunkExtra.extra.api<{ BookingPage: APIBooking }>(
            updateBookingPage(editData.bookingUID, {
                ...pageData,
                EncryptedSecret: bookingPage.verificationErrors.secretVerificationError
                    ? pageData.EncryptedSecret
                    : editData.encryptedSecret,
            })
        );

        return { bookingPage: response.BookingPage, initialBookingPage: payload };
    } catch (e) {
        throw e;
    }
});
