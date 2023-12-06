import { getOccurrences } from '@proton/shared/lib/calendar/recurrence/recurring';
import { propertyToUTCDate } from '@proton/shared/lib/calendar/vcalConverter';
import { getRecurrenceId } from '@proton/shared/lib/calendar/veventHelper';
import { addMilliseconds } from '@proton/shared/lib/date-fns-utc';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';

const getSingleEditRecurringData = (originalEvent: VcalVeventComponent, occurrenceEvent: VcalVeventComponent) => {
    // If it's a single edition, the recurrence ID exists on the occurrence
    const recurrenceID = getRecurrenceId(occurrenceEvent);
    if (!recurrenceID) {
        throw new Error('Can only get event recurrence data for events with recurrence IDs');
    }
    // In case the RECURRENCE-ID matches an EXDATE from originalEvent (this happens for Proton-Proton recurring invites with cancelled occurrences),
    // remove the EXDATE (to compute the expansions below) as RECURRENCE-ID takes precedence
    const originalEventForOccurrences = {
        ...originalEvent,
        exdate: originalEvent.exdate?.filter((exdate) => {
            return +propertyToUTCDate(exdate) !== +propertyToUTCDate(recurrenceID);
        }),
    };
    // Since maxStart is inclusive, add one millisecond to ensure it would get included
    const maxStart = addMilliseconds(toUTCDate(recurrenceID.value), 1);

    const occurrencesUntilDate = getOccurrences({
        component: originalEventForOccurrences,
        maxCount: 10000000,
        maxStart,
    });

    const twoOccurrences = getOccurrences({
        component: originalEventForOccurrences,
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
