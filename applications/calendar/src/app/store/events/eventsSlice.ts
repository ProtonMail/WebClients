import { type PayloadAction, createSlice } from '@reduxjs/toolkit';
import cloneDeep from 'lodash/cloneDeep';

import { ICAL_ATTENDEE_STATUS, RECURRING_TYPES, TMP_UID, TMP_UNIQUE_ID } from '@proton/shared/lib/calendar/constants';
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
    isTmpEventSaving: boolean;
}

const initialState: EventsState = {
    events: [],
    isTmpEventSaving: false,
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
                recurringType?: RECURRING_TYPES;
            }>
        ) {
            const { targetEvent, isDeleted, recurringType } = action.payload;
            const { uniqueId: targetUniqueId } = targetEvent;
            const targetUID = (targetEvent.data?.eventData as CalendarEvent)?.UID;

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
                    const UID = (event.data?.eventData as CalendarEvent)?.UID;

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
                        const UID = (event.data?.eventData as CalendarEvent)?.UID;

                        if (UID && UID === targetUID) {
                            event.isDeleted = isDeleted;
                        }
                    }
                });
            }
        },
        markEventAsDeleting(
            state,
            action: PayloadAction<{
                isDeleting: boolean;
                targetEvent: CalendarViewEvent;
                recurringType?: RECURRING_TYPES;
            }>
        ) {
            const { isDeleting, targetEvent, recurringType } = action.payload;
            const { uniqueId: targetUniqueId } = targetEvent;
            const targetUID = (targetEvent.data?.eventData as CalendarEvent)?.UID;

            state.events.forEach((event) => {
                const UID = (event.data?.eventData as CalendarEvent)?.UID;

                if (UID === targetUID) {
                    /**
                     * Mark the events that actually needs to be deleted as deleting
                     */
                    if (recurringType === RECURRING_TYPES.SINGLE) {
                        if (event.uniqueId === targetUniqueId) {
                            event.isDeleting = isDeleting;
                        }
                    } else if (recurringType === RECURRING_TYPES.ALL) {
                        const eventReadResult = getEventReadResult(event.uniqueId);
                        const { isAttendee } = eventReadResult?.result?.[0]?.selfAddressData || {};
                        const isSingleEdit = getHasRecurrenceId(eventReadResult?.result?.[0]?.veventComponent);

                        // Single edits are not deleted, but we will reset their partstat
                        if (isAttendee && isSingleEdit) {
                            return;
                        }

                        event.isDeleting = isDeleting;
                    } else if (recurringType === RECURRING_TYPES.FUTURE) {
                        if (event.start >= targetEvent.start) {
                            const UID = (event.data?.eventData as CalendarEvent)?.UID;

                            if (UID && UID === targetUID) {
                                event.isDeleting = isDeleting;
                            }
                        }
                    }
                }
            });
        },
        markEventAsSaving(state, action: PayloadAction<{ uniqueId: string; isSaving: boolean }>) {
            // tmp event doesn't not exist in events, so we need to handle it separately
            if (action.payload.uniqueId === TMP_UNIQUE_ID) {
                state.isTmpEventSaving = action.payload.isSaving;
                return;
            }
            state.events.forEach((event) => {
                if (event.uniqueId === action.payload.uniqueId) {
                    event.isSaving = action.payload.isSaving;
                }
            });
        },
        markEventsAsSaving(state, action: PayloadAction<{ UID: string; isSaving: boolean }>) {
            // tmp event doesn't not exist in events, so we need to handle it separately
            if (action.payload.UID === TMP_UID) {
                state.isTmpEventSaving = action.payload.isSaving;
                return;
            }
            state.events.forEach((event) => {
                const UID = (event.data?.eventData as CalendarEvent)?.UID;
                if (UID === action.payload.UID) {
                    event.isSaving = action.payload.isSaving;
                }
            });
        },
        updateInvite(state, action: PayloadAction<{ ID: string; selfEmail: string; partstat: string }>) {
            let needRefresh = false;

            state.events.forEach((event) => {
                const ID = (event.data?.eventData as CalendarEvent)?.ID;
                // We use the event ID instead of the event UID since single edit must not change for invite.
                if (ID && ID === action.payload.ID) {
                    const result = setPartstat(event.uniqueId, action.payload.selfEmail, action.payload.partstat);

                    if (!needRefresh && result) {
                        needRefresh = true;
                    }
                }
            });

            if (needRefresh) {
                // Force refresh since changes are saved in a different cache than the Redux store
                // However, the interface calculates events to display from both caches
                state.events = [...state.events];
            }
        },
    },
});

export const eventsActions = slice.actions;
export const eventsReducer = { [eventsSliceName]: slice.reducer };
