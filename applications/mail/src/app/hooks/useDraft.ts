import { useCache, useMailSettings, useAddresses, generateUID } from 'react-components';

import { createNewDraft, cloneDraft } from '../helpers/message/messageDraft';
import { MESSAGE_ACTIONS } from '../constants';
import { useEffect, useCallback } from 'react';
import { MessageExtended, MessageExtendedWithData } from '../models/message';
import { useMessageCache } from '../containers/MessageProvider';

const CACHE_KEY = 'Draft';

/**
 * Hooks to create new draft messages.
 * It will prepare an empty draft to be quickly reused and create other drafts with helpers
 */
export const useDraft = () => {
    const cache = useCache();
    const [mailSettings, loadingSettings] = useMailSettings();
    const [addresses, loadingAddresses] = useAddresses();
    const messageCache = useMessageCache();

    useEffect(() => {
        if (!loadingSettings && !loadingAddresses) {
            const message = createNewDraft(MESSAGE_ACTIONS.NEW, undefined, mailSettings, addresses);
            cache.set(CACHE_KEY, message);
        }
    }, [cache, mailSettings, addresses]);

    const createDraft = useCallback(
        (action: MESSAGE_ACTIONS, referenceMessage?: Partial<MessageExtended>) => {
            let message: MessageExtended;

            if (action === MESSAGE_ACTIONS.NEW && cache.has(CACHE_KEY) && referenceMessage === undefined) {
                message = cloneDraft(cache.get(CACHE_KEY) as MessageExtendedWithData);
            } else {
                // This cast is quite dangerous but hard to remove
                message = createNewDraft(action, referenceMessage, mailSettings, addresses) as MessageExtended;
            }

            message.localID = generateUID('draft');
            messageCache.set(message.localID, message);
            return message.localID;
        },
        [cache, mailSettings, addresses, messageCache]
    );

    return createDraft;
};
