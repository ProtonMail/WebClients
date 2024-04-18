import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { GetBusySlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import diff from '@proton/utils/diff';

import { CalendarViewBusyEvent } from '../../containers/calendar/interface';

export interface AttendeeBusySlot extends CalendarViewBusyEvent {}

/** Attendee email */
export type BusySlotsEmail = string;
/** Attendee visibility */
export type BusySlotsVisibility = 'visible' | 'hidden';
/**
 * Attendee fetchStatus
 * - loading: request is in progress
 * - success: request has been successful
 * - error: request failed.
 */
export type BusySlotFetchStatus = 'loading' | 'success' | 'error';

export type BusySlot = Exclude<GetBusySlotsResponse['BusySchedule']['BusyTimeSlots'], null>[number] & {
    isAllDay: boolean;
};

export interface BusySlotsAttendeeFetchStatusSuccessActionPayload {
    email: BusySlotsEmail;
    busySlots: BusySlot[];
    isDataAccessible: boolean;
    visibility: BusySlotsVisibility;
}

export interface BusySlotsState {
    /** Display or not on calendar grid */
    displayOnGrid: boolean;
    /** Metadata of the event */
    metadata?: {
        /** The currently selected TZ in the interface */
        tzid: string;
        /** The current view when opening event form */
        view: VIEWS;
        /** Start date of the calendar view in UTC unix timestamp */
        viewStartDate: number;
        /** End date of the calendar view in UTC unix timestamp */
        viewEndDate: number;
    };
    /** List of event attendees */
    attendees: BusySlotsEmail[];
    /**
     * Selected color for the attendee.
     * Each attendee will be assigned a different color from the actual
     * calendar colors the user has and the actual attendees colors assigned
     */
    attendeeColor: Record<BusySlotsEmail, string>;
    /** Is attendee email hidden  */
    attendeeVisibility: Record<BusySlotsEmail, BusySlotsVisibility>;
    /** Are attendee busy slots accessible ?  */
    attendeeDataAccessible: Record<BusySlotsEmail, boolean>;
    /**
     * Allows to know status of getBusySlots request for each user
     * - loading: request is in progress
     * - success: request has been successful
     * - error: request failed.
     */
    attendeeFetchStatus: Record<BusySlotsEmail, BusySlotFetchStatus>;
    /** Busy time slots for each attendees */
    attendeeBusySlots: Record<BusySlotsEmail, BusySlot[]>;
    /** Highlighted attendee in the ui */
    attendeeHighlight: BusySlotsEmail | undefined;
}

export const busySlotsSliceName = 'calendarBusySlots';

const initialState: BusySlotsState = {
    metadata: undefined,
    displayOnGrid: true,
    attendees: [],
    attendeeColor: {},
    attendeeVisibility: {},
    attendeeDataAccessible: {},
    attendeeBusySlots: {},
    attendeeFetchStatus: {},
    attendeeHighlight: undefined,
};

const busySlotsSlice = createSlice({
    name: busySlotsSliceName,
    initialState,
    reducers: {
        reset: (state) => {
            return { ...initialState, metadata: state.metadata };
        },
        setAttendees: (state, { payload }: PayloadAction<BusySlotsEmail[]>) => {
            if (diff(payload, state.attendees).length > 0) {
                state.attendees = payload.map((email) => canonicalizeEmailByGuess(email));
            }
        },
        setMetadata: (state, { payload }: PayloadAction<Required<BusySlotsState>['metadata']>) => {
            state.metadata = payload;
        },
        removeAttendee: (state, action: PayloadAction<BusySlotsEmail>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload);
            state.attendees = state.attendees.filter((email) => email !== emailCanonicalized);
        },
        setAttendeeVisibility: (state, action: PayloadAction<{ email: BusySlotsEmail; visible: boolean }>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload.email);

            if (state.attendeeDataAccessible[emailCanonicalized] === false) {
                state.attendeeVisibility[emailCanonicalized] = 'hidden';
            }

            state.attendeeVisibility[emailCanonicalized] = action.payload.visible ? 'visible' : 'hidden';
        },
        setAttendeeFetchStatusLoadingAndColor: (
            state,
            action: PayloadAction<{ email: BusySlotsEmail; color: string }[]>
        ) => {
            for (const { email, color } of action.payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeFetchStatus[emailCanonicalized] = 'loading';
                state.attendeeVisibility[email] = 'hidden';
                state.attendeeColor[emailCanonicalized] = color;
            }
        },
        setFetchStatusesSuccess: (
            state,
            { payload }: PayloadAction<BusySlotsAttendeeFetchStatusSuccessActionPayload[]>
        ) => {
            for (const { email, busySlots, isDataAccessible, visibility } of payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeBusySlots[emailCanonicalized] = busySlots;
                state.attendeeDataAccessible[emailCanonicalized] = isDataAccessible;
                state.attendeeFetchStatus[emailCanonicalized] = 'success';
                state.attendeeVisibility[emailCanonicalized] = visibility;
            }
        },
        setFetchStatusesFail: (state, action: PayloadAction<BusySlotsEmail[]>) => {
            for (const email of action.payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeFetchStatus[emailCanonicalized] = 'error';
                state.attendeeVisibility[emailCanonicalized] = 'hidden';
            }
        },
        setHighlightedAttendee: (state, action: PayloadAction<BusySlotsEmail | undefined>) => {
            state.attendeeHighlight = action.payload ? canonicalizeEmailByGuess(action.payload) : undefined;
        },
        setDisplay: (state, action: PayloadAction<boolean>) => {
            state.displayOnGrid = action.payload;
        },
    },
});

export const busySlotsActions = busySlotsSlice.actions;
export const busySlotsReducer = { [busySlotsSliceName]: busySlotsSlice.reducer };
