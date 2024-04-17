import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { GetBusyTimeSlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import diff from '@proton/utils/diff';

import { CalendarViewBusyEvent } from '../../containers/calendar/interface';

export interface AttendeeBusyTimeSlot extends CalendarViewBusyEvent {}

/** Attendee email */
export type BusyTimeSlotEmail = string;
/** Attendee visibility */
export type BusyTimeSlotVisibility = 'visible' | 'hidden';
/**
 * Attendee fetchStatus
 * - loading: request is in progress
 * - success: request has been successful
 * - error: request failed.
 */
export type BusyTimeSlotFetchStatus = 'loading' | 'success' | 'error';

export type BusyTimeSlot = Exclude<GetBusyTimeSlotsResponse['BusySchedule']['BusyTimeSlots'], null>[number] & {
    isAllDay: boolean;
};

export interface BusyAttendeeFetchStatusSuccessActionPayload {
    email: BusyTimeSlotEmail;
    busyTimeSlots: BusyTimeSlot[];
    isDataAccessible: boolean;
    visibility: BusyTimeSlotVisibility;
}

/**
 * When a create or edit event modal is opened:
 * 1. We first store Metadata + initial list of attendees email
 * 2. `busyTimeSlotsListeners` listen to attendee lists changes and will do the following:
 *  - Fetch and format busy time slots for each attendee
 *  - Guess the color of the attendee
 * 3. Then user has the possibility to add or remove attendees (point 2 will be repeated)
 * 4. User can change visibility of each attendee busy slots
 * 5. When the user submit or close the form, reset action is called
 */
export interface BusyTimeSlotsState {
    /** Display or not on calendar grid */
    displayOnGrid: boolean;
    /** Metadata of the event */
    metadata?: {
        /** The currently selected TZ in the interface */
        tzid: string;
        /** The current view when opening event form */
        view: VIEWS;
        /**
         * UTC unix timestamp: Start date of the calendar view
         * If we're on current week view, it will be the start of the current week
         * If we're on week X view, it will be the start of the this week X
         * If we're on day X view, it will be the start of the day X
         */
        viewStartDate: number;
        viewEndDate: number;
        /** UTC unix timestamp: now date used across calendar components */
        now: number;
    };
    /** List of event attendees */
    attendees: BusyTimeSlotEmail[];
    /**
     * Selected color for the attendee.
     * Each attendee will be assigned a different color from the actual
     * calendar colors the user has and the actual attendees colors assigned
     */
    attendeeColor: Record<BusyTimeSlotEmail, string>;
    /** Is attendee email hidden  */
    attendeeVisibility: Record<BusyTimeSlotEmail, BusyTimeSlotVisibility>;
    /** Are attendee busy slots accessible ?  */
    attendeeDataAccessible: Record<BusyTimeSlotEmail, boolean>;
    /**
     * Allows to know status of getBusyTimeSlots request for each user
     * - loading: request is in progress
     * - success: request has been successful
     * - error: request failed.
     */
    attendeeFetchStatus: Record<BusyTimeSlotEmail, BusyTimeSlotFetchStatus>;
    /** Busy time slots for each attendees */
    attendeeBusySlots: Record<BusyTimeSlotEmail, BusyTimeSlot[]>;
    /** Highlighted attendee in the ui */
    attendeeHighlight: BusyTimeSlotEmail | undefined;
}

export const busyTimeSlotsSliceName = 'busyTimeSlots';

const initialState: BusyTimeSlotsState = {
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

const busyTimeSlotSlice = createSlice({
    name: busyTimeSlotsSliceName,
    initialState,
    reducers: {
        reset: (state) => {
            return { ...initialState, metadata: state.metadata };
        },
        /**
         * When temporary event is set or updated, we store the metadata and the attendees email list.
         * Every email is canonicalized
         */
        init: (state, { payload: { attendeeEmails } }: PayloadAction<{ attendeeEmails: BusyTimeSlotEmail[] }>) => {
            if (diff(attendeeEmails, state.attendees).length > 0) {
                state.attendees = attendeeEmails.map((email) => canonicalizeEmailByGuess(email));
            }
        },
        setMetadata: (state, { payload }: PayloadAction<Required<BusyTimeSlotsState>['metadata']>) => {
            state.metadata = payload;
        },
        removeAttendee: (state, action: PayloadAction<BusyTimeSlotEmail>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload);
            state.attendees = state.attendees.filter((email) => email !== emailCanonicalized);
            state.attendeeVisibility[emailCanonicalized] = 'hidden';
        },
        setAttendeeVisibility: (state, action: PayloadAction<{ email: BusyTimeSlotEmail; visible: boolean }>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload.email);

            if (state.attendeeDataAccessible[emailCanonicalized] === false) {
                state.attendeeVisibility[emailCanonicalized] = 'hidden';
            }

            state.attendeeVisibility[emailCanonicalized] = action.payload.visible ? 'visible' : 'hidden';
        },
        setAttendeeFetchStatusLoadingAndColor: (
            state,
            action: PayloadAction<{ email: BusyTimeSlotEmail; color: string }[]>
        ) => {
            for (const { email, color } of action.payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeFetchStatus[emailCanonicalized] = 'loading';
                state.attendeeVisibility[email] = 'hidden';
                state.attendeeColor[emailCanonicalized] = color;
            }
        },
        setFetchStatusesSuccess: (state, { payload }: PayloadAction<BusyAttendeeFetchStatusSuccessActionPayload[]>) => {
            for (const { email, busyTimeSlots, isDataAccessible, visibility } of payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeBusySlots[emailCanonicalized] = busyTimeSlots;
                state.attendeeDataAccessible[emailCanonicalized] = isDataAccessible;
                state.attendeeFetchStatus[emailCanonicalized] = 'success';
                state.attendeeVisibility[emailCanonicalized] = visibility;
            }
        },
        setFetchStatusesFail: (state, action: PayloadAction<BusyTimeSlotEmail[]>) => {
            for (const email of action.payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeFetchStatus[emailCanonicalized] = 'error';
                state.attendeeVisibility[emailCanonicalized] = 'hidden';
            }
        },
        setHighlightedAttendee: (state, action: PayloadAction<BusyTimeSlotEmail | undefined>) => {
            state.attendeeHighlight = action.payload ? canonicalizeEmailByGuess(action.payload) : undefined;
        },
        setDisplay: (state, action: PayloadAction<boolean>) => {
            state.displayOnGrid = action.payload;
        },
    },
});

export const busyTimeSlotsActions = busyTimeSlotSlice.actions;
export const busyTimeSlotsReducer = { [busyTimeSlotsSliceName]: busyTimeSlotSlice.reducer };
