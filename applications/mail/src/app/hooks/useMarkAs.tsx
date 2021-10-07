import React, { useCallback } from 'react';
import { c, msgid } from 'ttag';
import { useApi, useEventManager, useMailSettings, useNotifications } from '@proton/components';
import { useHistory } from 'react-router-dom';
import { markMessageAsRead, markMessageAsUnread } from '@proton/shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from '@proton/shared/lib/api/conversations';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { undoActions } from '@proton/shared/lib/api/mailUndoActions';

import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';
import UndoActionNotification from '../components/notifications/UndoActionNotification';
import { useOptimisticMarkAs } from './optimistic/useOptimisticMarkAs';
import { useSetElementsCache } from './mailbox/useElementsCache';
import { isConversationMode } from '../helpers/mailSettings';
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
    const setElementsCache = useSetElementsCache();
    const [mailSettings] = useMailSettings();
    const history = useHistory();
    const { createNotification } = useNotifications();

    const markAs = useCallback((elements: Element[], labelID = '', status: MARK_AS_STATUS, silent = false) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const markAsReadAction = isMessage ? markMessageAsRead : markConversationsAsRead;
        const markAsUnreadAction = isMessage ? markMessageAsUnread : markConversationsAsUnread;
        const action = status === MARK_AS_STATUS.READ ? markAsReadAction : markAsUnreadAction;
        const rollback = optimisticMarkAs(elements, labelID, { status });

        // When changing the read / unread status of an element
        // We want them to stay on the current filter even if it doesn't match the filter anymore
        // So we manually update the elements cache to mark these ids to bypass the filter logic
        // This will last as long as the cache is not reset (cf useElements shouldResetCache)
        setElementsCache((cache) => {
            const conversationMode = isConversationMode(labelID, mailSettings, history.location);

            const bypassFilter = elements.reduce((acc, element) => {
                const id = (isMessage && conversationMode ? (element as Message).ConversationID : element.ID) || '';
                if (acc.includes(id)) {
                    return acc;
                }
                return [...acc, id];
            }, cache.bypassFilter);

            return { ...cache, bypassFilter };
        });

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
