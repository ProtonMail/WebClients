import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';

import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES } from '@proton/shared/lib/calendar/constants';
import { getHasRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import type { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarViewEvent } from '../../containers/calendar/interface';
import { getEventReadResult, setEventReadResult, setPartstat } from './eventsCache';

export interface CalendarViewEventStore extends CalendarViewEvent {
    isDeleted?: boolean;
    isSaved?: boolean;
    isSaving?: boolean;
    isDeleting?: boolean;
}

interface EventsState {
    events: CalendarViewEventStore[];
}

const initialState: EventsState = {
    events: [],
};

export const eventsSliceName = 'events';

const slice = createSlice({
    name: eventsSliceName,
    initialState,
    reducers: {
        synchronizeEvents(state, action: PayloadAction<CalendarViewEvent[]>) {
            const oldEventsMap = new Map<string, CalendarViewEventStore>(
                state.events.map((event) => [event.uniqueId, event])
            );

            state.events = action.payload.map((event) => {
                const oldEvent = oldEventsMap.get(event.uniqueId);
                const { eventReadResult, calendarData, ...restData } = event.data;

                // Store eventReadResult in cache if it exists
                if (eventReadResult) {
                    setEventReadResult(event.uniqueId, eventReadResult);
                }

                // State is immutable but if we add the event as is in Redux, the payload content will also become
                // immutable. This is causing issues in other places in the app where we are using the same object
                // to do some computations.
                // To avoid this, we need to deep copy the object so that we don't mess up the references
                const tmpEvent = {
                    ...event,
                    data: restData, // Omit eventReadResult && calendarData
                };

                const eventCopy = cloneDeep(tmpEvent);

                // Return the updated event, preserving some old event properties
                return {
                    ...eventCopy,
                    isDeleted: oldEvent?.isDeleted,
                    isSaved: oldEvent?.isSaved,
                    isSaving: oldEvent?.isSaving,
                    isDeleting: oldEvent?.isDeleting,
                } as CalendarViewEventStore;
            });
        },
        markAsDeleted(
            state,
            action: PayloadAction<{
                targetEvent: CalendarViewEvent;
                isDeleted: boolean;
                isRecurring: boolean;
                recurringType?: RECURRING_TYPES;
            }>
        ) {
            const { targetEvent, isDeleted, recurringType } = action.payload;
            const { uniqueId: targetUniqueId } = targetEvent;
            const { UID: targetUID } = targetEvent.data?.eventData as CalendarEvent;

            if (recurringType === RECURRING_TYPES.SINGLE) {
                // Find and update only the target event (single edit case included)
                const event = state.events.find((event) => {
                    return event.uniqueId === targetUniqueId;
                });

                if (event) {
                    event.isDeleted = isDeleted;
                }
            } else if (recurringType === RECURRING_TYPES.ALL) {
                let needRefresh = true;
                // Update all instances of the recurring event
                state.events.forEach((event) => {
                    const { UID } = event.data?.eventData as CalendarEvent;

                    if (UID && UID === targetUID) {
                        const eventReadResult = getEventReadResult(event.uniqueId);
                        const { isAttendee, selfAttendee } = eventReadResult?.result?.[0]?.selfAddressData || {};
                        const isSingleEdit = getHasRecurrenceId(eventReadResult?.result?.[0]?.veventComponent);

                        // When deleting a recurring series as an attendee, single are not deleted.
                        if (isAttendee && isSingleEdit) {
                            // If the user responded to the single edit invite with YES or MAYBE (ACCEPTED OR TENTATIVE),
                            // the user participation status is being reset
                            if (
                                selfAttendee?.parameters?.partstat === ICAL_ATTENDEE_STATUS.ACCEPTED ||
                                selfAttendee?.parameters?.partstat === ICAL_ATTENDEE_STATUS.TENTATIVE
                            ) {
                                eventReadResult?.result?.[0]?.veventComponent.attendee?.forEach((attendee) => {
                                    if (attendee.value === selfAttendee?.value) {
                                        if (attendee.parameters) {
                                            attendee.parameters.partstat = ICAL_ATTENDEE_STATUS.NEEDS_ACTION;
                                        }
                                    }
                                });
                            }
                            // Do not mark event as deleted
                            setEventReadResult(event.uniqueId, eventReadResult);
                            return;
                        }

                        event.isDeleted = isDeleted;
                        needRefresh = false;
                    }
                });

                if (needRefresh) {
                    state.events = [...state.events];
                }
            } else if (recurringType === RECURRING_TYPES.FUTURE) {
                // Update all future instances of the recurring event
                state.events.forEach((event) => {
                    if (event.start >= targetEvent.start) {
                        const { UID } = event.data?.eventData as CalendarEvent;

                        if (UID && UID === targetUID) {
                            event.isDeleted = isDeleted;
                        }
                    }
                });
            }
        },
        markEventAsDeleting(state, action: PayloadAction<{ UID: string; isDeleting: boolean }>) {
            state.events.forEach((event) => {
                const { UID } = event.data?.eventData as CalendarEvent;

                if (UID === action.payload.UID) {
                    event.isDeleting = action.payload.isDeleting;
                }
            });
        },
        markEventAsSaving(state, action: PayloadAction<{ UID: string; isSaving: boolean }>) {
            state.events.forEach((event) => {
                const { UID } = event.data?.eventData as CalendarEvent;

                if (UID === action.payload.UID) {
                    event.isSaving = action.payload.isSaving;
                }
            });
        },
        updateInvite(state, action: PayloadAction<{ ID: string; selfEmail: string; partstat: string }>) {
            state.events.forEach((event) => {
                const { ID } = event.data?.eventData as CalendarEvent;
                // We use the event ID instead of the event UID since single edit must not change for invite.
                if (ID && ID === action.payload.ID) {
                    const needRefresh = setPartstat(event.uniqueId, action.payload.selfEmail, action.payload.partstat);

                    if (needRefresh) {
                        // Force refresh since changes are saved in a different cache than the Redux store
                        // However, the interface calculates events to display from both caches
                        state.events = [...state.events];
                    }
                }
            });
        },
    },
});

export const eventsActions = slice.actions;
export const eventsReducer = { [eventsSliceName]: slice.reducer };
