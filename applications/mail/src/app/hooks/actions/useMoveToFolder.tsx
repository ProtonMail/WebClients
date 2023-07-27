import { Dispatch, SetStateAction, useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useApi, useEventManager, useLabels, useMailSettings, useNotifications } from '@proton/components';
import { useModalTwo } from '@proton/components/components/modalTwo/useModalTwo';
import { labelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { labelMessages } from '@proton/shared/lib/api/messages';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { SpamAction } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { extractSearchParameters } from 'proton-mail/helpers/mailboxUrl';
import { useDeepMemo } from 'proton-mail/hooks/useDeepMemo';
import { SearchParameters } from 'proton-mail/models/tools';

import MoveScheduledModal from '../../components/message/modals/MoveScheduledModal';
import MoveToSpamModal from '../../components/message/modals/MoveToSpamModal';
import MoveAllNotificationButton from '../../components/notifications/MoveAllNotificationButton';
import UndoActionNotification from '../../components/notifications/UndoActionNotification';
import { PAGE_SIZE, SUCCESS_NOTIFICATION_EXPIRATION } from '../../constants';
import { isMessage as testIsMessage, isSearch as testIsSearch } from '../../helpers/elements';
import { isCustomLabel, isLabel } from '../../helpers/labels';
import { getMessagesAuthorizedToMove } from '../../helpers/message/messages';
import {
    askToUnsubscribe,
    getNotificationTextMoved,
    getNotificationTextUnauthorized,
    searchForScheduled,
} from '../../helpers/moveToFolder';
import { backendActionFinished, backendActionStarted } from '../../logic/elements/elementsActions';
import { useAppDispatch } from '../../logic/store';
import { Element } from '../../models/element';
import { useOptimisticApplyLabels } from '../optimistic/useOptimisticApplyLabels';
import { useCreateFilters } from './useCreateFilters';
import { useMoveAll } from './useMoveAll';

const { TRASH } = MAILBOX_LABEL_IDS;

export const useMoveToFolder = (setContainFocus?: Dispatch<SetStateAction<boolean>>) => {
    const api = useApi();
    const location = useLocation();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const [mailSettings] = useMailSettings();
    const dispatch = useAppDispatch();
    const { getFilterActions } = useCreateFilters();

    const searchParameters = useDeepMemo<SearchParameters>(() => extractSearchParameters(location), [location]);
    const isSearch = testIsSearch(searchParameters);

    const [canUndo, setCanUndo] = useState(true); // Used to not display the Undo button if moving only scheduled messages/conversations to trash

    const { moveAll, modal: moveAllModal } = useMoveAll();

    const [moveScheduledModal, handleShowModal] = useModalTwo(MoveScheduledModal);
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
            await searchForScheduled(folderID, isMessage, elements, setCanUndo, handleShowModal, setContainFocus);

            let spamAction: SpamAction | undefined = undefined;

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
                    folderID === TRASH &&
                    !isCustomLabel(fromLabelID, labels) &&
                    !isSearch;

                const handleMoveAll = suggestMoveAll ? () => moveAll(fromLabelID, TRASH) : undefined;

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

    return { moveToFolder, moveScheduledModal, moveAllModal, moveToSpamModal };
};
