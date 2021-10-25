import { c, msgid } from 'ttag';
import {
    useHandler,
    useNotifications,
    useModals,
    ConfirmModal,
    Alert,
    useAddresses,
    useGetUser,
    useApi,
    useSettingsLink,
    useEventManager,
} from '@proton/components';
import { isOutbox, isScheduledSend } from '@proton/shared/lib/mail/messages';
import { forceSend } from '@proton/shared/lib/api/messages';

import { MessageExtended, PartialMessageExtended } from '../../models/message';
import { useDraft } from '../useDraft';
import { isDirtyAddress } from '../../helpers/addresses';
import { useMessageCache, getLocalID, updateMessageCache } from '../../containers/MessageProvider';
import { MESSAGE_ACTIONS } from '../../constants';

export interface ComposeExisting {
    existingDraft: MessageExtended;
    fromUndo: boolean;
}

export interface ComposeNew {
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageExtended;
}

export type ComposeArgs = (ComposeExisting | ComposeNew) & {
    returnFocusTo?: HTMLElement;
};

export const getComposeExisting = (composeArgs: ComposeArgs) =>
    (composeArgs as ComposeExisting).existingDraft ? (composeArgs as ComposeExisting) : undefined;

export const getComposeNew = (composeArgs: ComposeArgs) =>
    typeof (composeArgs as ComposeNew).action === 'number' ? (composeArgs as ComposeNew) : undefined;

export const getComposeArgs = (composeArgs: ComposeArgs) => ({
    composeExisting: getComposeExisting(composeArgs),
    composeNew: getComposeNew(composeArgs),
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
    const { createModal } = useModals();
    const createDraft = useDraft();
    const messageCache = useMessageCache();
    const goToSettings = useSettingsLink();
    const api = useApi();
    const { call } = useEventManager();

    return useHandler(async (composeArgs: ComposeArgs) => {
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
            createModal(
                <ConfirmModal
                    title={c('Title').t`Storage capacity warning`}
                    confirm={c('Action').t`Upgrade`}
                    cancel={c('Action').t`Close`}
                    onConfirm={() => {
                        goToSettings('/dashboard');
                    }}
                >
                    <Alert
                        className="mb1"
                        learnMore="https://protonmail.com/support/knowledge-base/increase-my-storage-space/"
                        type="warning"
                    >{c('Info')
                        .t`You have reached 100% of your storage capacity. Consider freeing up some space or upgrading your account with additional storage space to compose new messages.`}</Alert>
                </ConfirmModal>
            );
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

        const { composeExisting, composeNew, returnFocusTo } = getComposeArgs(composeArgs);

        if (composeExisting) {
            const { existingDraft, fromUndo } = composeExisting;
            const localID = getLocalID(messageCache, existingDraft.localID);

            const existingMessageID = openComposers.find((id) => id === localID);

            if (existingMessageID) {
                focusComposer(existingMessageID);
                return;
            }

            const existingMessage = messageCache.get(localID);

            if (existingMessage?.sending && !fromUndo) {
                return;
            }

            if (existingMessage) {
                // Drafts have a different sanitization as mail content
                // So we have to restart the sanitization process on a cached draft
                updateMessageCache(messageCache, localID, {
                    initialized: undefined,
                    plainText: undefined,
                    document: undefined,
                    openDraftFromUndo: fromUndo,
                    isSentDraft: false,
                    messageImages: undefined,
                });
            } else {
                messageCache.set(localID, {
                    localID,
                    openDraftFromUndo: fromUndo,
                });
            }

            openComposer(localID, returnFocusTo);
            focusComposer(localID);
            return;
        }

        if (composeNew) {
            const { action, referenceMessage } = composeNew;
            const message = referenceMessage?.data;

            if (isOutbox(message)) {
                if (isScheduledSend(message)) {
                    createNotification({ text: c('Error').t`Message needs to be sent first`, type: 'error' });
                    return;
                }

                await new Promise<void>((resolve, reject) => {
                    createModal(
                        <ConfirmModal
                            onConfirm={resolve}
                            onClose={reject}
                            title={c('Title').t`Sending original message`}
                            confirm={c('Action').t`OK`}
                        >
                            <Alert className="mb1">{c('Info')
                                .t`The original message you are trying to forward / reply to is in the process of being sent. If you continue, you will not be able to undo sending of the original message any longer.`}</Alert>
                        </ConfirmModal>
                    );
                });
                await api(forceSend(message?.ID));
                await call();
            }

            const newMessageID = await createDraft(action, referenceMessage);

            openComposer(newMessageID, returnFocusTo);
            focusComposer(newMessageID);
        }
    });
};
