import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { CalendarEvent, CalendarEventWithoutBlob } from 'proton-shared/lib/interfaces/calendar';
import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { isIcalRecurring } from 'proton-shared/lib/calendar/recurring';
import { differenceInHours } from 'date-fns';
import { setEventInRecurrenceInstances, setEventInRecurringCache } from './recurringCache';
import upsertCalendarEventInTree from './upsertCalendarEventInTree';
import { CalendarEventCache, CalendarEventStoreRecord } from '../interface';
import { getRecurrenceId, getUid } from '../../event/getEventHelper';

export const getCalendarEventStoreRecord = (
    eventComponent: VcalVeventComponent,
    eventData: CalendarEvent | CalendarEventWithoutBlob
): CalendarEventStoreRecord => {
    const utcStart = propertyToUTCDate(eventComponent.dtstart);
    const unsafeEnd = propertyToUTCDate(eventComponent.dtend);

    const isAllDay = isIcalAllDay(eventComponent);

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
export const upsertCalendarEventStoreRecord = (
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

    const isRecurring = isIcalRecurring(newVeventComponent);
    const recurrenceId = getRecurrenceId(newVeventComponent);
    const uid = getUid(newVeventComponent);

    const isOldRecurring = oldEventComponent ? isIcalRecurring(oldEventComponent) : false;
    const oldRecurrenceId = oldEventComponent ? getRecurrenceId(oldEventComponent) : undefined;
    const oldUid = oldEventComponent ? getUid(newVeventComponent) : undefined;

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
