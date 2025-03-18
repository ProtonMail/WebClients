import { getIsRecurring, getRecurrenceIdDate, getUidValue } from '@proton/shared/lib/calendar/veventHelper';
import type { RequireSome, SimpleMap } from '@proton/shared/lib/interfaces';
import type { Attendee, CalendarEvent, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar';

import { getViewEventDateProperties } from '../../eventHelper';
import type { CalendarEventStoreRecord, CalendarEventsCache, SharedVcalVeventComponent } from '../interface';
import { getIsCalendarEvent } from './helper';
import { setEventInRecurrenceInstances, setEventInRecurringCache } from './recurringCache';
import upsertCalendarEventInTree from './upsertCalendarEventInTree';

export const getHasUpdatedAttendees = (
    newEventData: CalendarEvent | CalendarEventSharedData,
    oldEventData?: CalendarEvent | CalendarEventSharedData
) => {
    if (!oldEventData || !getIsCalendarEvent(oldEventData)) {
        if (!getIsCalendarEvent(newEventData)) {
            return {
                hasUpdatedAttendees: false,
            };
        }
        return {
            attendees: newEventData?.AttendeesInfo?.Attendees || [],
            hasUpdatedAttendees: !!newEventData?.AttendeesInfo?.Attendees?.length,
        };
    }

    if (!getIsCalendarEvent(newEventData)) {
        return {
            hasUpdatedAttendees: false,
        };
    }

    let hasUpdatedAttendees =
        oldEventData?.AttendeesInfo?.Attendees?.length !== newEventData?.AttendeesInfo?.Attendees?.length;
    const attendeeMap = oldEventData?.AttendeesInfo?.Attendees?.reduce<SimpleMap<Attendee>>((acc, attendee) => {
        acc[attendee.Token] = attendee;
        return acc;
    }, {});

    const attendees = newEventData?.AttendeesInfo?.Attendees?.map((attendee) => {
        const oldAttendee = attendeeMap[attendee.Token];
        const oldUpdateTime = oldAttendee?.UpdateTime || 0;
        if (!oldUpdateTime) {
            hasUpdatedAttendees = true;
            return attendee;
        }
        const newUpdateTime = attendee.UpdateTime || 0;
        if (oldUpdateTime >= newUpdateTime) {
            // we should return old attendee data
            return oldAttendee;
        }
        hasUpdatedAttendees = true;
        return attendee;
    });

    return { attendees, hasUpdatedAttendees };
};

/**
 * Different event parts are updated asynchronously in the BE^**. Ideally we would have a ModifyTime per event part.
 * Since we don't atm, we rely on the global ModifyTime plus attendee update times.
 *
 * ** E.g.: a Proton organizer makes a modification to shared event data (shared with the attendee)
 * but the attendee makes a change to e.g. notifications before receiving the notification of the organizer change
 */
export const getHasUpdatedEventData = (
    newEventData: CalendarEvent | CalendarEventSharedData,
    oldEventData?: CalendarEvent | CalendarEventSharedData
) => {
    const isOldEventDataFull = oldEventData && getIsCalendarEvent(oldEventData);
    const isNewEventFull = getIsCalendarEvent(newEventData);
    const oldModifyTime = oldEventData?.ModifyTime || 0;
    const newModifyTime = newEventData.ModifyTime;

    const isNewEventLastEditTime = newModifyTime > oldModifyTime ? true : !isOldEventDataFull && isNewEventFull;
    const isNewEvent = !oldEventData;

    const hasUpdatedEventDataGlobal = isNewEvent || isNewEventLastEditTime;
    const { hasUpdatedAttendees, attendees } = getHasUpdatedAttendees(newEventData, oldEventData);

    const eventData: CalendarEvent | CalendarEventSharedData | undefined = hasUpdatedEventDataGlobal
        ? newEventData
        : oldEventData;
    const nextEventData = { ...eventData };

    const isObject = (value: unknown): value is object =>
        typeof value === 'object' && !Array.isArray(value) && value !== null;

    if (
        attendees &&
        nextEventData &&
        'AttendeesInfo' in nextEventData &&
        nextEventData.AttendeesInfo &&
        isObject(nextEventData.AttendeesInfo) &&
        'Attendees' in nextEventData.AttendeesInfo
    ) {
        nextEventData.AttendeesInfo = {
            ...nextEventData.AttendeesInfo,
            Attendees: attendees || [],
        };
    }

    return {
        hasUpdatedEventData: hasUpdatedEventDataGlobal || hasUpdatedAttendees,
        eventData: nextEventData,
    };
};

export const getCalendarEventStoreRecord = (
    eventComponent: SharedVcalVeventComponent,
    eventData: CalendarEvent | CalendarEventSharedData
): RequireSome<CalendarEventStoreRecord, 'eventData'> => {
    const { utcStart, utcEnd, isAllDay, isAllPartDay } = getViewEventDateProperties(eventComponent);

    return {
        utcStart,
        utcEnd,

        isAllDay,
        isAllPartDay,

        eventComponent,
        eventData,
    };
};

const DEFAULT = {};
const upsertCalendarEventStoreRecordHelper = (
    calendarEventID: string,
    calendarEventStoreRecord: CalendarEventStoreRecord,
    { tree, events, recurringEvents }: CalendarEventsCache
) => {
    const oldCalendarEventStoreRecord = events.get(calendarEventID);

    const { utcStart: newUtcStart, utcEnd: newUtcEnd, eventComponent: newVeventComponent } = calendarEventStoreRecord;

    const {
        utcStart: oldUtcStart,
        utcEnd: oldUtcEnd,
        eventComponent: oldEventComponent,
    }: Partial<CalendarEventStoreRecord> = oldCalendarEventStoreRecord || DEFAULT;

    const isRecurring = getIsRecurring(newVeventComponent);
    const recurrenceId = getRecurrenceIdDate(newVeventComponent);
    const uid = getUidValue(newVeventComponent);

    const isOldRecurring = oldEventComponent ? getIsRecurring(oldEventComponent) : false;
    const oldRecurrenceId = oldEventComponent ? getRecurrenceIdDate(oldEventComponent) : undefined;
    const oldUid = oldEventComponent ? getUidValue(newVeventComponent) : undefined;

    if (oldCalendarEventStoreRecord && oldUid !== uid) {
        throw new Error('Event with incorrect UID');
    }

    if (oldCalendarEventStoreRecord && recurrenceId && !oldRecurrenceId) {
        // This should never happen
        throw new Error('Old event without recurrence id');
    }

    if (recurrenceId) {
        setEventInRecurrenceInstances({
            id: calendarEventID,
            uid,
            recurringEvents,
            recurrenceId: +recurrenceId,
            oldRecurrenceId: oldRecurrenceId ? +oldRecurrenceId : undefined,
        });

        upsertCalendarEventInTree({
            id: calendarEventID,
            oldStart: oldUtcStart ? +oldUtcStart : undefined,
            oldEnd: oldUtcEnd ? +oldUtcEnd : undefined,
            isOldRecurring,
            start: +newUtcStart,
            end: +newUtcEnd,
            tree,
        });
    } else if (isRecurring) {
        if (oldCalendarEventStoreRecord && !isOldRecurring && oldUtcStart && oldUtcEnd) {
            tree.remove(+oldUtcStart, +oldUtcEnd, calendarEventID);
        }

        setEventInRecurringCache(recurringEvents, calendarEventID, uid);
    } else {
        if (isOldRecurring) {
            recurringEvents.delete(uid);
        }

        upsertCalendarEventInTree({
            id: calendarEventID,
            oldStart: oldUtcStart ? +oldUtcStart : undefined,
            oldEnd: oldUtcEnd ? +oldUtcEnd : undefined,
            isOldRecurring,
            start: +newUtcStart,
            end: +newUtcEnd,
            tree,
        });
    }

    events.set(calendarEventID, calendarEventStoreRecord);
};

export const upsertCalendarEventStoreRecord = (
    eventID: string,
    calendarEventStoreRecord: RequireSome<CalendarEventStoreRecord, 'eventData'>,
    calendarEventsCache: CalendarEventsCache
) => {
    const oldEventRecord = calendarEventsCache.events.get(eventID);
    const oldEventData = oldEventRecord?.eventData;
    const newEventData = calendarEventStoreRecord.eventData;
    const { hasUpdatedEventData, eventData } = getHasUpdatedEventData(newEventData, oldEventData);

    if (!hasUpdatedEventData) {
        return false;
    }

    const newCalendarEventStoreRecord: CalendarEventStoreRecord = {
        ...calendarEventStoreRecord,
        eventData,
    };

    upsertCalendarEventStoreRecordHelper(eventID, newCalendarEventStoreRecord, calendarEventsCache);
    return true;
};
