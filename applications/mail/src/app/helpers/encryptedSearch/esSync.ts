import { ESEvent } from '@proton/encrypted-search';
import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import { ESItemChangesMail } from '../../models/encryptedSearch';
import { Event } from '../../models/event';

export const convertEventType = (event: Event): ESEvent<ESItemChangesMail> => {
    const { EventID, Refresh, Messages, Addresses } = event;

    const attemptReDecryption =
        Addresses && Addresses.some((AddressEvent) => AddressEvent.Action === EVENT_ACTIONS.UPDATE);

    const Items = !Messages
        ? undefined
        : Messages.map((messageEvent) => {
              const { ID, Action, Message } = messageEvent;
              return {
                  ID,
                  Action,
                  ItemEvent: Message,
              };
          });

    return {
        EventID,
        Refresh,
        Items,
        attemptReDecryption,
    };
};
