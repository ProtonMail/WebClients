import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useModalTwo } from '@proton/components/components';
import { FeatureCode } from '@proton/components/containers';
import { useApi, useEventManager, useFeature, useFolders, useNotifications } from '@proton/components/hooks';
import { useGetLabels } from '@proton/components/hooks/useCategories';
import { labelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages } from '@proton/shared/lib/api/messages';
import { TelemetryMailSelectAllEvents } from '@proton/shared/lib/api/telemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import MoveSnoozedModal from 'proton-mail/components/list/snooze/components/MoveSnoozedModal';
import MoveScheduledModal from 'proton-mail/components/message/modals/MoveScheduledModal';
import MoveToSpamModal from 'proton-mail/components/message/modals/MoveToSpamModal';
import MoveAllNotificationButton from 'proton-mail/components/notifications/MoveAllNotificationButton';
import UndoActionNotification from 'proton-mail/components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from 'proton-mail/constants';
import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import { isSearch as testIsSearch } from 'proton-mail/helpers/elements';
import { isCustomLabel, isLabel } from 'proton-mail/helpers/labels';
import { extractSearchParameters } from 'proton-mail/helpers/mailboxUrl';
import {
    askToUnsubscribe,
    getNotificationTextMoved,
    getNotificationTextUnauthorized,
    searchForScheduled,
    searchForSnoozed,
} from 'proton-mail/helpers/moveToFolder';
import { MoveParams } from 'proton-mail/hooks/actions/move/useMoveToFolder';
import { useCreateFilters } from 'proton-mail/hooks/actions/useCreateFilters';
import { useMoveAll } from 'proton-mail/hooks/actions/useMoveAll';
import { useOptimisticApplyLabels } from 'proton-mail/hooks/optimistic/useOptimisticApplyLabels';
import { useDeepMemo } from 'proton-mail/hooks/useDeepMemo';
import useMailModel from 'proton-mail/hooks/useMailModel';
import { backendActionFinished, backendActionStarted } from 'proton-mail/logic/elements/elementsActions';
import { pageSize as pageSizeSelector } from 'proton-mail/logic/elements/elementsSelectors';
import { useAppDispatch } from 'proton-mail/logic/store';
import { Element } from 'proton-mail/models/element';
import { SearchParameters } from 'proton-mail/models/tools';

const { TRASH, ARCHIVE, ALMOST_ALL_MAIL: ALMOST_ALL_MAIL_ID, SNOOZED, ALL_MAIL } = MAILBOX_LABEL_IDS;
const MOVE_ALL_FOLDERS = [TRASH, ARCHIVE];

interface MoveSelectionParams extends MoveParams {
    isMessage: boolean;
    authorizedToMove: Element[];
    destinationLabelID: string;
}

/**
 * If you need to use move on an element selection, prefer to use the hook "useMoveToFolder" with selectAll to false or undefined instead.
 */
export const useMoveSelectionToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const location = useLocation();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const getLabels = useGetLabels();
    const [folders = []] = useFolders();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useAppDispatch();
    const { getFilterActions } = useCreateFilters();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const { moveAll, modal: moveAllModal } = useMoveAll();

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);
    const isSearch = testIsSearch(searchParameters);

    const [canUndo, setCanUndo] = useState(true); // Used to not display the Undo button if moving only scheduled messages/conversations to trash

    const [moveScheduledModal, handleShowScheduledModal] = useModalTwo(MoveScheduledModal);
    const [moveSnoozedModal, handleMoveSnoozedModal] = useModalTwo(MoveSnoozedModal);
    const [moveToSpamModal, handleShowSpamModal] = useModalTwo<
        { isMessage: boolean; elements: Element[] },
        { unsubscribe: boolean; remember: boolean }
    >(MoveToSpamModal);

    const pageSize = useSelector(pageSizeSelector);

    const moveSelectionToFolder = useCallback(
        async ({
            elements,
            folderID,
            folderName,
            fromLabelID,
            createFilters = false,
            silent = false,
            askUnsub = true,
            isMessage,
            authorizedToMove,
            destinationLabelID,
        }: MoveSelectionParams) => {
            let undoing = false;
            let spamAction: SPAM_ACTION | undefined = undefined;

            // Open a modal when moving a scheduled message/conversation to trash to inform the user that it will be cancelled
            await searchForScheduled(
                folderID,
                isMessage,
                elements,
                setCanUndo,
                handleShowScheduledModal,
                setContainFocus
            );

            // Open a modal when moving a snoozed message/conversation to trash or archive to inform the user that it will be cancelled
            // We only check if we're in the ALMOST_ALL_MAIL, ALL_MAIL or SNOOZE folder since this is the only place where we have snoozed emails
            if (fromLabelID === ALMOST_ALL_MAIL_ID || fromLabelID === ALL_MAIL || fromLabelID === SNOOZED) {
                await searchForSnoozed(
                    folderID,
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
                    folderID,
                    isMessage,
                    elements,
                    api,
                    handleShowSpamModal,
                    mailSettings
                );
            }

            if (!authorizedToMove.length) {
                createNotification({
                    text: getNotificationTextUnauthorized(folderID, destinationLabelID),
                    type: 'error',
                });
                return;
            }

            const { doCreateFilters, undoCreateFilters } = getFilterActions();

            const labels = (await getLabels()) || [];

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
                        { [folderID]: true },
                        true,
                        [],
                        destinationLabelID
                    );

                    [tokens] = await Promise.all([
                        await runParallelChunkedActions({
                            api,
                            items: elementIDs,
                            chunkSize: mailActionsChunkSize,
                            action: (chunk) => action({ LabelID: folderID, IDs: chunk, SpamAction: spamAction }),
                        }),
                        createFilters ? doCreateFilters(elements, [folderID], true) : undefined,
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
                    folderID,
                    destinationLabelID
                );

                const suggestMoveAll =
                    elements.length === pageSize &&
                    MOVE_ALL_FOLDERS.includes(folderID as MAILBOX_LABEL_IDS) &&
                    !isCustomLabel(fromLabelID, labels) &&
                    !isSearch;

                const handleMoveAll = suggestMoveAll
                    ? () => moveAll(fromLabelID, folderID, TelemetryMailSelectAllEvents.notification_move_to)
                    : undefined;

                const moveAllButton = handleMoveAll ? (
                    <MoveAllNotificationButton
                        onMoveAll={handleMoveAll}
                        isMessage={isMessage}
                        isLabel={isLabel(fromLabelID, labels)}
                    />
                ) : null;

                createNotification({
                    text: (
                        <UndoActionNotification onUndo={canUndo ? () => handleUndo(promise) : undefined}>
                            <span className="text-left">
                                {notificationText}
                                {moveAllButton}
                            </span>
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        [isSearch, pageSize]
    );

    return { moveSelectionToFolder, moveScheduledModal, moveSnoozedModal, moveAllModal, moveToSpamModal };
};
