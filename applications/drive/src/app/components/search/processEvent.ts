import { ESEvent, ESItemEvent } from '@proton/encrypted-search';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { EVENT_TYPES } from '@proton/shared/lib/drive/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { decryptUnsigned } from '@proton/shared/lib/keys/driveKeys';

import { LinkKeys } from '../DriveCache/DriveCacheProvider';
import { DriveEvent, DriveEventsPayload } from '../driveEventManager/interface';
import { ESLink } from './types';
import { generateOrder } from './utils';
import { createItemId } from './utils';

export type SearchEventItem = ESItemEvent<ESLink>;
export type SearchEvent = ESEvent<ESLink>;

export const formatEventWithPayload = async (event: DriveEvent, linkKeys: LinkKeys, shareId: string) => {
    const link = event.Link;
    const name = await decryptUnsigned({ armoredMessage: event.Link.Name, privateKey: linkKeys.privateKey });
    const id = createItemId(shareId, link.LinkID);

    return {
        decryptedName: name,
        MIMEType: link.MIMEType,
        createTime: link.CreateTime,
        id,
        linkId: link.LinkID,
        parentLinkId: link.ParentLinkID,
        size: link.Size,
        modifiedTime: link.ModifyTime,
        shareId,
        order: await generateOrder(id),
    };
};

const processEventItem = async (
    shareId: string,
    event: DriveEvent,
    getKeysCb: (shareId: string, linkId: string) => Promise<LinkKeys>
): Promise<SearchEventItem> => {
    const result: SearchEventItem = {
        ID: createItemId(shareId, event.Link!.LinkID),
        // TODO: suggeest mapping function fro event types
        Action: event.EventType as unknown as EVENT_ACTIONS,
        ItemEvent: undefined,
    };
    // There's no link meta sent from BE in case of delete event
    if (event.EventType === EVENT_TYPES.DELETE) {
        return result;
    }

    const keys = await getKeysCb(shareId, event.Link.ParentLinkID);
    result.ItemEvent = await formatEventWithPayload(event, keys, shareId);

    return result;
};

/**
 * Formats regular events into a ESEvent batch that will be processed by ES lib
 */
export const convertDriveEventToSearchEvent = async (
    shareId: string,
    events: DriveEventsPayload[],
    getKeysCb: (shareId: string, linkId: string) => Promise<LinkKeys>
): Promise<SearchEvent[]> => {
    const result = [];
    for (const eventList of events) {
        const searchEvent: SearchEvent = {
            EventID: eventList.EventID,
            Refresh: eventList.Refresh,
            attemptReDecryption: false,
            Items: await Promise.all(
                eventList.Events.map((event) => {
                    if (!event.Link) {
                        return undefined;
                    }
                    return processEventItem(shareId, event, getKeysCb);
                }).filter(isTruthy)
            ),
        };

        if (searchEvent.Items?.length) {
            result.push(searchEvent);
        }
    }

    return result;
};
