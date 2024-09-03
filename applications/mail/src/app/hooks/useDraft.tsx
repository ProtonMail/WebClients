import { useCallback, useEffect } from 'react';

import {
    useAddresses,
    useCache,
    useGetAddresses,
    useGetMailSettings,
    useGetUser,
    useUserSettings,
} from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { isPaid } from '@proton/shared/lib/user/helpers';
import generateUID from '@proton/utils/generateUID';

import useMailModel from 'proton-mail/hooks/useMailModel';
import { useMailDispatch } from 'proton-mail/store/hooks';

import SendingFromDefaultAddressModal from '../components/composer/modals/SendingFromDefaultAddressModal';
import { MESSAGE_ACTIONS } from '../constants';
import { cloneDraft, createNewDraft } from '../helpers/message/messageDraft';
import { findSender } from '../helpers/message/messageRecipients';
import { createDraft as createDraftAction } from '../store/messages/draft/messagesDraftActions';
import type { MessageState, MessageStateWithData, PartialMessageState } from '../store/messages/messagesTypes';
import { useGetAttachment } from './attachments/useAttachment';

const CACHE_KEY = 'Draft';

export const useDraftVerifications = () => {
    const getAddresses = useGetAddresses();
    const getUser = useGetUser();
    const [sendingFromDefaultAddressModal, handleShowModal] = useModalTwo(SendingFromDefaultAddressModal);

    const handleDraftVerifications = useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageState) => {
            const [user, addresses] = await Promise.all([getUser(), getAddresses()]);

            if (!isPaid(user) && findSender(addresses, referenceMessage?.data)?.Email.endsWith('@pm.me')) {
                const email = findSender(addresses, referenceMessage?.data, true)?.Email;
                if (email) {
                    await handleShowModal({ email });
                }
            }
        },
        [getUser, getAddresses]
    );

    return { handleDraftVerifications, sendingFromDefaultAddressModal };
};

/**
 * Hooks to create new draft messages.
 * It will prepare an empty draft to be quickly reused and create other drafts with helpers
 */
export const useDraft = () => {
    const cache = useCache();
    const getMailSettings = useGetMailSettings();
    const getAddresses = useGetAddresses();
    const dispatch = useMailDispatch();
    const { handleDraftVerifications: draftVerifications, sendingFromDefaultAddressModal } = useDraftVerifications();
    const [addresses] = useAddresses();
    const mailSettings = useMailModel('MailSettings');
    const [userSettings] = useUserSettings();
    const getAttachment = useGetAttachment();

    useEffect(() => {
        const run = async () => {
            if (!mailSettings || !addresses) {
                return;
            }
            const message = createNewDraft(
                MESSAGE_ACTIONS.NEW,
                undefined,
                mailSettings,
                userSettings,
                addresses,
                getAttachment
            );
            cache.set(CACHE_KEY, message);
        };
        void run();
    }, [cache, addresses, mailSettings]);

    const createDraft = useCallback(
        async (action: MESSAGE_ACTIONS, referenceMessage?: PartialMessageState, isQuickReply?: boolean) => {
            const [mailSettings, addresses] = await Promise.all([getMailSettings(), getAddresses()]);

            await draftVerifications(action, referenceMessage);

            let message: MessageState;
            if (action === MESSAGE_ACTIONS.NEW && cache.has(CACHE_KEY) && referenceMessage === undefined) {
                message = cloneDraft(cache.get(CACHE_KEY) as MessageStateWithData);
            } else {
                // This cast is quite dangerous but hard to remove
                message = createNewDraft(
                    action,
                    referenceMessage,
                    mailSettings,
                    userSettings,
                    addresses,
                    getAttachment,
                    false,
                    isQuickReply
                ) as MessageState;
            }

            message.localID = generateUID('draft');
            dispatch(createDraftAction(message));
            return message.localID;
        },
        [cache, getMailSettings, getAddresses, draftVerifications]
    );

    return { createDraft, sendingFromDefaultAddressModal };
};
