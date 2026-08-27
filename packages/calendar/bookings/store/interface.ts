import type { Action, ThunkDispatch } from '@reduxjs/toolkit';

import type { AddressKeysState } from '@proton/account/addressKeys';
import type { KtState } from '@proton/account/kt';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types';
import type { ModelState } from '@proton/redux-utilities/initialModelState/interface';

import type { CalendarsBootstrapState } from '../../calendarBootstrap';
import type { CalendarsState } from '../../calendars';
import type { APIBooking, BookingPageEditData, MinimumNoticeMode, SerializedFormData } from '../types';

export interface VerificationError {
    secretVerificationError: boolean;
    slotVerificationError: boolean;
    contentVerificationError: boolean;
}

export interface InternalBookingPage {
    id: string;
    bookingUID: string;
    calendarID: string;
    summary: string;
    description?: string;
    location?: string;
    withProtonMeetLink: boolean;
    link: string;
    verificationErrors: VerificationError;
    minimumNoticeMode: MinimumNoticeMode;
    conflictCalendarIDs: string[];
}

export interface InternalBookingPageSliceInterface {
    bookingPages: InternalBookingPage[];
    bookingPageEditData?: BookingPageEditData;
}

export interface BookingPageCreationReturn {
    bookingLink: string;
    bookingPage: APIBooking;
    initialBookingPage: SerializedFormData;
}

export interface BookingPageEditionReturn {
    bookingPage: APIBooking;
    initialBookingPage: SerializedFormData;
}

export interface InternalBookingState extends CalendarsState, CalendarsBootstrapState, AddressKeysState, KtState {
    internalBookings: ModelState<InternalBookingPageSliceInterface>;
}

/**
 * Thunk context for the bookings store. Deliberately typed against the shared
 * ProtonThunkArguments rather than any single app's thunk arguments, so both Calendar and Mail
 * can dispatch these thunks. Only `api`, `unleashClient` and `authentication` are used.
 */
export type BookingsThunkExtra = {
    state: InternalBookingState;
    dispatch: ThunkDispatch<InternalBookingState, ProtonThunkArguments, Action>;
    extra: ProtonThunkArguments;
};
