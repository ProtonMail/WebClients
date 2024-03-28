import { selectUserSettings } from '@proton/account';
import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { getBusyTimeSlots } from '@proton/shared/lib/api/calendars';
import { BUSY_TIME_SLOT_TYPE, GetBusyTimeSlotsResponse } from '@proton/shared/lib/interfaces/calendar';
import { getWeekStartsOn } from '@proton/shared/lib/settings/helper';
import diff from '@proton/utils/diff';

import { CalendarState } from '../store';
import {
    assertBusyTimeSlotMetadata,
    busySlotsDateRangeChanged,
    getBusyAttendeesColor,
    getBusyAttendeesToFetch,
    getBusyDatesToFetch,
} from './busyTimeSlotsListener.helpers';
import { busyTimeSlotsActions, busyTimeSlotsSliceName } from './busyTimeSlotsSlice';

export const startListeningBusyTimeSlotsAttendees = (startListening: SharedStartListening<CalendarState>) => {
    startListening({
        predicate: (action, nextState, originalState) => {
            // Action is not related to busyTimeSlots
            // OR action is related to busyTimeSlots but not the one we're interested in
            // don't do anything
            if (
                !action.type.startsWith(busyTimeSlotsSliceName) ||
                [busyTimeSlotsActions.setMetadataViewStartDate.type, busyTimeSlotsActions.reset.type].some(
                    (type) => type === action.type
                )
            ) {
                return false;
            }

            const attendeesChanged =
                nextState.busyTimeSlots.attendees !== originalState.busyTimeSlots.attendees &&
                diff(nextState.busyTimeSlots.attendees, originalState.busyTimeSlots.attendees).length > 0;

            const eventDateChanged =
                nextState.busyTimeSlots.attendees.length > 0 &&
                nextState.busyTimeSlots.metadata?.startDate !== originalState.busyTimeSlots.metadata?.startDate;

            const viewChanged =
                nextState.busyTimeSlots.attendees.length > 0 &&
                nextState.busyTimeSlots.metadata?.view !== originalState.busyTimeSlots.metadata?.view;

            return attendeesChanged || eventDateChanged || viewChanged;
        },
        effect: async (_, listenerApi) => {
            const originalState = listenerApi.getOriginalState();

            // Wait for a potential metadata change
            // This case occurs when user changes start date of the event
            // Just wait for the metadata to be updated from InteractiveCalendarView
            await listenerApi.take(busyTimeSlotsActions.setMetadataViewStartDate.match, 150);

            let state = listenerApi.getState();
            const userSettings = selectUserSettings(state).value;
            if (!userSettings) {
                return;
            }

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

            const { startDate, tzid, view, viewStartDate, now } = assertBusyTimeSlotMetadata(
                state.busyTimeSlots.metadata
            );

            const attendeesToFetch = getBusyAttendeesToFetch(
                state.busyTimeSlots.attendees,
                state.busyTimeSlots.attendeeFetchStatus
            );

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
                    attendeesToFetch.map((email) => ({ email, color: nextAttendeesColor[email] }))
                )
            );

            // Set statuses to fetching
            const promises = attendeesToFetch.map(async (email) => {
                try {
                    const timezone = tzid;
                    const [startDateToFetch, endDateToFetch] = getBusyDatesToFetch({
                        startTimestamp: startDate,
                        currentViewStartTimestamp: viewStartDate,
                        nowTimestamp: now,
                        view,
                        weekStartsOn: getWeekStartsOn(userSettings),
                    });
                    const result = await listenerApi.extra.api<GetBusyTimeSlotsResponse>(
                        getBusyTimeSlots(email, {
                            Start: startDateToFetch,
                            End: endDateToFetch,
                            Type: BUSY_TIME_SLOT_TYPE.PARTIAL_DAY_IN,
                            Timezone: timezone,
                        })
                    );

                    let busyTimeSlots: Exclude<GetBusyTimeSlotsResponse['BusySchedule']['BusyTimeSlots'], null> = [];
                    let isDataAccessible = false;

                    if (Array.isArray(result?.BusySchedule?.BusyTimeSlots)) {
                        busyTimeSlots = result.BusySchedule.BusyTimeSlots?.filter(
                            (timeSlot): timeSlot is (typeof busyTimeSlots)[number] => !!timeSlot
                        );
                    }
                    if (result?.BusySchedule?.IsDataAccessible) {
                        isDataAccessible = !!result.BusySchedule.IsDataAccessible;
                    }

                    listenerApi.dispatch(
                        busyTimeSlotsActions.setFetchStatusSuccess({
                            busyTimeSlots,
                            email,
                            isDataAccessible,
                        })
                    );
                } catch (error) {
                    listenerApi.dispatch(
                        busyTimeSlotsActions.setFetchStatusFail({
                            email,
                        })
                    );
                }
            });

            await Promise.all(promises);
        },
    });
};
