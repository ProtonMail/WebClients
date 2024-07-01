import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { VIEWS } from '@proton/shared/lib/calendar/constants';

import { CalendarState } from '../store';
import {
    fetchAttendeesBusySlots,
    getBusyAttendeesToFetch,
    getBusySlotStateChangeReason,
} from './busySlotsListener.helpers';
import { busySlotsActions, busySlotsSliceName } from './busySlotsSlice';

const WHITELISTED_ACTIONS = [
    busySlotsActions.setAttendees.type,
    busySlotsActions.setMetadata.type,
    busySlotsActions.setDisplay.type,
];

export const startListeningBusySlots = (startListening: SharedStartListening<CalendarState>) => {
    // Listener related to the attendees list
    // Fetch busy slots for attendees when the attendees list changes
    startListening({
        predicate: (action, nextState, prevState) => {
            const nextCalendarView = nextState[busySlotsSliceName]?.metadata?.view;
            const nextDisplayBusySlots = nextState[busySlotsSliceName]?.displayOnGrid;
            const nextMetadata = nextState[busySlotsSliceName]?.metadata;

            if (
                WHITELISTED_ACTIONS.some((type) => type === action.type) &&
                nextMetadata !== undefined &&
                nextCalendarView !== VIEWS.MONTH &&
                nextDisplayBusySlots === true
            ) {
                return getBusySlotStateChangeReason(prevState, nextState) !== null;
            }
            return false;
        },
        effect: async (_, listenerApi) => {
            let attendeesToFetch: string[] = [];
            const state = listenerApi.getState();
            const prevState = listenerApi.getOriginalState();
            const stateChangeReason = getBusySlotStateChangeReason(prevState, state);

            const refetchAttendeesReasons: ReturnType<typeof getBusySlotStateChangeReason>[] = [
                'calendar-view-changed',
                'calendar-view-date-changed',
                'timezone-changed',
            ];
            if (refetchAttendeesReasons.includes(stateChangeReason)) {
                attendeesToFetch = state[busySlotsSliceName].attendees.filter((attendee) => {
                    if (state[busySlotsSliceName].attendeeDataAccessible[attendee] === false) {
                        return false;
                    }
                    return true;
                });
            } else {
                // Fetch only attendees that are not already fetched
                attendeesToFetch = getBusyAttendeesToFetch(state);
            }

            // If nothing new to fetch stop here
            if (attendeesToFetch.length === 0) {
                return;
            }

            await fetchAttendeesBusySlots({
                api: listenerApi.extra.api,
                attendeesToFetch,
                state,
                onColorChange: (attendees) => {
                    // Set fetch statuses to loading
                    listenerApi.dispatch(busySlotsActions.setAttendeeFetchStatusLoadingAndColor(attendees));
                },
                onFetchFailed: (attendees) => {
                    listenerApi.dispatch(busySlotsActions.setFetchStatusesFail(attendees));
                },
                onFetchSuccess: (attendees) => {
                    listenerApi.dispatch(busySlotsActions.setFetchStatusesSuccess(attendees));
                },
            });
        },
    });
};
