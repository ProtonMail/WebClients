import React from 'react';
import { c } from 'ttag';
import {
    useHandler,
    useNotifications,
    useModals,
    ConfirmModal,
    Alert,
    useAddresses,
    useAppLink,
    useGetUser
} from 'react-components';
import { getAccountSettingsApp } from 'proton-shared/lib/apps/helper';

import { MessageExtended, PartialMessageExtended } from '../models/message';
import { MESSAGE_ACTIONS } from '../constants';
import { useDraft } from './useDraft';
import { isDirtyAddress } from '../helpers/addresses';
import { useMessageCache, getLocalID } from '../containers/MessageProvider';

export interface ComposeExisting {
    existingDraft: MessageExtended;
}

export interface ComposeNew {
    action: MESSAGE_ACTIONS;
    referenceMessage?: PartialMessageExtended;
}

export type ComposeArgs = ComposeExisting | ComposeNew;

export const getComposeExisting = (composeArgs: ComposeArgs) =>
    (composeArgs as ComposeExisting).existingDraft ? (composeArgs as ComposeExisting) : undefined;

export const getComposeNew = (composeArgs: ComposeArgs) =>
    typeof (composeArgs as ComposeNew).action === 'number' ? (composeArgs as ComposeNew) : undefined;

export const getComposeArgs = (composeArgs: ComposeArgs) => ({
    composeExisting: getComposeExisting(composeArgs),
    composeNew: getComposeNew(composeArgs)
});

export interface OnCompose {
    (args: ComposeArgs): void;
}

export const useCompose = (
    openComposers: string[],
    openComposer: (messageID: string) => void,
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
    const goToApp = useAppLink();

    return useHandler(async (composeArgs: ComposeArgs) => {
        const user = await getUser();

        const activeAddresses = addresses.filter((address) => !isDirtyAddress(address));

        if (activeAddresses.length === 0) {
            createNotification({
                type: 'error',
                text: (
                    <>
                        {c('Error').t`No address with keys available to compose a message.`}
                        <br />
                        {c('Error').t`Contact your organization’s administrator to resolve this.`}
                    </>
                )
            });
            return;
        }

        const spacePercentage = (user.UsedSpace * 100) / user.MaxSpace;

        if (!isNaN(spacePercentage) && spacePercentage >= 100) {
            createModal(
                <ConfirmModal
                    title={c('Title').t`Storage capacity warning`}
                    confirm={c('Action').t`Upgrade`}
                    cancel={c('Action').t`Close`}
                    onConfirm={() => {
                        goToApp('/subscription', getAccountSettingsApp());
                    }}
                >
                    <Alert
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
                text: c('Error').t`Maximum composer reached`
            });
            return;
        }

        const { composeExisting, composeNew } = getComposeArgs(composeArgs);

        if (composeExisting) {
            const { existingDraft } = composeExisting;
            const localID = getLocalID(messageCache, existingDraft.localID);

            const existingMessageID = openComposers.find((id) => id === localID);
            if (existingMessageID) {
                focusComposer(existingMessageID);
                return;
            }

            openComposer(localID);
            focusComposer(localID);
            return;
        }

        if (composeNew) {
            const { action, referenceMessage } = composeNew;
            const newMessageID = await createDraft(action, referenceMessage);
            openComposer(newMessageID);
            focusComposer(newMessageID);
        }
    });
};
