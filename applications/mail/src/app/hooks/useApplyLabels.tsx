import { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useNotifications, useEventManager, useLabels, useModals, ConfirmModal } from '@proton/components';
import { labelMessages, unlabelMessages } from '@proton/shared/lib/api/messages';
import { labelConversations, unlabelConversations } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import UndoActionNotification from '../components/notifications/UndoActionNotification';
import { isMessage as testIsMessage } from '../helpers/elements';
import { getMessagesAuthorizedToMove } from '../helpers/message/messages';
import { Element } from '../models/element';
import { useOptimisticApplyLabels } from './optimistic/useOptimisticApplyLabels';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../constants';
import { Conversation } from '../models/conversation';
import { useDispatch } from 'react-redux';
import { backendActionFinished, backendActionStarted } from '../logic/elements/elementsActions';

const { SPAM, TRASH, SCHEDULED, SENT, ALL_SENT, DRAFTS, ALL_DRAFTS, INBOX } = MAILBOX_LABEL_IDS;

const getNotificationTextStarred = (isMessage: boolean, elementsCount: number) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message marked as Starred.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message marked as Starred.`,
            `${elementsCount} messages marked as Starred.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation marked as Starred.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation marked as Starred.`,
        `${elementsCount} conversations marked as Starred.`,
        elementsCount
    );
};

const getNotificationTextRemoved = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message removed from ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message removed from ${labelName}.`,
            `${elementsCount} messages removed from ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation removed from ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation removed from ${labelName}.`,
        `${elementsCount} conversations removed from ${labelName}.`,
        elementsCount
    );
};

const getNotificationTextAdded = (isMessage: boolean, elementsCount: number, labelName: string) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message added to ${labelName}.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} message added to ${labelName}.`,
            `${elementsCount} messages added to ${labelName}.`,
            elementsCount
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation added to ${labelName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation added to ${labelName}.`,
        `${elementsCount} conversations added to ${labelName}.`,
        elementsCount
    );
};

const joinSentences = (success: string, notAuthorized: string) => [success, notAuthorized].filter(isTruthy).join(' ');

const getNotificationTextMoved = (
    isMessage: boolean,
    elementsCount: number,
    messagesNotAuthorizedToMove: number,
    folderName: string,
    folderID?: string,
    fromLabelID?: string
) => {
    const notAuthorized = messagesNotAuthorizedToMove
        ? c('Info').ngettext(
              msgid`${messagesNotAuthorizedToMove} message could not be moved.`,
              `${messagesNotAuthorizedToMove} messages could not be moved.`,
              messagesNotAuthorizedToMove
          )
        : '';
    if (folderID === SPAM) {
        if (isMessage) {
            if (elementsCount === 1) {
                return c('Success').t`Message moved to spam and sender added to Block List.`;
            }
            return joinSentences(
                c('Success').ngettext(
                    msgid`${elementsCount} message moved to spam and sender added to Block List.`,
                    `${elementsCount} messages moved to spam and senders added to Block List.`,
                    elementsCount
                ),
                notAuthorized
            );
        }
        if (elementsCount === 1) {
            return c('Success').t`Conversation moved to spam and sender added to Block List.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} conversation moved to spam and sender added to Block List.`,
            `${elementsCount} conversations moved to spam and senders added to Block List.`,
            elementsCount
        );
    }

    if (fromLabelID === SPAM && folderID !== TRASH) {
        if (isMessage) {
            if (elementsCount === 1) {
                // translator: Strictly 1 message moved from spam, the variable is the name of the destination folder
                return c('Success').t`Message moved to ${folderName} and sender added to Allow List.`;
            }
            return joinSentences(
                c('Success').ngettext(
                    // translator: The first variable is the number of message moved, written in digits, and the second one is the name of the destination folder
                    msgid`${elementsCount} message moved to ${folderName} and sender added to Allow List.`,
                    `${elementsCount} messages moved to ${folderName} and senders added to Allow List.`,
                    elementsCount
                ),
                notAuthorized
            );
        }
        if (elementsCount === 1) {
            return c('Success').t`Conversation moved to ${folderName} and sender added to Allow List.`;
        }
        return c('Success').ngettext(
            msgid`${elementsCount} conversation moved to ${folderName} and sender added to Allow List.`,
            `${elementsCount} conversations moved to ${folderName} and senders added to Allow List.`,
            elementsCount
        );
    }

    if (isMessage) {
        if (elementsCount === 1) {
            return c('Success').t`Message moved to ${folderName}.`;
        }
        return joinSentences(
            c('Success').ngettext(
                msgid`${elementsCount} message moved to ${folderName}.`,
                `${elementsCount} messages moved to ${folderName}.`,
                elementsCount
            ),
            notAuthorized
        );
    }

    if (elementsCount === 1) {
        return c('Success').t`Conversation moved to ${folderName}.`;
    }
    return c('Success').ngettext(
        msgid`${elementsCount} conversation moved to ${folderName}.`,
        `${elementsCount} conversations moved to ${folderName}.`,
        elementsCount
    );
};

