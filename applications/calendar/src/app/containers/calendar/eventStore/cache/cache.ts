import { differenceInHours } from 'date-fns';
import { parse } from 'proton-shared/lib/calendar/vcal';
import { unwrap } from 'proton-shared/lib/calendar/helper';
import { isIcalAllDay, propertyToUTCDate } from 'proton-shared/lib/calendar/vcalConverter';
import { isIcalRecurring } from 'proton-shared/lib/calendar/recurring';
import { addDays, max } from 'proton-shared/lib/date-fns-utc';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import {
    removeEventFromRecurrenceInstances,
    setEventInRecurrenceInstances,
    removeEventFromRecurringCache,
    setEventInRecurringCache,
} from './recurringCache';
import { getRecurrenceId, getUid } from '../../event/getEventHelper';
import { CalendarEventCache, CalendarEventStoreRecord, IntervalTree } from '../interface';

export const removeEventFromCache = (
    EventID: string,
    { tree, events, decryptedEvents, recurringEvents }: CalendarEventCache
) => {
    const oldEvent = events.get(EventID);
    if (oldEvent) {
        const { start, end, isRecurring, component } = oldEvent;
        tree.remove(+start, +end, EventID);

        const uid = getUid(component);
        const recurrenceId = getRecurrenceId(component);

        if (recurrenceId) {
            removeEventFromRecurrenceInstances(recurringEvents, uid, +recurrenceId);
        } else if (isRecurring) {
            removeEventFromRecurringCache(recurringEvents, uid);
        }

        events.delete(EventID);
    }
    decryptedEvents.delete(EventID);
};

interface SetEventInTreeArguments {
    oldEvent?: CalendarEventStoreRecord;
    isOldRecurring: boolean;
    start: Date;
    end: Date;
    EventID: string;
    tree: IntervalTree;
}
export const setEventInTree = ({ oldEvent, isOldRecurring, start, end, EventID, tree }: SetEventInTreeArguments) => {
    if (!oldEvent || isOldRecurring) {
        tree.insert(+start, +end, EventID);
        return;
    }

    if (+start !== +oldEvent.start || +end !== +oldEvent.end) {
        // Interval changed
        tree.remove(+oldEvent.start, +oldEvent.end, EventID);
        tree.insert(+start, +end, EventID);
    }
};

export const setEventInCache = (
    Event: CalendarEvent,
    { tree, events, recurringEvents, decryptedEvents }: CalendarEventCache,
    isInitialFetch = false
) => {
    try {
        const { ID: EventID, SharedEvents } = Event;

        const oldEvent = events.get(EventID);
        /**
         * Since the event could already have been fetched, we don't need to re-set this event.
         * We are only interested in updating the event if it's an update from the event manager.
         */
        if (oldEvent && isInitialFetch) {
            return;
        }

        const signedPart = SharedEvents.find(({ Type }) => Type === 2);
        if (!signedPart) {
            return;
        }
        const component = parse(unwrap(signedPart.Data)) as VcalVeventComponent;

        if (component.component !== 'vevent') {
            return;
        }

        const { dtstart, dtend } = component;

        const isAllDay = isIcalAllDay(component);
        const isRecurring = isIcalRecurring(component);
        const recurrenceId = getRecurrenceId(component);
        const uid = getUid(component);
        const oldUid = oldEvent ? getUid(oldEvent.component) : undefined;
        const isOldRecurring = oldEvent?.isRecurring ?? false;

        if (!uid || (oldEvent && oldUid !== uid)) {
            throw new Error('Event with incorrect UID');
        }

        const utcStart = propertyToUTCDate(dtstart);
        const rawEnd = propertyToUTCDate(dtend);
        const modifiedEnd = isAllDay
            ? addDays(rawEnd, -1) // All day event range is non-inclusive
            : rawEnd;
        const utcEnd = max(utcStart, modifiedEnd);

        const isAllPartDay = !isAllDay && differenceInHours(utcEnd, utcStart) >= 24;

        if (recurrenceId) {
            const oldRecurrenceId = oldEvent ? getRecurrenceId(oldEvent.component) : undefined;
            if (oldEvent && !oldRecurrenceId) {
                // This should never happen
                throw new Error('Old event without recurrence id');
            }

            setEventInRecurrenceInstances({
                recurringEvents,
                EventID,
                oldRecurrenceId: oldRecurrenceId ? +oldRecurrenceId : undefined,
                recurrenceId: +recurrenceId,
                uid,
            });

            setEventInTree({
                oldEvent,
                isOldRecurring,
                start: utcStart,
                end: utcEnd,
                EventID,
                tree,
            });
        } else if (isRecurring) {
            if (oldEvent && !oldEvent.isRecurring) {
                tree.remove(+oldEvent.start, +oldEvent.end, EventID);
            }

            setEventInRecurringCache(recurringEvents, EventID, uid);
        } else {
            if (isOldRecurring) {
                recurringEvents.delete(uid);
            }

            setEventInTree({
                oldEvent,
                isOldRecurring,
                start: utcStart,
                end: utcEnd,
                EventID,
                tree,
            });
        }

        const record = {
            Event,
            component,

            isRecurring,
            isAllDay,
            isAllPartDay,

            start: utcStart,
            end: utcEnd,

            counter: ((oldEvent && oldEvent.counter) || 0) + 1,
        };

        events.set(EventID, record);
        decryptedEvents.delete(EventID);
    } catch (e) {
        console.error(e);
    }
};
