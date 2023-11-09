import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useApi, useEventManager, useFolders, useLabels, useNotifications } from '@proton/components';
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
import { PAGE_SIZE, SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
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
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { SearchParameters } from '../../models/tools';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { useCreateFilters } from './useCreateFilters';
import { useMoveAll } from './useMoveAll';

const { TRASH, ARCHIVE } = MAILBOX_LABEL_IDS;
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
            const destinationLabelID = isCustomLabel(fromLabelID, labels) ? MAILBOX_LABEL_IDS.INBOX : fromLabelID;

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
            await searchForSnoozed(
                folderID,
                isMessage,
                elements,
                setCanUndo,
                handleMoveSnoozedModal,
                setContainFocus,
                folders
            );

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

            const handleDo = async () => {
                let token;
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

                    const [{ UndoToken }] = await Promise.all([
                        api<{ UndoToken: { Token: string } }>(
                            action({ LabelID: folderID, IDs: elementIDs, SpamAction: spamAction })
                        ),
                        createFilters ? doCreateFilters(elements, [folderID], true) : undefined,
                    ]);

                    // We are not checking ValidUntil since notification stay for few seconds after this action
                    token = UndoToken.Token;
                } catch (error: any) {
                    rollback();
                } finally {
                    dispatch(backendActionFinished());
                    if (!undoing) {
                        start();
                        await call();
                    }
                }
                return token;
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

                const handleUndo = async () => {
                    try {
                        undoing = true;
                        const token = await promise;
                        // Stop the event manager to prevent race conditions
                        stop();
                        rollback();

                        await Promise.all([
                            token !== undefined ? api(undoActions(token)) : undefined,
                            createFilters ? undoCreateFilters() : undefined,
                        ]);
                    } finally {
                        start();
                        await call();
                    }
                };

                const suggestMoveAll =
                    elements.length === PAGE_SIZE &&
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
                        <UndoActionNotification onUndo={canUndo ? handleUndo : undefined}>
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
