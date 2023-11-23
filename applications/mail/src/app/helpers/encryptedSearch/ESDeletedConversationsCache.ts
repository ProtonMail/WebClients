import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { Event } from '../../models/event';

/**
 * Cache of deleted conversation IDs.
 * Allows to know if we should refetch the conversation on message deletion or not
 * This cached is filled at two places:
 * 1. When we receive an event from the event loop
 * 2. When we delete the message in MailESCallback
 *
 * The second point can seem to be a duplicate because point 1 have already occured.
 * But when we delete a 1000 messages conversation we will have to wait for
 * multiple events to receive the conversation ID in the event loop.
 * And in the meantime the 750 previous messages will be refetched.
 *
 * Point two is here as a fallback for this case.
 *
 * Cache is cleared when we receive 5 events without deletion
 */
const ESdeletedConversationIdsCache = new Set<string>();

let eventsWithNoDeletionCount = 0;
const EVENTS_WITHOUT_DELETION_COUNT_LIMIT = 2;
const shouldClearCache = (event: Event) => {
    if (ESdeletedConversationIdsCache.size > 0) {
        if (event.Messages?.every(({ Action }) => Action !== EVENT_ACTIONS.DELETE)) {
            eventsWithNoDeletionCount += 1;
        }

        if (eventsWithNoDeletionCount >= EVENTS_WITHOUT_DELETION_COUNT_LIMIT) {
            eventsWithNoDeletionCount = 0;
            ESdeletedConversationIdsCache.clear();
        }
    }
};

/**
 * Listens the event loop when ES is active and update
 * the deleted conversation IDs cache
 */
const updateESDeletedConversationIdsCacheOnEvent = (event: Event) => {
    if (!event.EventID) {
        return;
    }

    shouldClearCache(event);
    event.Conversations?.forEach(({ Action, ID }) => {
        if (Action === EVENT_ACTIONS.DELETE) {
            ESdeletedConversationIdsCache.add(ID);
        }

        if (ESdeletedConversationIdsCache.has(ID) && [EVENT_ACTIONS.CREATE, EVENT_ACTIONS.UPDATE].includes(Action)) {
            ESdeletedConversationIdsCache.delete(ID);
        }
    });
};

export default {
    listenEvents: updateESDeletedConversationIdsCacheOnEvent,
    addElement: (conversationID: string) => ESdeletedConversationIdsCache.add(conversationID),
    hasElement: (conversationID: string) => ESdeletedConversationIdsCache.has(conversationID),
};
