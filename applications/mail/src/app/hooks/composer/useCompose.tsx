import type { MutableRefObject } from 'react';
import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useGetAddresses } from '@proton/account/addresses/hooks';
import { useGetUser } from '@proton/account/user/hooks';
import { Button, Href } from '@proton/atoms';
import {
    ErrorButton,
    Prompt,
    useApi,
    useEventManager,
    useGetSubscription,
    useHandler,
    useModalState,
    useNotifications,
    useSettingsLink,
} from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { forceSend } from '@proton/shared/lib/api/messages';
import { APP_UPSELL_REF_PATH, MAIL_UPSELL_PATHS, UPSELL_COMPONENT } from '@proton/shared/lib/constants';
import { pick } from '@proton/shared/lib/helpers/object';
import { addUpsellPath, getUpgradePath, getUpsellRef } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isOutbox, isScheduledSend } from '@proton/shared/lib/mail/messages';

import { addComposerAction } from 'proton-mail/store/composers/composerActions';
import { composerActions } from 'proton-mail/store/composers/composersSlice';
import { useMailDispatch, useMailStore } from 'proton-mail/store/hooks';

import SendingOriginalMessageModal from '../../components/composer/modals/SendingOriginalMessageModal';
import type { MESSAGE_ACTIONS } from '../../constants';
import { isDirtyAddress } from '../../helpers/addresses';
import { openDraft } from '../../store/messages/draft/messagesDraftActions';
import type { MessageState, PartialMessageState } from '../../store/messages/messagesTypes';
import { useGetLocalID, useGetMessage } from '../message/useMessage';
import { useDraft } from '../useDraft';

export enum ComposeTypes {
    existingDraft,
    newMessage,
    fromMessage,
}

export interface ComposeExisting {
    type: ComposeTypes.existingDraft;
    existingDraft: MessageState;
    fromUndo: boolean;
    fromQuickReply?: boolean;
}

export interface ComposeNew {
    type: ComposeTypes.newMessage;
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageState;
    forceOpenScheduleSend?: boolean;
}

export interface ComposeModelMessage {
    type: ComposeTypes.fromMessage;
    modelMessage: MessageState;
}

export type ComposeArgs = (ComposeExisting | ComposeNew | ComposeModelMessage) & {
    returnFocusTo?: HTMLElement;
};

export const getComposeArgs = (composeArgs: ComposeArgs) => ({
    ...composeArgs,
    returnFocusTo: composeArgs.returnFocusTo || (document.activeElement as HTMLElement),
});

export interface OnCompose {
    (args: ComposeArgs): Promise<void>;
}

interface UseComposeProps {
    openedComposerIDs: string[];
    focusComposer: (messageID: string) => void;
    maxActiveComposer: number;
    returnFocusToElementRef: MutableRefObject<HTMLElement | null>;
}

