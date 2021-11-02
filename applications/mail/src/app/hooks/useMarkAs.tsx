import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useEventManager, useNotifications } from '@proton/components';
import { markMessageAsRead, markMessageAsUnread } from '@proton/shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from '@proton/shared/lib/api/conversations';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';
import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';
import UndoActionNotification from '../components/notifications/UndoActionNotification';
import { useOptimisticMarkAs } from './optimistic/useOptimisticMarkAs';
import { SUCCESS_NOTIFICATION_EXPIRATION } from '../constants';

export enum MARK_AS_STATUS {
    READ = 'read',
    UNREAD = 'unread',
}

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

export const useMarkAs = () => {
    const api = useApi();
    const { call, start, stop } = useEventManager();
    const optimisticMarkAs = useOptimisticMarkAs();
    const { createNotification } = useNotifications();

    const markAs = useCallback((elements: Element[], labelID = '', status: MARK_AS_STATUS, silent = true) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const markAsReadAction = isMessage ? markMessageAsRead : markConversationsAsRead;
        const markAsUnreadAction = isMessage ? markMessageAsUnread : markConversationsAsUnread;
        const action = status === MARK_AS_STATUS.READ ? markAsReadAction : markAsUnreadAction;
        const rollback = optimisticMarkAs(elements, labelID, { status });

        const request = async () => {
            let token;
            try {
                // Stop the event manager to prevent race conditions
                stop();
                const { UndoToken } = await api(
                    action(
                        elements.map((element) => element.ID),
                        labelID
                    )
                );
                token = UndoToken.Token;
            } catch (error: any) {
                rollback();
                throw error;
            } finally {
                start();
                await call();
            }
            return token;
        };

        // No await since we are doing optimistic UI here
        const promise = request();

        if (!silent) {
            const notificationText = getNotificationTextMarked(isMessage, elements.length, status);

            const handleUndo = async () => {
                try {
                    // Stop the event manager to prevent race conditions
                    stop();
                    rollback();
                    const token = await promise;
                    await api(undoActions(token));
                } finally {
                    start();
                    await call();
                }
            };

            createNotification({
                text: <UndoActionNotification onUndo={handleUndo}>{notificationText}</UndoActionNotification>,
                expiration: SUCCESS_NOTIFICATION_EXPIRATION,
            });
        }
    }, []);

    return markAs;
};
