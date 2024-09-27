import type { Dispatch, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { useModalTwo } from '@proton/components';
import { useApi, useEventManager, useNotifications } from '@proton/components/hooks';
import { FeatureCode, useFeature } from '@proton/features';
import { useGetFolders, useGetLabels } from '@proton/mail';
import { labelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import MoveSnoozedModal from 'proton-mail/components/list/snooze/components/MoveSnoozedModal';
import MoveScheduledModal from 'proton-mail/components/message/modals/MoveScheduledModal';
import MoveToSpamModal from 'proton-mail/components/message/modals/MoveToSpamModal';
import UndoActionNotification from 'proton-mail/components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from 'proton-mail/constants';
import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import { isCustomLabel } from 'proton-mail/helpers/labels';
import {
    askToUnsubscribe,
    getNotificationTextMoved,
    getNotificationTextUnauthorized,
    searchForScheduled,
    searchForSnoozed,
} from 'proton-mail/helpers/moveToFolder';
import type { MoveParams } from 'proton-mail/hooks/actions/move/useMoveToFolder';
import { useCreateFilters } from 'proton-mail/hooks/actions/useCreateFilters';
import { useOptimisticApplyLabels } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';
import useMailModel from 'proton-mail/hooks/useMailModel';
import type { Element } from 'proton-mail/models/element';
import { backendActionFinished, backendActionStarted } from 'proton-mail/store/elements/elementsActions';
import { useMailDispatch } from 'proton-mail/store/hooks';

const { INBOX, ALMOST_ALL_MAIL: ALMOST_ALL_MAIL_ID, SNOOZED, ALL_MAIL } = MAILBOX_LABEL_IDS;

interface MoveSelectionParams extends MoveParams {
    isMessage: boolean;
    authorizedToMove: Element[];
}

/**
 * If you need to use move on an element selection, prefer to use the hook "useMoveToFolder" with selectAll to false or undefined instead.
 */
export const useMoveSelectionToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const getLabels = useGetLabels();
    const getFolders = useGetFolders();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useMailDispatch();
    const { getFilterActions } = useCreateFilters();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const [canUndo, setCanUndo] = useState(true); // Used to not display the Undo button if moving only scheduled messages/conversations to trash

    const [moveScheduledModal, handleShowScheduledModal] = useModalTwo(MoveScheduledModal);
    const [moveSnoozedModal, handleMoveSnoozedModal] = useModalTwo(MoveSnoozedModal);
    const [moveToSpamModal, handleShowSpamModal] = useModalTwo(MoveToSpamModal);

    const moveSelectionToFolder = useCallback(
        async ({
            elements,
            sourceLabelID,
            folderName,
            destinationLabelID,
            createFilters = false,
            silent = false,
            askUnsub = true,
            isMessage,
            authorizedToMove,
        }: MoveSelectionParams) => {
            let undoing = false;
            let spamAction: SPAM_ACTION | undefined = undefined;
            const folders = await getFolders();
            const labels = await getLabels();

            // Open a modal when moving a scheduled message/conversation to trash to inform the user that it will be cancelled
            await searchForScheduled(
                destinationLabelID,
                isMessage,
                elements,
                setCanUndo,
                handleShowScheduledModal,
                setContainFocus
            );

            // Open a modal when moving a snoozed message/conversation to trash or archive to inform the user that it will be cancelled
            // We only check if we're in the ALMOST_ALL_MAIL, ALL_MAIL or SNOOZE folder since this is the only place where we have snoozed emails
            if (sourceLabelID === ALMOST_ALL_MAIL_ID || sourceLabelID === ALL_MAIL || sourceLabelID === SNOOZED) {
                await searchForSnoozed(
                    destinationLabelID,
                    isMessage,
                    elements,
                    setCanUndo,
                    handleMoveSnoozedModal,
                    setContainFocus,
                    folders
                );
            }

            if (askUnsub) {
                // Open a modal when moving items to spam to propose to unsubscribe them
                spamAction = await askToUnsubscribe(
                    destinationLabelID,
                    isMessage,
                    elements,
                    api,
                    handleShowSpamModal,
                    mailSettings
                );
            }

            if (!authorizedToMove.length) {
                createNotification({
                    text: getNotificationTextUnauthorized(destinationLabelID, sourceLabelID),
                    type: 'error',
                });
                return;
            }

            const { doCreateFilters, undoCreateFilters } = getFilterActions();

            let rollback = () => {};

            const handleUndo = async (promiseTokens: Promise<PromiseSettledResult<string | undefined>[]>) => {
                try {
                    let tokens: PromiseSettledResult<string | undefined>[] = [];
                    undoing = true;

                    // Stop the event manager to prevent race conditions
                    stop();
                    rollback();

                    if (promiseTokens) {
                        tokens = await promiseTokens;
                        const filteredTokens = getFilteredUndoTokens(tokens);

                        await Promise.all([
                            ...filteredTokens.map((token) => api({ ...undoActions(token), silence: true })),
                            createFilters ? undoCreateFilters() : undefined,
                        ]);
                    }
                } finally {
                    start();
                    await call();
                }
            };

            const handleDo = async () => {
                const action = isMessage ? labelMessages : labelConversations;
                const elementIDs = authorizedToMove.map((element) => element.ID);

                let tokens: PromiseSettledResult<string | undefined>[] = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    rollback = optimisticApplyLabels(
                        authorizedToMove,
                        { [destinationLabelID]: true },
                        true,
                        [],
                        // We need to pass a "real" folder to perform optimistic on custom labels
                        isCustomLabel(sourceLabelID, labels) ? INBOX : sourceLabelID
                    );

                    [tokens] = await Promise.all([
                        await runParallelChunkedActions({
                            api,
                            items: elementIDs,
                            chunkSize: mailActionsChunkSize,
                            action: (chunk) =>
                                action({ LabelID: destinationLabelID, IDs: chunk, SpamAction: spamAction }),
                        }),
                        createFilters ? doCreateFilters(elements, [destinationLabelID], true) : undefined,
                    ]);
                } catch (error: any) {
                    createNotification({
                        text: c('Error').t`Something went wrong. Please try again.`,
                        type: 'error',
                    });

                    await handleUndo(error.data);
                } finally {
                    dispatch(backendActionFinished());
                    if (!undoing) {
                        start();
                        await call();
                    }
                }
                return tokens;
            };

            // No await ==> optimistic
            const promise = handleDo();

            if (!silent) {
                const notificationText = getNotificationTextMoved(
                    isMessage,
                    authorizedToMove.length,
                    elements.length - authorizedToMove.length,
                    folderName,
                    destinationLabelID,
                    sourceLabelID
                );

                createNotification({
                    text: (
                        <UndoActionNotification onUndo={canUndo ? () => handleUndo(promise) : undefined}>
                            <span className="text-left">{notificationText}</span>
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        []
    );

    return { moveSelectionToFolder, moveScheduledModal, moveSnoozedModal, moveToSpamModal };
};
