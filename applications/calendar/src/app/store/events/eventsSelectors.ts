import { createSelector } from '@reduxjs/toolkit';

import { selectCalendarsWithMembers } from '@proton/calendar';
import { getVisualCalendars } from '@proton/shared/lib/calendar/calendar';
import { TMP_UNIQUE_ID } from '@proton/shared/lib/calendar/constants';
import type { CalendarWithOwnMembers, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';

import type { CalendarState } from '../store';
import { getEventReadResult } from './eventsCache';
import { type CalendarViewEventStore, eventsSliceName } from './eventsSlice';

const selectEvents = (state: CalendarState) => state[eventsSliceName].events;
export const selectIsTmpEventSaving = (state: CalendarState) => state[eventsSliceName].isTmpEventSaving;

const mapEventsWithCalendars = (events: CalendarViewEventStore[], calendars?: CalendarWithOwnMembers[]) => {
    const visualCalendarsMap = new Map(getVisualCalendars(calendars || []).map((calendar) => [calendar.ID, calendar]));
    return events.map((event) => ({
        ...event,
        data: {
            ...event.data,
            eventReadResult: getEventReadResult(event.uniqueId),
            calendarData: visualCalendarsMap.get(event.data.eventData!.CalendarID) || ({} as VisualCalendar),
        },
    }));
};

export const visualEventsSelector = createSelector([selectEvents, selectCalendarsWithMembers], (events, calendars) => {
    return mapEventsWithCalendars(
        events.filter((event) => !event.isDeleted),
        calendars
    );
});

export const eventsSelector = createSelector([selectEvents, selectCalendarsWithMembers], (events, calendars) => {
    return mapEventsWithCalendars(events, calendars);
});

export const isTmpEventSavingSelector = createSelector([selectIsTmpEventSaving], (tmpEventSaving) => tmpEventSaving);

export const pendingUniqueIdsSelector = createSelector(
    [selectIsTmpEventSaving, selectEvents],
    (tmpEventSaving, events) => {
        const uniqueIds = events.reduce<string[]>((acc, event) => {
            if (event.isDeleting || event.isSaving) {
                acc.push(event.uniqueId);
            }
            return acc;
        }, []);

        if (tmpEventSaving) {
            uniqueIds.push(TMP_UNIQUE_ID);
        }

        return uniqueIds;
    }
);
