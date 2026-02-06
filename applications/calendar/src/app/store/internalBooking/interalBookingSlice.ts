import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { AddressKeysState } from '@proton/account/addressKeys';
import { getAddressKeysByUsageThunk } from '@proton/account/addressKeys/getAddressKeysByUsage';
import { getInitialModelState } from '@proton/account/initialModelState';
import type { ModelState } from '@proton/account/interface';
import type { KtState } from '@proton/account/kt';
import { getVerificationPreferencesThunk } from '@proton/account/publicKeys/verificationPreferences';
import { calendarsThunk } from '@proton/calendar/calendarsThunk';
import type { CalendarsState } from '@proton/calendar/types/CalendarsState';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import { createAsyncModelThunk, handleAsyncModel, previousSelector } from '@proton/redux-utilities';
import { deleteBookingPage, getUserBookingPage } from '@proton/shared/lib/api/calendarBookings';
import type { InternalBookingPagePayload } from '@proton/shared/lib/interfaces/calendar/Bookings';

import { BookingLocation } from '../../containers/bookings/interface';
import { getCalendarAndOwner } from '../../containers/bookings/utils/calendar/calendarHelper';
import {
    decryptAndVerifyBookingPageSecret,
    decryptBookingContent,
} from '../../containers/bookings/utils/crypto/bookingDecryption';
import type { InternalBookingPage, InternalBookingPageSliceInterface } from './interface';
import { createNewBookingPage, editBookingPage, loadBookingPage } from './internalBookingActions';

const name = 'internalBookings' as const;
interface InternalBookingState extends CalendarsState, AddressKeysState, KtState {
    internalBookings: ModelState<InternalBookingPageSliceInterface>;
}

type SliceState = InternalBookingState[typeof name];
type Model = NonNullable<SliceState['value']>;

export const selectInternalBooking = (state: InternalBookingState) => state[name];

