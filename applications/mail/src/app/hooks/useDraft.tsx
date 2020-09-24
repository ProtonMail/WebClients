import React from 'react';
import { c } from 'ttag';
import { useCache, useMailSettings, useAddresses, generateUID, useModals, ConfirmModal, Alert } from 'react-components';
import { UserModel } from 'proton-shared/lib/models';
import { isPaid } from 'proton-shared/lib/user/helpers';

import { createNewDraft, cloneDraft } from '../helpers/message/messageDraft';
import { MESSAGE_ACTIONS } from '../constants';
import { useEffect, useCallback } from 'react';
import { MessageExtended, MessageExtendedWithData, PartialMessageExtended } from '../models/message';
import { useMessageCache } from '../containers/MessageProvider';
import { findSender } from '../helpers/addresses';

const CACHE_KEY = 'Draft';

export const useDraftVerifications = () => {
    const cache = useCache();
    const [addresses = []] = useAddresses();
    const { createModal } = useModals();

    return useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageExtended) => {
            // Avoid useUser for performance issues
            const user = cache.get(UserModel.key).value;

            if (!isPaid(user) && findSender(addresses, referenceMessage?.data)?.Email.endsWith('@pm.me')) {
                const email = findSender(addresses, referenceMessage?.data, true)?.Email;
                await new Promise((resolve) => {
                    createModal(
                        <ConfirmModal
                            onConfirm={resolve}
                            cancel={null}
                            onClose={resolve}
                            title={c('Title').t`Sending notice`}
                            confirm={c('Action').t`OK`}
                        >
                            <Alert>{c('Info')
                                .t`Sending messages from @pm.me address is a paid feature. Your message will be sent from your default address ${email}`}</Alert>
                        </ConfirmModal>
                    );
                });
            }
        },
        [addresses]
    );
};

/**
 * Hooks to create new draft messages.
 * It will prepare an empty draft to be quickly reused and create other drafts with helpers
 */
export const useDraft = () => {
    const cache = useCache();
    const [mailSettings, loadingSettings] = useMailSettings();
    const [addresses, loadingAddresses] = useAddresses();
    const messageCache = useMessageCache();
    const draftVerifications = useDraftVerifications();

    useEffect(() => {
        if (!loadingSettings && !loadingAddresses) {
            const message = createNewDraft(MESSAGE_ACTIONS.NEW, undefined, mailSettings, addresses);
            cache.set(CACHE_KEY, message);
        }
    }, [cache, mailSettings, addresses]);

    const createDraft = useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageExtended) => {
            let message: MessageExtended;

            await draftVerifications(action, referenceMessage);

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
        [cache, mailSettings, addresses, messageCache, draftVerifications]
    );

    return createDraft;
};
