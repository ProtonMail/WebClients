import { isSameDay } from 'proton-shared/lib/date-fns-utc';
import { CalendarViewEvent, CalendarViewEventTemporaryEvent } from '../../containers/calendar/interface';

const isAllDayPrio = (a: CalendarViewEvent, b: CalendarViewEvent) => {
    // If a is an all day event,
    // b is a part day event,
    // and the all day event starts on the same day that b ends and (b does not span multiple days)
    // The last check is needed because a part day event can span on 2 days without being seen
    // as a an all day event
    return a.isAllDay && !b.isAllDay && isSameDay(a.start, b.end) && isSameDay(b.start, b.end);
};

export const sortEvents = (events: CalendarViewEvent[]) => {
    return events.sort((a, b) => {
        // Sort all day (and cross day events) events before
        if (isAllDayPrio(a, b)) {
            return -1;
        }
        if (isAllDayPrio(b, a)) {
            return 1;
        }
        return +a.start - +b.start || +b.end - +a.end;
    });
};

const removeById = (arr: Partial<{ id: string }>[], id: string) => {
    const targetIdx = arr.findIndex((a) => {
        return a.id === id;
    });
    // Should never happen
    if (targetIdx !== -1) {
        // Fine to mutate it.
        arr.splice(targetIdx, 1);
    }
};

export const sortWithTemporaryEvent = (
    events: CalendarViewEvent[],
    temporaryEvent: CalendarViewEventTemporaryEvent | undefined
) => {
    const eventsCopy = events.concat();
    if (!temporaryEvent) {
        return sortEvents(eventsCopy);
    }

    // When dragging an event, remove the original event
    if (temporaryEvent.targetId) {
        removeById(eventsCopy, temporaryEvent.targetId);
    }

    if (!temporaryEvent.isAllDay) {
        return sortEvents([temporaryEvent, ...eventsCopy]);
    }

    // For all day events, push the event before any event that is overlapping
    const sortedEvents = sortEvents(eventsCopy);

    const idx = sortedEvents.findIndex((a) => {
        return a.end >= temporaryEvent.start;
    });

    sortedEvents.splice(idx === -1 ? sortedEvents.length : idx, 0, temporaryEvent);
    return sortedEvents;
};
