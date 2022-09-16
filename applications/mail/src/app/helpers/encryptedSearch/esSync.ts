import { ESEvent, ES_SYNC_ACTIONS, EventsObject } from '@proton/encrypted-search';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';
import { LabelCount } from '@proton/shared/lib/interfaces';

import { MAIL_EVENTLOOP_NAME } from '../../constants';
import { ESBaseMessage } from '../../models/encryptedSearch';
import { Event } from '../../models/event';
import { getBaseMessage } from './esBuild';
import { getTotalMessages } from './esUtils';

const eventConversionObject = Object.fromEntries([
    [EVENT_ACTIONS.CREATE, ES_SYNC_ACTIONS.CREATE],
    [EVENT_ACTIONS.UPDATE, ES_SYNC_ACTIONS.UPDATE_CONTENT],
    [EVENT_ACTIONS.UPDATE_DRAFT, ES_SYNC_ACTIONS.UPDATE_CONTENT],
    [EVENT_ACTIONS.UPDATE_FLAGS, ES_SYNC_ACTIONS.UPDATE_METADATA],
    [EVENT_ACTIONS.DELETE, ES_SYNC_ACTIONS.DELETE],
]);

export const convertEventType = (event: Event): ESEvent<ESBaseMessage> | undefined => {
    const { EventID, Refresh, Messages, Addresses } = event;

    if (!EventID) {
        return;
    }

    const attemptReDecryption =
        !!Addresses && Addresses.some((AddressEvent) => AddressEvent.Action === EVENT_ACTIONS.UPDATE);

    const Items = !Messages
        ? undefined
        : Messages.map((messageEvent) => {
              const { ID, Action, Message } = messageEvent;
              return {
                  ID,
                  Action: eventConversionObject[Action],
                  ItemMetadata: !!Message ? getBaseMessage(Message) : undefined,
              };
          });

    let eventsToStore: EventsObject = {};
    eventsToStore[MAIL_EVENTLOOP_NAME] = EventID;

    return {
        EventID,
        Refresh,
        Items,
        attemptReDecryption,
        eventsToStore,
    };
};

export const getTotal = (getMessageCounts: () => Promise<LabelCount[]>) => async () => {
    const messageCounts = await getMessageCounts();
    return getTotalMessages(messageCounts);
};
