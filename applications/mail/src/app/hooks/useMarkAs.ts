import { useCallback } from 'react';
import { useApi, useEventManager, useMailSettings } from 'react-components';
import { useHistory } from 'react-router-dom';
import { markMessageAsRead, markMessageAsUnread } from 'proton-shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from 'proton-shared/lib/api/conversations';

import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';

import { useOptimisticMarkAs } from './optimistic/useOptimisticMarkAs';
import { useSetElementsCache } from './mailbox/useElementsCache';
import { isConversationMode } from '../helpers/mailSettings';

export enum MARK_AS_STATUS {
    READ = 'read',
    UNREAD = 'unread',
}

export const useMarkAs = () => {
    const api = useApi();
    const { call } = useEventManager();
    const optimisticMarkAs = useOptimisticMarkAs();
    const setElementsCache = useSetElementsCache();
    const [mailSettings] = useMailSettings();
    const history = useHistory();

    const markAs = useCallback((elements: Element[], labelID = '', status: MARK_AS_STATUS) => {
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
            try {
                await api(
                    action(
                        elements.map((element) => element.ID),
                        labelID
                    )
                );
            } catch (error) {
                rollback();
                throw error;
            }
            await call();
        };

        // No await since we are doing optimistic UI here
        void request();
    }, []);

    return markAs;
};
