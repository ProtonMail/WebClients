import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { useApi, useEventManager, useFolders, useLabels, useNotifications, useFeature, FeatureCode } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { labelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { SPAM_ACTION } from '@proton/shared/lib/mail/mailSettings';

import MoveSnoozedModal from '../../components/list/snooze/components/MoveSnoozedModal';
import MoveScheduledModal from '../../components/message/modals/MoveScheduledModal';
import MoveToSpamModal from '../../components/message/modals/MoveToSpamModal';
import MoveAllNotificationButton from '../../components/notifications/MoveAllNotificationButton';
import UndoActionNotification from '../../components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
import { isMessage as testIsMessage, isSearch as testIsSearch } from '../../helpers/elements';
import { isCustomLabel, isLabel } from '../../helpers/labels';
import { extractSearchParameters } from '../../helpers/mailboxUrl';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';
import {
    askToUnsubscribe,
    getNotificationTextMoved,
    getNotificationTextUnauthorized,
    searchForScheduled,
    searchForSnoozed,
} from '../../helpers/moveToFolder';
import { useDeepMemo } from '../../hooks/useDeepMemo';
import useMailModel from '../../hooks/useMailModel';
import { getFilteredUndoTokens, runParallelChunkedActions } from '../../helpers/chunk';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { pageSize as pageSizeSelector } from '../../logic/elements/elementsSelectors';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { SearchParameters } from '../../models/tools';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { useCreateFilters } from './useCreateFilters';
import { useMoveAll } from './useMoveAll';

const { TRASH, ARCHIVE, ALMOST_ALL_MAIL: ALMOST_ALL_MAIL_ID, SNOOZED, ALL_MAIL, INBOX } = MAILBOX_LABEL_IDS;
const MOVE_ALL_FOLDERS = [TRASH, ARCHIVE];

export const useMoveToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const location = useLocation();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const mailSettings = useMailModel('MailSettings');
    const dispatch = useAppDispatch();
    const { getFilterActions } = useCreateFilters();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);
    const isSearch = testIsSearch(searchParameters);

    const [canUndo, setCanUndo] = useState(true); // Used to not display the Undo button if moving only scheduled messages/conversations to trash

    const { moveAll, modal: moveAllModal } = useMoveAll();

    const [moveScheduledModal, handleShowScheduledModal] = useModalTwo(MoveScheduledModal);
    const [moveSnoozedModal, handleMoveSnoozedModal] = useModalTwo(MoveSnoozedModal);
    const [moveToSpamModal, handleShowSpamModal] = useModalTwo<
        { isMessage: boolean; elements: Element[] },
        { unsubscribe: boolean; remember: boolean }
    >(MoveToSpamModal);

    const pageSize = useSelector(pageSizeSelector);

    const moveToFolder = useCallback(
        async (
            elements: Element[],
            folderID: string,
            folderName: string,
            fromLabelID: string,
            createFilters: boolean,
            silent = false,
            askUnsub = true
        ) => {
            if (!elements.length) {
                return;
            }

            let undoing = false;
            const isMessage = testIsMessage(elements[0]);
            const destinationLabelID = isCustomLabel(fromLabelID, labels) ? INBOX : fromLabelID;

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

            let spamAction: SPAM_ACTION | undefined = undefined;

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

            const action = isMessage ? labelMessages : labelConversations;
            const authorizedToMove = isMessage
                ? getMessagesAuthorizedToMove(elements as Message[], folderID)
                : elements;
            const elementIDs = authorizedToMove.map((element) => element.ID);

            if (!authorizedToMove.length) {
                createNotification({
                    text: getNotificationTextUnauthorized(folderID, destinationLabelID),
                    type: 'error',
                });
                return;
            }

            const { doCreateFilters, undoCreateFilters } = getFilterActions();

            let rollback = () => {};

            const handleUndo = async (tokens: PromiseSettledResult<string | undefined>[]) => {
                try {
                    undoing = true;

                    // Stop the event manager to prevent race conditions
                    stop();
                    rollback();
                    const filteredTokens = getFilteredUndoTokens(tokens);

                    await Promise.all([
                        ...filteredTokens.map((token) => api({ ...undoActions(token), silence: true })),
                        createFilters ? undoCreateFilters() : undefined,
                    ]);
                } finally {
                    start();
                    await call();
                }
            };

            const handleDo = async () => {
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

                const handleMoveAll = suggestMoveAll ? () => moveAll(fromLabelID, folderID) : undefined;

                const moveAllButton = handleMoveAll ? (
                    <MoveAllNotificationButton
                        onMoveAll={handleMoveAll}
                        isMessage={isMessage}
                        isLabel={isLabel(fromLabelID, labels)}
                    />
                ) : null;

                createNotification({
                    text: (
                        <UndoActionNotification onUndo={canUndo ? async () => handleUndo(await promise) : undefined}>
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
        [labels]
    );

    return { moveToFolder, moveScheduledModal, moveSnoozedModal, moveAllModal, moveToSpamModal };
};
