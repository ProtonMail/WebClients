import { getOccurrences, getOccurrencesBetween, RecurringResult } from 'proton-shared/lib/calendar/recurring';
import { EventsCache, RecurringEventsCache } from '../interface';

interface Result {
    id: string;
    eventOccurrences: RecurringResult[];
    isSingleOccurrence: boolean;
}

export const getRecurringEvents = (
    events: EventsCache,
    recurringEvents: RecurringEventsCache,
    searchStart: number,
    searchEnd: number
) => {
    const result: Result[] = [];

    for (const uid of recurringEvents.keys()) {
        const recurringEventsCacheRecord = recurringEvents.get(uid);
        if (!recurringEventsCacheRecord) {
            continue;
        }
        const { parentEventID, recurrenceInstances, cache } = recurringEventsCacheRecord;

        // If just a recurrence-id was received, without a link to any parent
        if (!parentEventID) {
            continue;
        }

        const parentEventCacheRecord = events.get(parentEventID);
        if (!parentEventCacheRecord) {
            continue;
        }

        const { eventComponent } = parentEventCacheRecord;

        let eventOccurrences = getOccurrencesBetween(eventComponent, searchStart, searchEnd, cache);
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

        const isSingleOccurrence = getOccurrences({ component: eventComponent, maxCount: 2, cache }).length === 1;

        result.push({
            id: parentEventID,
            eventOccurrences,
            isSingleOccurrence,
        });
    }

    return result;
};
