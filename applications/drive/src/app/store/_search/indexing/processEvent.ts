import { PrivateKeyReference } from '@proton/crypto';
import { ESEvent, ESItemEvent } from '@proton/encrypted-search';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

import { DriveEvent, DriveEvents } from '../../_events';
import { ESLink } from '../types';
import { createItemId, generateOrder } from '../utils';

export type SearchEventItem = ESItemEvent<ESLink>;
export type SearchEvent = ESEvent<ESLink>;

/**
 * Formats regular events into a ESEvent batch that will be processed by ES lib
 */
export default async function convertDriveEventsToSearchEvents(
    shareId: string,
    events: DriveEvents,
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>
): Promise<SearchEvent> {
    return {
        EventID: events.eventId,
        Refresh: events.refresh ? 1 : 0,
        attemptReDecryption: false,
        Items: await Promise.all(
            events.events.map((event) => convertDriveEventToSearchEvent(shareId, event, getLinkPrivateKey))
        ),
    };
}

async function convertDriveEventToSearchEvent(
    shareId: string,
    event: DriveEvent,
    getLinkPrivateKey: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<PrivateKeyReference>
): Promise<SearchEventItem> {
    const result: SearchEventItem = {
        ID: createItemId(shareId, event.encryptedLink.linkId),
        Action: convertEventTypesToSearchEventAction(event.eventType),
        ItemEvent: undefined,
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
    result.ItemEvent = await decryptAndGenerateSearchEvent(shareId, event, parentPrivateKey);

    return result;
}

function convertEventTypesToSearchEventAction(eventType: EVENT_TYPES): EVENT_ACTIONS {
    return Object.fromEntries([
        [EVENT_TYPES.CREATE, EVENT_ACTIONS.CREATE],
        [EVENT_TYPES.UPDATE, EVENT_ACTIONS.UPDATE],
        [EVENT_TYPES.UPDATE_METADATA, EVENT_ACTIONS.UPDATE_FLAGS],
        [EVENT_TYPES.DELETE, EVENT_ACTIONS.DELETE],
    ])[eventType];
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
