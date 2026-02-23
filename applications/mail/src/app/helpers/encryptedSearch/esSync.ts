import type { ESEvent, ESTimepoint, EventsObject } from '@proton/encrypted-search';
import { hasReactivatedKey, openESDB } from '@proton/encrypted-search';
import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import type { LabelCount } from '@proton/shared/lib/interfaces';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import type { ESBaseMessage } from '../../models/encryptedSearch';
import type { Event } from '../../models/event';
import { getBaseMessage } from './esBuild';
import { getTotalMessages } from './esUtils';

const eventConversionObject = Object.fromEntries([
    [EVENT_ACTIONS.CREATE, ES_SYNC_ACTIONS.CREATE],
    [EVENT_ACTIONS.UPDATE, ES_SYNC_ACTIONS.UPDATE_CONTENT],
    [EVENT_ACTIONS.UPDATE_DRAFT, ES_SYNC_ACTIONS.UPDATE_CONTENT],
    [EVENT_ACTIONS.UPDATE_FLAGS, ES_SYNC_ACTIONS.UPDATE_METADATA],
    [EVENT_ACTIONS.DELETE, ES_SYNC_ACTIONS.DELETE],
]);

export const convertEventType = (event: Event, numAddresses: number): ESEvent<ESBaseMessage> | undefined => {
    const { EventID, Refresh, Messages: MessageEvents, Addresses: AddressEvents } = event;

    if (!EventID) {
        return;
    }

    const attemptReDecryption = hasReactivatedKey({ AddressEvents, numAddresses });

    const Items = !MessageEvents
        ? undefined
        : MessageEvents.map(({ ID, Action, Message }) => {
              return {
                  ID,
                  Action: eventConversionObject[Action],
                  ItemMetadata: !!Message ? getBaseMessage(Message) : undefined,
              };
          });

    const eventsToStore: EventsObject = {};
    eventsToStore[MAIL_EVENTLOOP_NAME] = EventID;

    return {
        Refresh,
        Items,
        attemptReDecryption,
        eventsToStore,
    };
};

/**
 * Return the IDs in the metadata table that are not in the content table
 */
export const findRecoveryPoint = async (userID: string) => {
    const esDB = await openESDB(userID);
    if (!esDB) {
        return;
    }

    const contentIDs = new Set(await esDB.getAllKeys('content'));
    const metadataIDs = await esDB.getAllKeysFromIndex('metadata', 'temporal');
    metadataIDs.reverse();

    const result: {
        timepoint?: ESTimepoint;
        contentLen: number;
        metadataLen: number;
    } = {
        contentLen: contentIDs.size,
        metadataLen: metadataIDs.length,
    };

    for (let i = 0; i < metadataIDs.length; i++) {
        if (!contentIDs.has(metadataIDs[i])) {
            if (i === 0) {
                return result;
            }
            // The recoveryPoint that content indexing expects refers to the last
            // indexed content, not the first missing one
            const ciphertext = await esDB.get('metadata', metadataIDs[i - 1]);
            esDB.close();
            if (ciphertext) {
                result.timepoint = ciphertext.timepoint;
                return result;
            }
        }
    }

    esDB.close();
};

export const getTotal = (getMessageCounts: () => Promise<LabelCount[]>) => async () => {
    const messageCounts = await getMessageCounts();
    return getTotalMessages(messageCounts);
};
