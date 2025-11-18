import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { AddressKeysState } from '@proton/account/addressKeys';
import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { getInitialModelState } from '@proton/account/initialModelState';
import type { ModelState } from '@proton/account/interface';
import type { KtState } from '@proton/account/kt';
import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import type { CalendarsState } from '@proton/calendar/calendars';
import { calendarsThunk } from '@proton/calendar/calendars';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto/lib';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { deleteBookingPage, getUserBookingPage } from '@proton/shared/lib/api/calendarBookings';
import { base64StringToUint8Array, uint8ArrayToPaddedBase64URLString } from '@proton/shared/lib/helpers/encoding';
import type { InternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import { decryptBookingContent } from '../../bookings/utils/decryptBookingContent';
import type { InternalBookingPage, InternalBookingPageSliceInterface } from './interface';

const name = 'internalBookings' as const;
interface InternalBookingState extends CalendarsState, AddressKeysState, KtState {
    internalBookings: ModelState<InternalBookingPageSliceInterface>;
}

type SliceState = InternalBookingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectInternalBooking = (state: InternalBookingState) => state[name];

const modelThunk = createAsyncModelThunk<Model, InternalBookingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        if (!extraArgument.unleashClient.isEnabled('CalendarBookings')) {
            return {
                bookingPages: [],
            };
        }

        const [calendars, bookingPages] = await Promise.all([
            dispatch(calendarsThunk()),
            extraArgument.api<{ BookingPages: InternalBookingPagePayload[] }>(getUserBookingPage()),
        ]);

        const pagesArray: InternalBookingPage[] = [];

        for (const bookingPage of bookingPages.BookingPages) {
            const calendar = calendars.find((calendar) => calendar.ID === bookingPage.CalendarID);
            if (!calendar) {
                continue;
            }

            const calendarOwner = calendar.Owner.Email;
            const ownerAddress = calendar.Members.find((member) => member.Email === calendarOwner);
            if (!ownerAddress) {
                continue;
            }

            const [{ decryptionKeys }, { verifyingKeys }] = await Promise.all([
                dispatch(
                    getAddressKeysByUsageThunk({
                        AddressID: ownerAddress.AddressID,
                        withV6SupportForEncryption: true,
                        withV6SupportForSigning: false,
                    })
                ),
                dispatch(getVerificationPreferencesThunk({ email: ownerAddress.Email, lifetime: 0 })),
            ]);

            const signatureContext = verifyingKeys
                ? { value: `bookings.secret.${calendar.ID}`, required: true }
                : undefined;

            const decrypted = await CryptoProxy.decryptMessage({
                binaryMessage: base64StringToUint8Array(bookingPage.EncryptedSecret),
                decryptionKeys,
                verificationKeys: verifyingKeys,
                signatureContext,
                format: 'binary',
            });

            if (verifyingKeys && decrypted.verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                // eslint-disable-next-line no-console
                console.warn({ errors: decrypted.verificationErrors });
                throw new Error('Encrypted booking secret verification failed');
            }

            // This decrypts and verify the content of the page
            const data = await decryptBookingContent({
                bookingSecretBytes: decrypted.data,
                encryptedContent: bookingPage.EncryptedContent,
                bookingKeySalt: bookingPage.BookingKeySalt,
                calendarId: bookingPage.CalendarID,
                bookingUid: bookingPage.BookingUID,
                verificationKeys: verifyingKeys,
            });

            pagesArray.push({
                ...data,
                id: bookingPage.ID,
                calendarID: bookingPage.CalendarID,
                bookingUID: bookingPage.BookingUID,
                link: `${window.location.origin}/bookings#${uint8ArrayToPaddedBase64URLString(decrypted.data)}`,
            });
        }

        return { bookingPages: pagesArray };
    },
    previous: previousSelector(selectInternalBooking),
});

export const deleteBookingPageThunk = createAsyncThunk<
    string,
    string,
    { extra: ProtonThunkArguments; state: InternalBookingState }
>(`${name}/delete`, async (bookingId, { extra }) => {
    await extra.api(deleteBookingPage(bookingId));
    return bookingId;
});

const initialState = getInitialModelState<Model>();
const slice = createSlice({
    name,
    initialState,
    reducers: {
        addBookingPage: (state, action: PayloadAction<InternalBookingPage>) => {
            state.value?.bookingPages.push(action.payload);
        },
    },
    extraReducers: (builder) => {
        handleAsyncModel(builder, modelThunk);
        builder.addCase(deleteBookingPageThunk.fulfilled, (state, action) => {
            if (state.value?.bookingPages) {
                state.value.bookingPages = state.value.bookingPages.filter((page) => page.id !== action.payload);
            }
        });
    },
});

export const internalBookingActions = slice.actions;
export const internalBookingReducer = { [name]: slice.reducer };
export const internalBookingThunk = modelThunk.thunk;
