import { getOccurrences, getOccurrencesBetween } from 'proton-shared/lib/calendar/recurring';

export const getRecurringEvents = (events, recurringEvents, searchStart, searchEnd) => {
    const result = [];

    for (const uid of recurringEvents.keys()) {
        const { parentEventID, recurrenceInstances, cache } = recurringEvents.get(uid);

        // If just a recurrence-id was received, without a link to any parent
        if (!parentEventID) {
            return result;
        }

        if (!events.has(parentEventID)) {
            //debugger;
            return result;
        }

        const { component } = events.get(parentEventID);

        let eventOccurrences = getOccurrencesBetween(component, searchStart, searchEnd, cache);

        if (!eventOccurrences.length) {
            continue;
        }

        if (recurrenceInstances) {
            // Remove the individual recurrence instances from the occurrences
            eventOccurrences = eventOccurrences.filter((occurrence) => {
                const { localStart } = occurrence;
                return !recurrenceInstances[+localStart];
            });
        }

        const isSingleOccurrence = getOccurrences({ component, maxCount: 2, cache }).length === 1;

        result.push({
            id: parentEventID,
            eventOccurrences,
            isSingleOccurrence
        });
    }

    return result;
};
