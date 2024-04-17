import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

import { CalendarState } from '../store';
import {
    fetchAttendeesBusyTimeSlots,
    getBusyAttendeesToFetch,
    getBusySlotStateChangeReason,
} from './busyTimeSlotsListener.helpers';
import { busyTimeSlotsActions } from './busyTimeSlotsSlice';

const WHITELISTED_ACTIONS = [
    busyTimeSlotsActions.setAttendees.type,
    busyTimeSlotsActions.setMetadata.type,
    busyTimeSlotsActions.setDisplay.type,
];

export const startListeningBusyTimeSlotsAttendees = (startListening: SharedStartListening<CalendarState>) => {
    // Listener related to the attendees list
    // Fetch busy slots for attendees when the attendees list changes
    startListening({
        predicate: (action, nextState, prevState) => {
            const nextCalendarView = nextState.busyTimeSlots?.metadata?.view;
            const nextDisplayBusySlots = nextState.busyTimeSlots?.displayOnGrid;

            if (
                WHITELISTED_ACTIONS.some((type) => type === action.type) &&
                nextCalendarView !== VIEWS.MONTH &&
                nextDisplayBusySlots === true
            ) {
                return getBusySlotStateChangeReason(prevState, nextState) !== null;
            }
            return false;
        },
        effect: async (_, listenerApi) => {
            let state = listenerApi.getState();
            let prevState = listenerApi.getOriginalState();

            const updateReason = getBusySlotStateChangeReason(prevState, state);

            let attendeesToFetch: string[] = [];

            if (['calendar-view-changed', 'calendar-view-date-changed'].some((reason) => reason === updateReason)) {
                attendeesToFetch = state.busyTimeSlots.attendees.filter((attendee) => {
                    if (state.busyTimeSlots.attendeeDataAccessible[attendee] === false) {
                        return false;
                    }
                    return true;
                });
            } else {
                attendeesToFetch = getBusyAttendeesToFetch(state);
            }

            // If nothing new to fetch stop here
            if (attendeesToFetch.length === 0) {
                return;
            }

            await fetchAttendeesBusyTimeSlots({
                api: listenerApi.extra.api,
                attendeesToFetch,
                state,
                onColorChange: (attendees) => {
                    // Set fetch statuses to loading
                    listenerApi.dispatch(busyTimeSlotsActions.setAttendeeFetchStatusLoadingAndColor(attendees));
                },
                onFetchFailed: (attendees) => {
                    listenerApi.dispatch(busyTimeSlotsActions.setFetchStatusesFail(attendees));
                },
                onFetchSuccess: (attendees) => {
                    listenerApi.dispatch(busyTimeSlotsActions.setFetchStatusesSuccess(attendees));
                },
            });
        },
    });
};
