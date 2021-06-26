import { getOccurrences } from 'proton-shared/lib/calendar/recurring';
import { addMilliseconds } from 'proton-shared/lib/date-fns-utc';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';

import { getRecurrenceIdDate } from './getEventHelper';

const getSingleEditRecurringData = (originalEvent: VcalVeventComponent, occurrenceEvent: VcalVeventComponent) => {
    // If it's a single edition, the recurrence ID exists on the occurrence
    const recurrenceID = getRecurrenceIdDate(occurrenceEvent);
    if (!recurrenceID) {
        throw new Error('Can only get event recurrence data for events with recurrence IDs');
    }
    // Since maxStart is inclusive, add one millisecond to ensure it would get included
    const maxStart = addMilliseconds(recurrenceID, 1);

    const occurrencesUntilDate = getOccurrences({
        component: originalEvent,
        maxCount: 10000000,
        maxStart,
    });

    const twoOccurrences = getOccurrences({
        component: originalEvent,
        maxCount: 2,
    });

    // If no occurrences was found, it assumes that the recurrence-id is invalid.
    // In that case, it falls back to the first occurrence
    // It does that instead of throwing to allow the user to delete it, the effect is that it'll delete the closest event from the chain
    const occurrences = occurrencesUntilDate.length === 0 ? twoOccurrences : occurrencesUntilDate;
    const isSingleOccurrence = twoOccurrences.length === 1;

    return {
        ...occurrences[occurrences.length - 1],
        isSingleOccurrence,
    };
};

export default getSingleEditRecurringData;