const modelThunk = createAsyncModelThunk<Model, InternalBookingState, ProtonThunkArguments>(`${name}/fetch`, {
    miss: async ({ extraArgument, dispatch }) => {
        if (!extraArgument.unleashClient?.isEnabled('CalendarBookings')) {
            return {
                bookingPages: [],
            };
        }

        const pagesArray: InternalBookingPage[] = [];
        try {
            const [calendars, bookingPages] = await Promise.all([
                dispatch(calendarsThunk()),
                extraArgument.api<{ BookingPages: InternalBookingPagePayload[] }>(getUserBookingPage()),
            ]);

            for (const bookingPage of bookingPages.BookingPages) {
                const calData = getCalendarAndOwner(bookingPage.CalendarID, calendars);
                if (!calData) {
                    continue;
                }

                const [{ decryptionKeys }, verificationPreferences] = await Promise.all([
                    dispatch(
                        getAddressKeysByUsageThunk({
                            AddressID: calData.ownerAddress.AddressID,
                            withV6SupportForEncryption: false,
                            withV6SupportForSigning: false,
                        })
                    ),
                    dispatch(getVerificationPreferencesThunk({ email: calData.ownerAddress.Email, lifetime: 0 })),
                ]);
                try {
                    const decrypted = await decryptAndVerifyBookingPageSecret({
                        bookingUID: bookingPage.BookingUID,
                        encryptedSecret: bookingPage.EncryptedSecret,
                        selectedCalendar: bookingPage.CalendarID,
                        decryptionKeys,
                        verificationPreferences,
                    });

                    if (!decrypted) {
                        continue;
                    }

                    // This decrypts and verify the content of the page
                    const data = await decryptBookingContent({
                        bookingSecretBytes: decrypted.data,
                        encryptedContent: bookingPage.EncryptedContent,
                        bookingKeySalt: bookingPage.BookingKeySalt,
                        calendarId: bookingPage.CalendarID,
                        bookingUID: bookingPage.BookingUID,
                        verificationPreferences,
                    });

                    pagesArray.push({
                        ...data,
                        id: bookingPage.ID,
                        calendarID: bookingPage.CalendarID,
                        bookingUID: bookingPage.BookingUID,
                        link: `${window.location.origin}/bookings#${decrypted.data.toBase64({ alphabet: 'base64url' })}`,
                        minimumNoticeMode: bookingPage.MinimumNoticeMode,
                        // The backend is not passing conflictCalendarIDs when loading all bookings at the moment
                        conflictCalendarIDs: bookingPage.ConflictCalendarIDs || [],
                        verificationErrors: {
                            secretVerificationError: decrypted.failedToVerify,
                            slotVerificationError: false,
                            contentVerificationError: data.failedToVerify,
                        },
                    });
                    // We want to continue if decrypting one page fails
                } catch (e) {
                    continue;
                }
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn({ error });
        } finally {
            return { bookingPages: pagesArray };
        }
    },
    previous: previousSelector(selectInternalBooking),
});

export const deleteBookingPageThunk = createAsyncThunk<
    string,
    string,
    { extra: ProtonThunkArguments; state: InternalBookingState }
>(`${name}/delete`, async (bookingUId, { extra }) => {
    await extra.api(deleteBookingPage(bookingUId));
    return bookingUId;
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

        builder.addCase(loadBookingPage.fulfilled, (state, { payload }) => {
            if (!state.value) {
                return;
            }

            const bookingPage = state.value.bookingPages.find((page) => page.id === payload?.bookingUID);
            if (!bookingPage) {
                return;
            }

            // We update the stored booking pages to keep the verification errors
            state.value.bookingPages = state.value.bookingPages.map((page) => {
                if (page.id === bookingPage.id) {
                    return {
                        ...page,
                        verificationErrors: {
                            ...page.verificationErrors,
                            slotVerificationError: payload.verificationErrors.slotVerificationError,
                        },
                    };
                }
                return page;
            });

            state.value.bookingPageEditData = {
                ...payload,
            };
        });

        builder.addCase(createNewBookingPage.fulfilled, (state, { payload }) => {
            if (!state.value || !payload?.bookingPage) {
                return;
            }

            const newBookingPage: InternalBookingPage = {
                id: payload.bookingPage.ID,
                bookingUID: payload.bookingPage.BookingUID,
                calendarID: payload.bookingPage.CalendarID,
                summary: payload.initialBookingPage.summary,
                description: payload.initialBookingPage.description,
                location: payload.initialBookingPage.location,
                withProtonMeetLink: payload.initialBookingPage.locationType === BookingLocation.MEET,
                minimumNoticeMode: payload.initialBookingPage.minimumNoticeMode,
                conflictCalendarIDs: payload.initialBookingPage.conflictCalendarIDs,
                link: payload.bookingLink,
                verificationErrors: {
                    secretVerificationError: false,
                    slotVerificationError: false,
                    contentVerificationError: false,
                },
            };
            state.value.bookingPages = [...state.value.bookingPages, newBookingPage];
        });

        builder.addCase(editBookingPage.fulfilled, (state, { payload }) => {
            if (!state.value || !payload?.bookingPage) {
                return;
            }

            const currentBookingPage = state.value.bookingPages.find((page) => page.id === payload.bookingPage.ID);
            if (!currentBookingPage) {
                return;
            }

            const editedPage: InternalBookingPage = {
                id: payload.bookingPage.ID,
                bookingUID: payload.bookingPage.BookingUID,
                calendarID: payload.bookingPage.CalendarID,
                summary: payload.initialBookingPage.summary,
                description: payload.initialBookingPage.description,
                location: payload.initialBookingPage.location,
                withProtonMeetLink: payload.initialBookingPage.locationType === BookingLocation.MEET,
                minimumNoticeMode: payload.initialBookingPage.minimumNoticeMode,
                conflictCalendarIDs: payload.initialBookingPage.conflictCalendarIDs,
                link: currentBookingPage.link,
                verificationErrors: {
                    secretVerificationError: false,
                    slotVerificationError: false,
                    contentVerificationError: false,
                },
            };

            state.value.bookingPages = state.value.bookingPages.map((page) =>
                page.id === editedPage.id ? editedPage : page
            );
        });
    },
});

export const internalBookingActions = slice.actions;
export const internalBookingReducer = { [name]: slice.reducer };
export const internalBookingThunk = modelThunk.thunk;
