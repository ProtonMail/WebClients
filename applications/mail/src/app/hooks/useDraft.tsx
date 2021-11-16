import { useEffect, useCallback } from 'react';
import { c } from 'ttag';
import {
    useCache,
    generateUID,
    useModals,
    ConfirmModal,
    Alert,
    useGetMailSettings,
    useGetAddresses,
    useGetUser,
    useAddresses,
    useMailSettings,
} from '@proton/components';
import { isPaid } from '@proton/shared/lib/user/helpers';

import { createNewDraft, cloneDraft } from '../helpers/message/messageDraft';
import { MessageExtended, MessageExtendedWithData, PartialMessageExtended } from '../models/message';
import { useMessageCache } from '../containers/MessageProvider';
import { findSender } from '../helpers/addresses';
import { MESSAGE_ACTIONS } from '../constants';
import { useGetAttachment } from './useAttachment';

const CACHE_KEY = 'Draft';

export const useDraftVerifications = () => {
    const getAddresses = useGetAddresses();
    const getUser = useGetUser();
    const { createModal } = useModals();

    return useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageExtended) => {
            const [user, addresses] = await Promise.all([getUser(), getAddresses()]);

            if (!isPaid(user) && findSender(addresses, referenceMessage?.data)?.Email.endsWith('@pm.me')) {
                const email = findSender(addresses, referenceMessage?.data, true)?.Email;
                await new Promise((resolve) => {
                    createModal(
                        <ConfirmModal
                            onConfirm={() => resolve(undefined)}
                            cancel={null}
                            onClose={() => resolve(undefined)}
                            title={c('Title').t`Sending notice`}
                            confirm={c('Action').t`OK`}
                        >
                            <Alert className="mb1">{c('Info')
                                .t`Sending messages from @pm.me address is a paid feature. Your message will be sent from your default address ${email}`}</Alert>
                        </ConfirmModal>
                    );
                });
            }
        },
        [getUser, getAddresses]
    );
};

/**
 * Hooks to create new draft messages.
 * It will prepare an empty draft to be quickly reused and create other drafts with helpers
 */
export const useDraft = () => {
    const cache = useCache();
    const getMailSettings = useGetMailSettings();
    const getAddresses = useGetAddresses();
    const messageCache = useMessageCache();
    const draftVerifications = useDraftVerifications();
    const [addresses] = useAddresses();
    const [mailSettings] = useMailSettings();
    const getAttachment = useGetAttachment();

    useEffect(() => {
        const run = async () => {
            if (!mailSettings || !addresses) {
                return;
            }
            const message = createNewDraft(MESSAGE_ACTIONS.NEW, undefined, mailSettings, addresses, getAttachment);
            cache.set(CACHE_KEY, message);
        };
        void run();
    }, [cache, addresses, mailSettings]);

    const createDraft = useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageExtended) => {
            const [mailSettings, addresses] = await Promise.all([getMailSettings(), getAddresses()]);

            await draftVerifications(action, referenceMessage);

            let message: MessageExtended;
            if (action === MESSAGE_ACTIONS.NEW && cache.has(CACHE_KEY) && referenceMessage === undefined) {
                message = cloneDraft(cache.get(CACHE_KEY) as MessageExtendedWithData);
            } else {
                // This cast is quite dangerous but hard to remove
                message = createNewDraft(
                    action,
                    referenceMessage,
                    mailSettings,
                    addresses,
                    getAttachment
                ) as MessageExtended;
            }

            message.localID = generateUID('draft');
            messageCache.set(message.localID, message);
            return message.localID;
        },
        [cache, getMailSettings, getAddresses, messageCache, draftVerifications]
    );

    return createDraft;
};
