import { canonicalizeEmailByGuess } from '@proton/shared/lib/helpers/email';

import type { EventReadResult } from '../../containers/calendar/eventStore/interface';

interface Event {
    eventReadResult: EventReadResult | undefined;
}

const eventsCache: {
    [uniqueId: string]: Event;
} = {};

export const getEventReadResult = (uniqueId?: string): EventReadResult | undefined => {
    return uniqueId ? eventsCache[uniqueId]?.eventReadResult : undefined;
};

export const setEventReadResult = (uniqueId?: string, eventReadResult?: EventReadResult): void => {
    if (!uniqueId) {
        return;
    }

    eventsCache[uniqueId] = {
        ...eventsCache[uniqueId], // Ensure existing data is not overwritten
        eventReadResult,
    };
};

export const getCurrentPartstat = (uniqueId: string, selfEmail: string) => {
    const eventReadResult = getEventReadResult(uniqueId);
    const [decryptedVeventResult] = eventReadResult?.result || [];

    if (decryptedVeventResult) {
        const attendee = decryptedVeventResult.veventComponent.attendee?.find((attendee) =>
            attendee.value.includes(canonicalizeEmailByGuess(selfEmail))
        );

        if (attendee && attendee.parameters) {
            return attendee.parameters.partstat;
        }
    }
};

export const setPartstat = (uniqueId: string, selfEmail: string, partstat: string): boolean => {
    const eventReadResult = getEventReadResult(uniqueId);
    const [decryptedVeventResult] = eventReadResult?.result || [];

    if (decryptedVeventResult) {
        const attendee = decryptedVeventResult.veventComponent.attendee?.find((attendee) =>
            attendee.value.includes(canonicalizeEmailByGuess(selfEmail))
        );

        if (attendee && attendee.parameters) {
            attendee.parameters.partstat = partstat;
            setEventReadResult(uniqueId, eventReadResult);
            return true;
        }
    }

    return false;
};
