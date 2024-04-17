import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

import { CalendarState } from '../store';
import {
    fetchAttendeesBusyTimeSlots,
    getBusyAttendeesToFetch,
    getBusySlotStateChangeReason,
} from './busyTimeSlotsListener.helpers';
import { busyTimeSlotsActions, busyTimeSlotsSliceName } from './busyTimeSlotsSlice';

const IGNORED_ACTIONS = [busyTimeSlotsActions.reset.type, busyTimeSlotsActions.setHighlightedAttendee.type];

export const startListeningBusyTimeSlotsAttendees = (startListening: SharedStartListening<CalendarState>) => {
    // Listener related to the attendees list
    // Fetch busy slots for attendees when the attendees list changes
    startListening({
        predicate: (action, nextState, prevState) => {
            if (
                !action.type.startsWith(busyTimeSlotsSliceName) ||
                IGNORED_ACTIONS.some((type) => type === action.type) ||
                nextState.busyTimeSlots?.metadata?.view === VIEWS.MONTH
            ) {
                return false;
            }

            return getBusySlotStateChangeReason(prevState, nextState) !== null;
        },
        effect: async (_, listenerApi) => {
            let state = listenerApi.getState();
            let prevState = listenerApi.getOriginalState();

            const updateReason = getBusySlotStateChangeReason(prevState, state);

            let attendeesToFetch: string[] = [];

            if (updateReason === 'attendees-changed') {
                attendeesToFetch = getBusyAttendeesToFetch(state);
            }

            if (updateReason === 'calendar-view-changed' || updateReason === 'calendar-view-date-changed') {
                attendeesToFetch = state.busyTimeSlots.attendees.filter((attendee) => {
                    if (state.busyTimeSlots.attendeeDataAccessible[attendee] === false) {
                        return false;
                    }
                    return true;
                });
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
