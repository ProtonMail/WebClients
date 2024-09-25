import { useCallback } from 'react';

import { c, msgid } from 'ttag';

import { useApi, useEventManager, useNotifications } from '@proton/components';
import { FeatureCode, useFeature } from '@proton/features';
import { markConversationsAsRead, markConversationsAsUnread } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { markMessageAsRead, markMessageAsUnread } from '@proton/shared/lib/api/messages';
import { MARK_AS_STATUS } from '@proton/shared/lib/mail/constants';

import { getFilteredUndoTokens, runParallelChunkedActions } from 'proton-mail/helpers/chunk';
import { isElementReminded } from 'proton-mail/helpers/snooze';
import type { MarkAsParams } from 'proton-mail/hooks/actions/markAs/useMarkAs';
import { useMailDispatch } from 'proton-mail/store/hooks';

import UndoActionNotification from '../../../components/notifications/UndoActionNotification';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../../../constants';
import type { Element } from '../../../models/element';
import { backendActionFinished, backendActionStarted } from '../../../store/elements/elementsActions';
import { useOptimisticMarkAs } from '../../optimistic/useOptimisticMarkAs';

const getNotificationTextMarked = (isMessage: boolean, elementsCount: number, status: MARK_AS_STATUS) => {
    if (isMessage) {
        if (elementsCount === 1) {
            return status === MARK_AS_STATUS.READ
                ? c('Success').t`Message marked as read.`
                : c('Success').t`Message marked as unread.`;
        }

        return status === MARK_AS_STATUS.READ
            ? c('Success').ngettext(
                  msgid`${elementsCount} message marked as read.`,
                  `${elementsCount} messages marked as read.`,
                  elementsCount
              )
            : c('Success').ngettext(
                  msgid`${elementsCount} message marked as unread.`,
                  `${elementsCount} messages marked as unread.`,
                  elementsCount
              );
    }

    if (elementsCount === 1) {
        return status === MARK_AS_STATUS.READ
            ? c('Success').t`Conversation marked as read.`
            : c('Success').t`Conversation marked as unread.`;
    }

    return status === MARK_AS_STATUS.READ
        ? c('Success').ngettext(
              msgid`${elementsCount} conversation marked as read.`,
              `${elementsCount} conversations marked as read.`,
              elementsCount
          )
        : c('Success').ngettext(
              msgid`${elementsCount} conversation marked as unread.`,
              `${elementsCount} conversations marked as unread.`,
              elementsCount
          );
};

interface MarkSelectionAsParams extends MarkAsParams {
    isMessage: boolean;
}

/**
 * If you need to use mark as on an element selection, prefer to use the hook "useMarkAs" with selectAll to false or undefined instead.
 */
export const useMarkSelectionAs = () => {
    const api = useApi();
    const { call, start, stop } = useEventManager();
    const optimisticMarkAs = useOptimisticMarkAs();
    const { createNotification } = useNotifications();
    const dispatch = useMailDispatch();
    const mailActionsChunkSize = useFeature(FeatureCode.MailActionsChunkSize).feature?.Value;

    const markAs = useCallback(
        ({ elements, labelID = '', status, silent = true, isMessage }: MarkSelectionAsParams) => {
            const markAsReadAction = isMessage ? markMessageAsRead : markConversationsAsRead;
            const markAsUnreadAction = isMessage ? markMessageAsUnread : markConversationsAsUnread;
            const action = status === MARK_AS_STATUS.READ ? markAsReadAction : markAsUnreadAction;
            const displaySnoozedReminder = status === MARK_AS_STATUS.READ ? false : isElementReminded(elements[0]);

            let rollback: (() => void) | undefined = () => {};

            const handleUndo = async (promiseTokens: Promise<PromiseSettledResult<string | undefined>[]>) => {
                try {
                    let tokens: PromiseSettledResult<string | undefined>[] = [];

                    // Stop the event manager to prevent race conditions
                    stop();
                    rollback?.();

                    if (promiseTokens) {
                        tokens = await promiseTokens;
                        const filteredTokens = getFilteredUndoTokens(tokens);

                        await Promise.all(filteredTokens.map((token) => api({ ...undoActions(token), silence: true })));
                    }
                } finally {
                    start();
                    await call();
                }
            };

            const request = async () => {
                let tokens = [];
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    dispatch(backendActionStarted());
                    rollback = optimisticMarkAs(elements, labelID, {
                        status,
                        displaySnoozedReminder,
                    });

                    tokens = await runParallelChunkedActions({
                        api,
                        items: elements,
                        chunkSize: mailActionsChunkSize,
                        action: (chunk) =>
                            action(
                                chunk.map((element: Element) => element.ID),
                                labelID
                            ),
                    });
                } catch (error: any) {
                    createNotification({
                        text: c('Error').t`Something went wrong. Please try again.`,
                        type: 'error',
                    });

                    await handleUndo(error.data);
                    throw error;
                } finally {
                    dispatch(backendActionFinished());
                    start();
                    // await call();
                }
                return tokens;
            };

            // No await since we are doing optimistic UI here
            const promise = request();

            if (!silent) {
                const notificationText = getNotificationTextMarked(isMessage, elements.length, status);

                createNotification({
                    text: (
                        <UndoActionNotification onUndo={() => handleUndo(promise)}>
                            {notificationText}
                        </UndoActionNotification>
                    ),
                    expiration: SUCCESS_NOTIFICATION_EXPIRATION,
                });
            }
        },
        []
    );

    return markAs;
};