export const useCompose = ({
    openedComposerIDs,
    focusComposer,
    maxActiveComposer,
    returnFocusToElementRef,
}: UseComposeProps) => {
    // Avoid useUser for performance issues
    const getUser = useGetUser();
    const store = useMailStore();
    const getSubscription = useGetSubscription();
    const getAddresses = useGetAddresses();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const { createDraft, sendingFromDefaultAddressModal } = useDraft();
    const goToSettings = useSettingsLink();
    const api = useApi();
    const { call } = useEventManager();
    const getLocalID = useGetLocalID();
    const getMessage = useGetMessage();

    const openComposer = useCallback(
        ({
            messageID,
            type,
            returnFocusTo,
            forceOpenScheduleSend,
        }: {
            messageID: string;
            type: ComposeTypes;
            returnFocusTo?: HTMLElement;

            forceOpenScheduleSend?: boolean;
        }) => {
            const message = getMessage(messageID);

            if (type === ComposeTypes.existingDraft) {
                dispatch(
                    addComposerAction({
                        messageID,
                        senderEmailAddress: undefined,
                        status: 'loading',
                        forceOpenScheduleSend,
                    })
                );
            } else {
                if (!message?.data?.Sender.Address) {
                    throw new Error('No address');
                }

                dispatch(
                    addComposerAction({
                        messageID,
                        senderEmailAddress: message.data.Sender.Address,
                        recipients: pick(message.data, ['ToList', 'CCList', 'BCCList']),
                        status: 'idle',
                        forceOpenScheduleSend,
                    })
                );
            }

            if (returnFocusTo) {
                returnFocusToElementRef.current = returnFocusTo;
            }
        },
        []
    );

    const [storageCapacityModalProps] = useModalState();
    const [sendingOriginalMessageModal, handleSendingOriginalMessage] = useModalTwo(SendingOriginalMessageModal);

    const upsellRef = getUpsellRef({
        app: APP_UPSELL_REF_PATH.MAIL_UPSELL_REF_PATH,
        component: UPSELL_COMPONENT.MODAL,
        feature: MAIL_UPSELL_PATHS.STORAGE_FULL,
    });

    const storageCapacityModal = (
        <Prompt
            title={c('Title').t`Storage capacity warning`}
            buttons={[
                <ErrorButton
                    onClick={async () => {
                        const user = await getUser();
                        const subscription = await getSubscription();
                        goToSettings(addUpsellPath(getUpgradePath({ user, subscription }), upsellRef));
                    }}
                >{c('Action').t`Upgrade`}</ErrorButton>,
                <Button onClick={storageCapacityModalProps.onClose}>{c('Action').t`Close`}</Button>,
            ]}
            {...storageCapacityModalProps}
        >
            {c('Info')
                .t`You have reached 100% of your storage capacity. Consider freeing up some space or upgrading your account with additional storage space to compose new messages.`}
            <br />
            <Href href={getKnowledgeBaseUrl('/increase-storage-space')}>{c('Link').t`Learn more`}</Href>
        </Prompt>
    );

    const handleCompose = useHandler(async (composeArgs: ComposeArgs) => {
        const addresses = await getAddresses();

        const createMaxActiveComposerNotification = () => {
            createNotification({
                type: 'error',
                // translator: maxActiveComposer should never be 1, is fixed to 3 today but can potentially vary from 2 to 5(?) in the future.
                text: c('Error').ngettext(
                    msgid`You cannot open more than ${maxActiveComposer} composer window at a time`,
                    `You cannot open more than ${maxActiveComposer} composer windows at a time`,
                    maxActiveComposer
                ),
            });
        };

        const activeAddresses = addresses.filter((address) => !isDirtyAddress(address));
        const compose = getComposeArgs(composeArgs);

        if (activeAddresses.length === 0) {
            createNotification({
                type: 'error',
                text: (
                    <>
                        {c('Error').t`No address with keys available to compose a message`}
                        <br />
                        {c('Error').t`Contact your organization’s administrator to resolve this`}
                    </>
                ),
            });
            return;
        }

        // Opened composer length is checked also in ComposeType.existingDraft condition
        // If draft is already has a composer, we don't want to show the error message on click
        if (openedComposerIDs.length >= maxActiveComposer && compose.type !== ComposeTypes.existingDraft) {
            createMaxActiveComposerNotification();
            return;
        }

        if (compose.type === ComposeTypes.existingDraft) {
            const { existingDraft, fromUndo, returnFocusTo } = compose;
            const localID = getLocalID(existingDraft.localID);

            let composer = Object.values(store.getState().composers.composers).find(
                ({ messageID }) => messageID === localID
            );

            if (composer) {
                if (composer.isMinimized) {
                    dispatch(composerActions.toggleMinimizeComposer(composer.ID));
                }
                focusComposer(composer.ID);
                return;
            }

            if (openedComposerIDs.length >= maxActiveComposer) {
                createMaxActiveComposerNotification();
                return;
            }

            const existingMessage = getMessage(localID);

            // If message is in sending state we stop here
            if (existingMessage?.draftFlags?.sending && !fromUndo) {
                return;
            }

            dispatch(openDraft({ ID: localID, fromUndo }));

            openComposer({ messageID: localID, returnFocusTo, type: compose.type });

            composer = Object.values(store.getState().composers.composers).find(
                ({ messageID }) => messageID === localID
            );

            if (composer) {
                focusComposer(composer.ID);
            }

            return;
        }

        if (compose.type === ComposeTypes.newMessage) {
            const { action, referenceMessage, returnFocusTo, forceOpenScheduleSend } = compose;
            const message = referenceMessage?.data;

            if (isOutbox(message) && message?.ID) {
                if (isScheduledSend(message)) {
                    createNotification({ text: c('Error').t`Message needs to be sent first`, type: 'error' });
                    return;
                }

                await handleSendingOriginalMessage({});
                await api(forceSend(message?.ID));
                await call();
            }

            const newMessageID = await createDraft(action, referenceMessage);

            openComposer({ messageID: newMessageID, returnFocusTo, type: compose.type, forceOpenScheduleSend });
            const composer = Object.values(store.getState().composers.composers).find(
                ({ messageID }) => messageID === newMessageID
            );
            if (composer) {
                focusComposer(composer?.ID);
            }
        }

        if (compose.type === ComposeTypes.fromMessage) {
            const { modelMessage, returnFocusTo } = compose;
            openComposer({ messageID: modelMessage.localID, returnFocusTo, type: compose.type });
            const composer = Object.values(store.getState().composers.composers).find(
                ({ messageID }) => messageID === modelMessage.localID
            );
            if (composer) {
                focusComposer(composer?.ID);
            }
        }
    });

    return { handleCompose, storageCapacityModal, sendingFromDefaultAddressModal, sendingOriginalMessageModal };
};
