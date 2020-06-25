import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import { CalendarEvent, CalendarEventSharedData } from 'proton-shared/lib/interfaces/calendar';
import { getDtendProperty, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { getIsAllDay, getIsRecurring } from 'proton-shared/lib/calendar/vcalHelper';
import { differenceInHours } from 'date-fns';

import { setEventInRecurrenceInstances, setEventInRecurringCache } from './recurringCache';
import upsertCalendarEventInTree from './upsertCalendarEventInTree';
import { CalendarEventCache, CalendarEventStoreRecord, SharedVcalVeventComponent } from '../interface';
import { getRecurrenceIdDate, getUidValue } from '../../event/getEventHelper';
import { getIsCalendarEvent } from './helper';

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
    { tree, events, recurringEvents }: CalendarEventCache
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
    calendarEventCache: CalendarEventCache
) => {
    const oldEventRecord = calendarEventCache.events.get(eventID);

    const oldEventData = oldEventRecord?.eventData;
    const newEventData = calendarEventStoreRecord?.eventData;
    const isOldEventDataFull = oldEventData && getIsCalendarEvent(oldEventData);

    const oldModifyTime = oldEventData?.ModifyTime || 0;
    const newModifyTime = newEventData?.ModifyTime || 0;

    const isNewEventLastEditTime =
        newModifyTime > oldModifyTime || (newModifyTime === oldModifyTime && !isOldEventDataFull);

    const isNewEvent = !oldEventRecord || !oldEventData;
    const shouldUpsert = isNewEvent || isNewEventLastEditTime;

    if (!shouldUpsert) {
        return false;
    }

    upsertCalendarEventStoreRecordHelper(eventID, calendarEventStoreRecord, calendarEventCache);
    return true;
};
