import { selectUserSettings } from '@proton/account';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED, VIEWS } from '@proton/shared/lib/calendar/constants';
import diff from '@proton/utils/diff';

import { CalendarState } from '../store';
import {
    assertBusyTimeSlotMetadata,
    busySlotsDateRangeChanged,
    fetchAttendeeBusyTimeSlots,
    getBusyAttendeesColor,
    getBusyAttendeesToFetch,
    getBusyDatesToFetch,
} from './busyTimeSlotsListener.helpers';
import { busyTimeSlotsActions, busyTimeSlotsSliceName } from './busyTimeSlotsSlice';

export const startListeningBusyTimeSlotsAttendees = (startListening: SharedStartListening<CalendarState>) => {
    // Listener related to the attendees list
    // Fetch busy slots for attendees when the attendees list changes
    startListening({
        predicate: (action, nextState, originalState) => {
            // Action is not related to busyTimeSlots
            // OR action is related to busyTimeSlots but not the one we're interested in
            // don't do anything
            if (
                !action.type.startsWith(busyTimeSlotsSliceName) ||
                [
                    // Ignore `setMetadataViewStartDate` because this one is awaited in the effect
                    busyTimeSlotsActions.setMetadataViewStartDate.type,
                    busyTimeSlotsActions.reset.type,
                    busyTimeSlotsActions.setHighlightedAttendee.type,
                ].some((type) => type === action.type)
            ) {
                return false;
            }

            const attendeesChanged =
                nextState.busyTimeSlots.attendees !== originalState.busyTimeSlots.attendees &&
                diff(nextState.busyTimeSlots.attendees, originalState.busyTimeSlots.attendees).length > 0;

            const eventDateChanged =
                nextState.busyTimeSlots.attendees.length > 0 &&
                nextState.busyTimeSlots.metadata?.startDate !== originalState.busyTimeSlots.metadata?.startDate;

            const calendarViewChanged =
                nextState.busyTimeSlots.attendees.length > 0 &&
                nextState.busyTimeSlots.metadata?.view !== originalState.busyTimeSlots.metadata?.view;

            return attendeesChanged || eventDateChanged || calendarViewChanged;
        },
        effect: async (_, listenerApi) => {
            let state = listenerApi.getState();
            const originalState = listenerApi.getOriginalState();

            const userSettings = selectUserSettings(state).value;
            if (!userSettings) {
                return;
            }

            // No busy slots in month view
            if (state.busyTimeSlots.metadata?.view === VIEWS.MONTH) {
                listenerApi.dispatch(busyTimeSlotsActions.reset());
                return;
            }

            // Wait for a potential metadata change
            // This case occurs when user changes start date of the event
            // Just wait for the metadata to be updated from InteractiveCalendarView
            await listenerApi.take(busyTimeSlotsActions.setMetadataViewStartDate.match, 150);

            // If the date range changed, we reset the attendee list in order to refetch the busy slots
            const dateRangeChanged = busySlotsDateRangeChanged(originalState, state);
            const viewChanged = originalState.busyTimeSlots.metadata?.view !== state.busyTimeSlots.metadata?.view;

            if (dateRangeChanged || viewChanged) {
                listenerApi.dispatch(
                    busyTimeSlotsActions.initAfterDateRangeChange({
                        ...state.busyTimeSlots.metadata!,
                        attendeeEmails: state.busyTimeSlots.attendees,
                    })
                );
            }

            state = listenerApi.getState();

            const { tzid } = assertBusyTimeSlotMetadata(state.busyTimeSlots.metadata);

            const attendeesToFetch = getBusyAttendeesToFetch(state);

            // If nothing new to fetch stop here
            if (attendeesToFetch.length === 0) {
                return;
            }

            // Define attendees color
            const nextAttendeesColor = getBusyAttendeesColor(
                attendeesToFetch,
                state.busyTimeSlots.attendeeColor,
                state.calendars.value || []
            );

            // Set fetch statuses to loading
            listenerApi.dispatch(
                busyTimeSlotsActions.setAttendeeFetchStatusLoadingAndColor(
                    attendeesToFetch.map((email) => ({
                        email,
                        color: nextAttendeesColor[email],
                    }))
                )
            );

            const [startDateToFetch, endDateToFetch] = getBusyDatesToFetch(state);

            // Set statuses to fetching
            const promises = attendeesToFetch.map((email) =>
                fetchAttendeeBusyTimeSlots({
                    api: listenerApi.extra.api,
                    email,
                    startDate: startDateToFetch,
                    endDate: endDateToFetch,
                    tzid,
                })
            );

            const results = await Promise.allSettled(promises);
            const fulfilledAttendees: Record<string, Awaited<ReturnType<typeof fetchAttendeeBusyTimeSlots>>> = {};
            const rejectedAttendeesEmails: string[] = [];

            results.forEach((result, index) => {
                const attendeeEmail = attendeesToFetch[index];
                if ('fulfilled' === result.status) {
                    fulfilledAttendees[attendeeEmail] = result.value;
                }
                if ('rejected' === result.status) {
                    rejectedAttendeesEmails.push(attendeeEmail);
                }
            });

            const currentVisibleAttendeesCount = state.busyTimeSlots.attendees.filter(
                (email) =>
                    state.busyTimeSlots.attendeeVisibility[email] === 'visible' &&
                    state.busyTimeSlots.attendeeDataAccessible[email]
            ).length;

            if (Object.keys(fulfilledAttendees).length > 0) {
                listenerApi.dispatch(
                    busyTimeSlotsActions.setFetchStatusesSuccess(
                        (() => {
                            let nonAccessibleCounter = 0;
                            return Object.entries(fulfilledAttendees).map(
                                ([email, { isDataAccessible, busyTimeSlots }], index) => {
                                    if (!isDataAccessible) {
                                        nonAccessibleCounter++;
                                    }
                                    const visibleAttendeesCount =
                                        currentVisibleAttendeesCount + index - nonAccessibleCounter;

                                    const visibility =
                                        visibleAttendeesCount >= BUSY_TIME_SLOTS_MAX_ATTENDEES_DISPLAYED
                                            ? 'hidden'
                                            : 'visible';

                                    return {
                                        busyTimeSlots,
                                        email,
                                        isDataAccessible,
                                        visibility,
                                    };
                                }
                            );
                        })()
                    )
                );
            }

            if (rejectedAttendeesEmails.length > 0) {
                listenerApi.dispatch(busyTimeSlotsActions.setFetchStatusesFail(rejectedAttendeesEmails));
            }
        },
    });
};
