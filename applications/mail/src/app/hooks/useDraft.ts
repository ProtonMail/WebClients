import { useCache, useMailSettings, useAddresses } from 'react-components';

import { createNewDraft, cloneDraft } from '../helpers/message/messageDraft';
import { MESSAGE_ACTIONS } from '../constants';
import { useEffect, useCallback } from 'react';
import { MessageExtended } from '../models/message';

const CACHE_KEY = 'Draft';

/**
 * Hooks to create new draft messages.
 * It will prepare an empty draft to be quickly reused and create other drafts with helpers
 */
export const useDraft = () => {
    const cache = useCache();
    const [mailSettings, loadingSettings] = useMailSettings();
    const [addresses, loadingAddresses] = useAddresses();

    useEffect(() => {
        if (!loadingSettings && !loadingAddresses) {
            const message = createNewDraft(MESSAGE_ACTIONS.NEW, undefined, mailSettings, addresses);
            cache.set(CACHE_KEY, message);
        }
    }, [cache, mailSettings, addresses]);

    const createDraft = useCallback(
        (action: MESSAGE_ACTIONS, referenceMessage: MessageExtended = {}) => {
            if (action === MESSAGE_ACTIONS.NEW && cache.has(CACHE_KEY)) {
                return cloneDraft(cache.get(CACHE_KEY) as MessageExtended);
            } else {
                return createNewDraft(action, referenceMessage, mailSettings, addresses);
            }
        },
        [cache, mailSettings, addresses]
    );

    return createDraft;
};
