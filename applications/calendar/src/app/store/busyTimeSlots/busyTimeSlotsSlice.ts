import { PayloadAction, createSlice } from '@reduxjs/toolkit';

import { VIEWS } from '@proton/shared/lib/calendar/constants';
import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';
import { GetBusyTimeSlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import diff from '@proton/utils/diff';

import { CalendarViewBusyEvent } from '../../containers/calendar/interface';

export interface AttendeeBusyTimeSlot extends CalendarViewBusyEvent {}

/** Attendee email */
type Email = string;
/** Attendee visibility */
type Visibility = 'visible' | 'hidden';
/** Attendee fetchStatus */
type FetchStatus = 'loading' | 'success' | 'error';

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
    /** Metadata of the event */
    metadata?: {
        /** Locale date in timestamp format: startDate of the event */
        startDate: number;
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
        /** UTC unix timestamp: now date used across calendar components */
        now: number;
    };
    /** List of event attendees */
    attendees: Email[];
    /**
     * Selected color for the attendee.
     * Each attendee will be assigned a different color from the actual
     * calendar colors the user has and the actual attendees colors assigned
     */
    attendeeColor: Record<Email, string>;
    /** Is attendee email hidden  */
    attendeeVisibility: Record<Email, Visibility>;
    /** Are attendee busy slots accessible ?  */
    attendeeDataAccessible: Record<Email, boolean>;
    /**
     * Allows to know status of getBusyTimeSlots request for each user
     * - loading: request is in progress
     * - success: request has been successful
     * - error: request failed.
     */
    attendeeFetchStatus: Record<Email, FetchStatus>;
    /** Busy time slots for each attendees */
    attendeeBusySlots: Record<Email, Exclude<GetBusyTimeSlotsResponse['BusySchedule']['BusyTimeSlots'], null>>;
    /** Highlighted attendee in the ui */
    attendeeHighlight: Email | undefined;
}

export const busyTimeSlotsSliceName = 'busyTimeSlots';

const initialState: BusyTimeSlotsState = {
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
        reset: () => {
            return initialState;
        },
        /**
         * When temporary event is set or updated, we store the metadata and the attendees email list.
         * Every email is canonicalized
         */
        init: (
            state,
            {
                payload: { attendeeEmails, startDate, tzid, view, now, viewStartDate },
            }: PayloadAction<{ attendeeEmails: Email[] } & Exclude<BusyTimeSlotsState['metadata'], undefined>>
        ) => {
            state.metadata = {
                now,
                startDate,
                tzid,
                view,
                viewStartDate,
            };
            if (diff(attendeeEmails, state.attendees).length > 0) {
                state.attendees = attendeeEmails.map((email) => canonicalizeEmailByGuess(email));
            }
        },
        initAfterDateRangeChange: (
            state,
            {
                payload: { attendeeEmails, startDate, tzid, view, now, viewStartDate },
            }: PayloadAction<{ attendeeEmails: Email[] } & Exclude<BusyTimeSlotsState['metadata'], undefined>>
        ) => {
            state.metadata = {
                now,
                startDate,
                tzid,
                view,
                viewStartDate,
            };
            state.attendees = attendeeEmails.map((email) => canonicalizeEmailByGuess(email));

            // Reset all the other states except color
            state.attendeeDataAccessible = initialState.attendeeDataAccessible;
            state.attendeeFetchStatus = initialState.attendeeFetchStatus;
            state.attendeeBusySlots = initialState.attendeeBusySlots;
        },
        setMetadataViewStartDate: (state, { payload }: PayloadAction<{ viewStartDate: number }>) => {
            if (!state.metadata) {
                return;
            }

            state.metadata!.viewStartDate = payload.viewStartDate;
        },
        setMetadataView: (state, { payload }: PayloadAction<{ view: VIEWS }>) => {
            if (!state.metadata) {
                return;
            }

            state.metadata!.view = payload.view;
        },
        removeAttendee: (state, action: PayloadAction<Email>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload);
            state.attendees = state.attendees.filter((email) => email !== emailCanonicalized);
        },
        setAttendeeVisibility: (state, action: PayloadAction<{ email: Email; visible: boolean }>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload.email);
            state.attendeeVisibility[emailCanonicalized] = action.payload.visible ? 'visible' : 'hidden';
        },
        setAttendeeFetchStatusLoadingAndColor: (state, action: PayloadAction<{ email: Email; color: string }[]>) => {
            for (const { email, color } of action.payload) {
                const emailCanonicalized = canonicalizeEmailByGuess(email);
                state.attendeeFetchStatus[emailCanonicalized] = 'loading';
                state.attendeeColor[emailCanonicalized] = color;
            }
        },
        setFetchStatusSuccess: (
            state,
            {
                payload: { email, busyTimeSlots, isDataAccessible },
            }: PayloadAction<{
                email: Email;
                busyTimeSlots: Exclude<GetBusyTimeSlotsResponse['BusySchedule']['BusyTimeSlots'], null>;
                isDataAccessible: boolean;
            }>
        ) => {
            state.attendeeBusySlots[email] = busyTimeSlots;
            state.attendeeDataAccessible[email] = isDataAccessible;
            state.attendeeFetchStatus[email] = 'success';
            state.attendeeVisibility[email] = 'visible';
        },
        setFetchStatusFail: (state, action: PayloadAction<{ email: Email }>) => {
            const emailCanonicalized = canonicalizeEmailByGuess(action.payload.email);
            state.attendeeFetchStatus[emailCanonicalized] = 'error';
        },
        setHighlightedAttendee: (state, action: PayloadAction<Email | undefined>) => {
            state.attendeeHighlight = action.payload ? canonicalizeEmailByGuess(action.payload) : undefined;
        },
    },
});

export const busyTimeSlotsActions = busyTimeSlotSlice.actions;
export const busyTimeSlotsReducer = { [busyTimeSlotsSliceName]: busyTimeSlotSlice.reducer };