export const useApplyLabels = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useDispatch();

    const applyLabels = useCallback(
        async (elements: Element[], changes: { [labelID: string]: boolean }, silent = false) => {
            if (!elements.length) {
                return;
            }

            let undoing = false;

            const isMessage = testIsMessage(elements[0]);
            const labelAction = isMessage ? labelMessages : labelConversations;
            const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
            const changesKeys = Object.keys(changes);
            const elementIDs = elements.map((element) => element.ID);
            const rollbacks = {} as { [labelID: string]: () => void };

            const handleDo = async () => {
                let tokens = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    tokens = await Promise.all(
                        changesKeys.map(async (LabelID) => {
                            rollbacks[LabelID] = optimisticApplyLabels(elements, { [LabelID]: changes[LabelID] });
                            try {
                                const action = changes[LabelID] ? labelAction : unlabelAction;
                                const { UndoToken } = await api(action({ LabelID, IDs: elementIDs }));
                                return UndoToken.Token;
                            } catch (error: any) {
                                rollbacks[LabelID]();
                                throw error;
                            }
                        })
                    );
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

            const handleUndo = async () => {
                try {
                    undoing = true;
                    const tokens = await promise;
                    // Stop the event manager to prevent race conditions
                    stop();
                    Object.values(rollbacks).forEach((rollback) => rollback());
                    const filteredTokens = tokens.filter(isTruthy);
                    await Promise.all(filteredTokens.map((token) => api(undoActions(token))));
                } finally {
                    start();
                    await call();
                }
            };

            let notificationText = c('Success').t`Labels applied.`;

            const elementsCount = elementIDs.length;

            if (changesKeys.length === 1) {
                const labelName = labels.filter((l) => l.ID === changesKeys[0])[0]?.Name;

                if (changesKeys[0] === MAILBOX_LABEL_IDS.STARRED) {
                    notificationText = getNotificationTextStarred(isMessage, elementsCount);
                } else if (!Object.values(changes)[0]) {
                    notificationText = getNotificationTextRemoved(isMessage, elementsCount, labelName);
                } else {
                    notificationText = getNotificationTextAdded(isMessage, elementsCount, labelName);
                }
            }

            if (!silent) {
                createNotification({
                    text: <UndoActionNotification onUndo={handleUndo}>{notificationText}</UndoActionNotification>,
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        [labels]
    );

    return applyLabels;
};

export const useMoveToFolder = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const { createNotification } = useNotifications();
    const [labels = []] = useLabels();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useDispatch();
    const { createModal } = useModals();
    let canUndo = true; // Used to not display the Undo button if moving only scheduled messages/conversations to trash

    /*
     * Opens a modal when finding scheduled messages that are moved to trash.
     * If all selected are scheduled elements, we prevent doing a Undo because trashed scheduled becomes draft.
     * And undoing this action transforms the draft into another draft.
     */
    const searchForScheduled = async (folderID: string, isMessage: boolean, elements: Element[]) => {
        if (folderID === TRASH) {
            let numberOfScheduledMessages;

            if (isMessage) {
                numberOfScheduledMessages = (elements as Message[]).filter((element) =>
                    element.LabelIDs.includes(SCHEDULED)
                ).length;
            } else {
                numberOfScheduledMessages = (elements as Conversation[]).filter((element) =>
                    element.Labels?.some((label) => label.ID === SCHEDULED)
                ).length;
            }

            if (numberOfScheduledMessages > 0 && numberOfScheduledMessages === elements.length) {
                canUndo = false;
            }

            if (!canUndo) {
                const text = isMessage
                    ? c('Info').t`Scheduled send of this message will be cancelled.`
                    : c('Info')
                          .t`This conversation contains a scheduled message. Sending of this message will be cancelled.`;

                await new Promise<void>((resolve, reject) => {
                    createModal(
                        <ConfirmModal
                            onConfirm={resolve}
                            onClose={reject}
                            title={c('Title').t`Moving a scheduled message`}
                            confirm={c('Action').t`OK`}
                            cancel={c('Action').t`Cancel`}
                        >
                            {text}
                        </ConfirmModal>
                    );
                });
            }
        }
    };

    const moveToFolder = useCallback(
        async (elements: Element[], folderID: string, folderName: string, fromLabelID: string, silent = false) => {
            if (!elements.length) {
                return;
            }

            let undoing = false;

            const isMessage = testIsMessage(elements[0]);

            // Open a modal when moving a scheduled message/conversation to trash to inform the user that it will be cancelled
            await searchForScheduled(folderID, isMessage, elements);

            const action = isMessage ? labelMessages : labelConversations;
            const authorizedToMove = isMessage
                ? getMessagesAuthorizedToMove(elements as Message[], folderID)
                : elements;
            const elementIDs = authorizedToMove.map((element) => element.ID);

            const getNotificationText = () => {
                let notificationText = c('Error display when performing invalid move on message')
                    .t`This action cannot be performed`;

                if (fromLabelID === SENT || fromLabelID === ALL_SENT) {
                    if (folderID === INBOX) {
                        notificationText = c('Error display when performing invalid move on message')
                            .t`Sent messages cannot be moved to Inbox`;
                    } else if (folderID === SPAM) {
                        notificationText = c('Error display when performing invalid move on message')
                            .t`Sent messages cannot be moved to Spam`;
                    }
                } else if (fromLabelID === DRAFTS || fromLabelID === ALL_DRAFTS) {
                    if (folderID === INBOX) {
                        notificationText = c('Error display when performing invalid move on message')
                            .t`Drafts cannot be moved to Inbox`;
                    } else if (folderID === SPAM) {
                        notificationText = c('Error display when performing invalid move on message')
                            .t`Drafts cannot be moved to Spam`;
                    }
                }
                return notificationText;
            };

            if (!authorizedToMove.length) {
                createNotification({
                    text: getNotificationText(),
                    type: 'error',
                });
                return;
            }

            let rollback = () => {};

            const handleDo = async () => {
                let token;
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    rollback = optimisticApplyLabels(authorizedToMove, { [folderID]: true }, true, [], fromLabelID);
                    const { UndoToken } = await api(action({ LabelID: folderID, IDs: elementIDs }));
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
                    fromLabelID
                );

                const handleUndo = async () => {
                    try {
                        undoing = true;
                        const token = await promise;
                        // Stop the event manager to prevent race conditions
                        stop();
                        rollback();
                        await api(undoActions(token));
                    } finally {
                        start();
                        await call();
                    }
                };

                createNotification({
                    text: (
                        <UndoActionNotification onUndo={canUndo ? handleUndo : undefined}>
                            {notificationText}
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        [labels]
    );

    return moveToFolder;
};

export const useStar = () => {
    const api = useApi();
    const { call, stop, start } = useEventManager();
    const optimisticApplyLabels = useOptimisticApplyLabels();
    const dispatch = useDispatch();

    const star = useCallback(async (elements: Element[], value: boolean) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const labelAction = isMessage ? labelMessages : labelConversations;
        const unlabelAction = isMessage ? unlabelMessages : unlabelConversations;
        const action = value ? labelAction : unlabelAction;

        let rollback = () => {};

        try {
            // Stop the event manager to prevent race conditions
            stop();
            dispatch(backendActionStarted());
            rollback = optimisticApplyLabels(elements, { [MAILBOX_LABEL_IDS.STARRED]: value });
            await api(action({ LabelID: MAILBOX_LABEL_IDS.STARRED, IDs: elements.map((element) => element.ID) }));
        } catch (error: any) {
            rollback();
            throw error;
        } finally {
            dispatch(backendActionFinished());
            start();
            await call();
        }
    }, []);

    return star;
};
