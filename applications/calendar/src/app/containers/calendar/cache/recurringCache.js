export const removeEventFromRecurrenceInstances = ({ uid, recurrenceId, recurringEvents }) => {
    const oldRecurringEvent = recurringEvents.get(uid);
    if (!oldRecurringEvent) {
        return;
    }

    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances;
    if (!oldRecurrenceInstances) {
        return;
    }

    const newRecurrenceInstances = {
        ...oldRecurrenceInstances
    };

    if (recurrenceId) {
        delete newRecurrenceInstances[+recurrenceId];
    }

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances
    });
};

export const setEventInRecurrenceInstances = ({ EventID, oldRecurrenceId, recurrenceId, recurringEvents, uid }) => {
    // Get the parent recurring event (if any)
    const oldRecurringEvent = recurringEvents.get(uid) || {};
    const oldRecurrenceInstances = oldRecurringEvent.recurrenceInstances || {};

    // Update the recurrence id in the recurrence id map
    const newRecurrenceInstances = {
        ...oldRecurrenceInstances
    };
    if (oldRecurrenceId) {
        delete newRecurrenceInstances[+oldRecurrenceId];
    }
    newRecurrenceInstances[+recurrenceId] = EventID;

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        recurrenceInstances: newRecurrenceInstances
    });
};

export const setEventInRecurringCache = ({ EventID, recurringEvents, uid }) => {
    const oldRecurringEvent = recurringEvents.get(uid) || {};

    recurringEvents.set(uid, {
        ...oldRecurringEvent,
        parentEventID: EventID,
        cache: {}
    });
};

export const removeEventFromRecurringCache = ({ recurringEvents, uid }) => {
    recurringEvents.delete(uid);
};
