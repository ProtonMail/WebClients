import { differenceInHours } from 'date-fns';

import { getDtendProperty, propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getIsAllDay, getIsRecurring, getRecurrenceIdDate, getUidValue } from '@proton/shared/lib/calendar/vcalHelper';
import { addDays, max } from '@proton/shared/lib/date-fns-utc';
import { CalendarEvent, CalendarEventSharedData } from '@proton/shared/lib/interfaces/calendar';

import { CalendarEventStoreRecord, CalendarEventsCache, SharedVcalVeventComponent } from '../interface';
import { getIsCalendarEvent } from './helper';
import { setEventInRecurrenceInstances, setEventInRecurringCache } from './recurringCache';
import upsertCalendarEventInTree from './upsertCalendarEventInTree';

export const getCalendarEventStoreRecord = (
    eventComponent: SharedVcalVeventComponent,
    eventData: CalendarEvent | CalendarEventSharedData
): CalendarEventStoreRecord => {
    const utcStart = propertyToUTCDate(eventComponent.dtstart);
    const unsafeEnd = propertyToUTCDate(getDtendProperty(eventComponent));

    const isAllDay = getIsAllDay(eventComponent);

    const modifiedEnd = isAllDay
        ? addDays(unsafeEnd, -1) // All day event range is non-inclusive
        : unsafeEnd;
    const utcEnd = max(utcStart, modifiedEnd);

    const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

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
    calendarEventStoreRecord: CalendarEventStoreRecord,
    calendarEventsCache: CalendarEventsCache
) => {
    const oldEventRecord = calendarEventsCache.events.get(eventID);

    const oldEventData = oldEventRecord?.eventData;
    const newEventData = calendarEventStoreRecord?.eventData;
    const isOldEventDataFull = oldEventData && getIsCalendarEvent(oldEventData);

    const oldModifyTime = oldEventData?.ModifyTime || 0;
    const newModifyTime = newEventData?.ModifyTime || 0;

    /**
     * There are instances of linked events where the API may inform us of a change with
     * a ModifyTime such that newModifyTime < oldModifyTime . We still need to update in that case.
     * This can happen if an organizer makes a modification to shared event data (shared with the attendee)
     * but the attendee made a change to e.g. notifications before receiving the notification of the organizer change.
     * Both modifications happen asynchronously on the BE and they need not come in order.
     * This will be improved later by BE with a ModifyTime per calendar part
     */
    const isNewEventLastEditTime = newModifyTime !== oldModifyTime ? true : !isOldEventDataFull;

    const isNewEvent = !oldEventRecord || !oldEventData;
    const shouldUpsert = isNewEvent || isNewEventLastEditTime;

    if (!shouldUpsert) {
        return false;
    }

    upsertCalendarEventStoreRecordHelper(eventID, calendarEventStoreRecord, calendarEventsCache);
    return true;
};
