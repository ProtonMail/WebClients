import { RecurringCache, RecurringEventsCache } from '../interface';

export const removeEventFromRecurrenceInstances = (
    recurringEvents: RecurringEventsCache,
    uid: string,
    recurrenceId: number
) => {
    const oldRecurringEvent = recurringEvents.get(uid);
    if (!oldRecurringEvent) {
        return;
    }

    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances;
    if (!oldRecurrenceInstances) {
        return;
    }

    const newRecurrenceInstances = {
        ...oldRecurrenceInstances,
    };

    if (recurrenceId) {
        delete newRecurrenceInstances[+recurrenceId];
    }

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances,
    });
};

interface SetEventInRecurrenceInstances {
    recurringEvents: RecurringEventsCache;
    EventID: string;
    oldRecurrenceId?: number;
    recurrenceId: number;
    uid: string;
}
export const setEventInRecurrenceInstances = ({
    recurringEvents,
    EventID,
    oldRecurrenceId,
    recurrenceId,
    uid,
}: SetEventInRecurrenceInstances) => {
    // Get the parent recurring event (if any)
    const oldRecurringEvent = recurringEvents.get(uid) || {};
    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances || {};

    // Update the recurrence id in the recurrence id map
    const newRecurrenceInstances = {
        ...oldRecurrenceInstances,
    };
    if (oldRecurrenceId) {
        delete newRecurrenceInstances[+oldRecurrenceId];
    }
    newRecurrenceInstances[+recurrenceId] = EventID;

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances,
    });
};

export const setEventInRecurringCache = (recurringEvents: RecurringEventsCache, EventID: string, uid: string) => {
    const oldRecurringEvent = recurringEvents.get(uid) || {};

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        parentEventID: EventID,
        cache: {},
    });
};

export const removeEventFromRecurringCache = (recurringEvents: Map<string, RecurringCache>, uid: string) => {
    recurringEvents.delete(uid);
};
