import { RecurringCache, RecurringEventsCache } from '../interface';

export const removeEventFromRecurrenceInstances = (
    uid: string,
    recurrenceId: number,
    recurringEvents: RecurringEventsCache,
    eventID: string
) => {
    const oldRecurringEvent = recurringEvents.get(uid);
    if (!oldRecurringEvent) {
        return;
    }

    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances;
    if (!oldRecurrenceInstances) {
        return;
    }

    const oldEventID = oldRecurrenceInstances[recurrenceId];
    if (oldEventID !== eventID) {
        return;
    }

    const newRecurrenceInstances = {
        ...oldRecurrenceInstances,
    };

    delete newRecurrenceInstances[recurrenceId];

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances,
    });
};

interface SetEventInRecurrenceInstances {
    id: string;
    uid: string;
    recurrenceId: number;
    recurringEvents: RecurringEventsCache;
    oldRecurrenceId?: number;
}
export const setEventInRecurrenceInstances = ({
    id,
    uid,
    recurrenceId,
    recurringEvents,
    oldRecurrenceId,
}: SetEventInRecurrenceInstances) => {
    // Get the parent recurring event (if any)
    const oldRecurringEvent = recurringEvents.get(uid) || {};
    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances || {};

    // Update the recurrence id in the recurrence id map
    const newRecurrenceInstances = {
        ...oldRecurrenceInstances,
    };
    if (oldRecurrenceId !== undefined) {
        const oldEventID = newRecurrenceInstances[recurrenceId];
        if (oldEventID === id) {
            delete newRecurrenceInstances[oldRecurrenceId];
        }
    }
    newRecurrenceInstances[recurrenceId] = id;

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances,
    });
};

export const setEventInRecurringCache = (recurringEvents: RecurringEventsCache, id: string, uid: string) => {
    const oldRecurringEvent = recurringEvents.get(uid) || {};

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        parentEventID: id,
        cache: {},
    });
};

export const removeEventFromRecurringCache = (
    recurringEvents: Map<string, RecurringCache>,
    uid: string,
    eventID: string
) => {
    const oldRecurringEvent = recurringEvents.get(uid) || {};

    if (oldRecurringEvent.parentEventID !== eventID) {
        return;
    }

    if (!oldRecurringEvent.recurrenceInstances || !Object.keys(oldRecurringEvent.recurrenceInstances).length) {
        recurringEvents.delete(uid);
        return;
    }

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        parentEventID: undefined,
        cache: {},
    });
};
