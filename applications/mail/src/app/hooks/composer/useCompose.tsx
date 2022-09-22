import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import {
    AlertModal,
    ErrorButton,
    Href,
    useAddresses,
    useApi,
    useEventManager,
    useGetUser,
    useHandler,
    useModalState,
    useNotifications,
    useSettingsLink,
} from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { forceSend } from '@proton/shared/lib/api/messages';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { isOutbox, isScheduledSend } from '@proton/shared/lib/mail/messages';

import SendingOriginalMessageModal from '../../components/composer/modals/SendingOriginalMessageModal';
import { MESSAGE_ACTIONS } from '../../constants';
import { isDirtyAddress } from '../../helpers/addresses';
import { openDraft } from '../../logic/messages/draft/messagesDraftActions';
import { MessageState, PartialMessageState } from '../../logic/messages/messagesTypes';
import { useAppDispatch } from '../../logic/store';
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
    (args: ComposeArgs): void;
}

export const useCompose = (
    openComposers: string[],
    openComposer: (messageID: string, returnFocusTo?: HTMLElement) => void,
    focusComposer: (messageID: string) => void,
    maxActiveComposer: number
) => {
    // Avoid useUser for performance issues
    const getUser = useGetUser();
    const [addresses = []] = useAddresses();
    const { createNotification } = useNotifications();
    const dispatch = useAppDispatch();
    const { createDraft, sendingFromDefaultAddressModal } = useDraft();
    const goToSettings = useSettingsLink();
    const api = useApi();
    const { call } = useEventManager();
    const getLocalID = useGetLocalID();
    const getMessage = useGetMessage();

    const [storageCapacityModalProps, setStorageCapacityModalOpen] = useModalState();
    const [sendingOriginalMessageModal, handleSendingOriginalMessage] = useModalTwo(SendingOriginalMessageModal);

    const storageCapacityModal = (
        <AlertModal
            title={c('Title').t`Storage capacity warning`}
            buttons={[
                <ErrorButton onClick={() => goToSettings('/upgrade')}>{c('Action').t`Upgrade`}</ErrorButton>,
                <Button onClick={storageCapacityModalProps.onClose}>{c('Action').t`Close`}</Button>,
            ]}
            {...storageCapacityModalProps}
        >
            {c('Info')
                .t`You have reached 100% of your storage capacity. Consider freeing up some space or upgrading your account with additional storage space to compose new messages.`}
            <br />
            <Href href={getKnowledgeBaseUrl('/increase-storage-space')}>{c('Link').t`Learn more`}</Href>
        </AlertModal>
    );

    const handleCompose = useHandler(async (composeArgs: ComposeArgs) => {
        const user = await getUser();

        const activeAddresses = addresses.filter((address) => !isDirtyAddress(address));

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

        const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;

        if (!Number.isNaN(spacePercentage) && spacePercentage >= 100) {
            setStorageCapacityModalOpen(true);
            return;
        }

        if (openComposers.length >= maxActiveComposer) {
            createNotification({
                type: 'error',
                // translator: maxActiveComposer should never be 1, is fixed to 3 today but can potentially vary from 2 to 5(?) in the future.
                text: c('Error').ngettext(
                    msgid`You cannot open more than ${maxActiveComposer} composer window at a time`,
                    `You cannot open more than ${maxActiveComposer} composer windows at a time`,
                    maxActiveComposer
                ),
            });
            return;
        }

        const compose = getComposeArgs(composeArgs);

        if (compose.type === ComposeTypes.existingDraft) {
            const { existingDraft, fromUndo, returnFocusTo } = compose;
            const localID = getLocalID(existingDraft.localID);

            const existingMessageID = openComposers.find((id) => id === localID);

            if (existingMessageID) {
                focusComposer(existingMessageID);
                return;
            }

            const existingMessage = getMessage(localID);

            if (existingMessage?.draftFlags?.sending && !fromUndo) {
                return;
            }

            dispatch(openDraft({ ID: localID, fromUndo }));

            openComposer(localID, returnFocusTo);
            focusComposer(localID);
            return;
        }

        if (compose.type === ComposeTypes.newMessage) {
            const { action, referenceMessage, returnFocusTo } = compose;
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

            openComposer(newMessageID, returnFocusTo);
            focusComposer(newMessageID);
        }

        if (compose.type === ComposeTypes.fromMessage) {
            const { modelMessage, returnFocusTo } = compose;

            openComposer(modelMessage.localID, returnFocusTo);
            focusComposer(modelMessage.localID);
        }
    });

    return { handleCompose, storageCapacityModal, sendingFromDefaultAddressModal, sendingOriginalMessageModal };
};
