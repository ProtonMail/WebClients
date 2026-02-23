import type { PrivateKeyReference } from '@proton/crypto';
import { ES_SYNC_ACTIONS } from '@proton/encrypted-search/constants';
import type { ESEvent, ESItemEvent, EventsObject } from '@proton/encrypted-search/models';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

import type { DriveEvent, DriveEvents } from '../../_events';
import type { ESLink } from '../types';
import { createItemId, generateOrder } from '../utils';

type SearchEventItem = ESItemEvent<ESLink>;
type SearchEvent = ESEvent<ESLink>;

/**
 * Formats regular events into a ESEvent batch that will be processed by ES lib
 */
export default async function convertDriveEventsToSearchEvents(
    shareId: string,
    events: DriveEvents,
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>
): Promise<SearchEvent> {
    const eventsToStore: EventsObject = {};
    eventsToStore[shareId] = events.eventId;
    return {
        eventsToStore,
        Refresh: events.refresh ? 1 : 0,
        attemptReDecryption: false,
        Items: await Promise.all(
            events.events.map((event) => convertDriveEventToSearchEvent(shareId, event, getLinkPrivateKey))
        ),
    };
}

const convertEventTypesToSearchEventAction = Object.fromEntries([
    [EVENT_TYPES.CREATE, ES_SYNC_ACTIONS.CREATE],
    [EVENT_TYPES.UPDATE, ES_SYNC_ACTIONS.UPDATE_CONTENT],
    [EVENT_TYPES.UPDATE_METADATA, ES_SYNC_ACTIONS.UPDATE_METADATA],
    [EVENT_TYPES.DELETE, ES_SYNC_ACTIONS.DELETE],
]);

async function convertDriveEventToSearchEvent(
    shareId: string,
    event: DriveEvent,
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>
): Promise<SearchEventItem> {
    const result: SearchEventItem = {
        ID: createItemId(shareId, event.encryptedLink.linkId),
        Action: convertEventTypesToSearchEventAction[event.eventType],
        ItemMetadata: undefined,
    };
    // There's no link meta sent from BE in case of delete event
    if (event.eventType === EVENT_TYPES.DELETE) {
        return result;
    }

    const parentPrivateKey = await getLinkPrivateKey(
        new AbortController().signal,
        shareId,
        event.encryptedLink.parentLinkId
    );
    result.ItemMetadata = await decryptAndGenerateSearchEvent(shareId, event, parentPrivateKey);

    return result;
}

async function decryptAndGenerateSearchEvent(shareId: string, event: DriveEvent, privateKey: PrivateKeyReference) {
    const link = event.encryptedLink;
    const name = await decryptUnsigned({ armoredMessage: link.name, privateKey });
    const id = createItemId(shareId, link.linkId);

    return {
        decryptedName: name,
        MIMEType: link.mimeType,
        createTime: link.createTime,
        id,
        linkId: link.linkId,
        parentLinkId: link.parentLinkId,
        size: link.size,
        modifiedTime: link.metaDataModifyTime,
        shareId,
        order: await generateOrder(id),
    };
}
