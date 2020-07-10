import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { markMessageAsRead, markMessageAsUnread } from 'proton-shared/lib/api/messages';
import { markConversationsAsRead, markConversationsAsUnread } from 'proton-shared/lib/api/conversations';

import { isMessage as testIsMessage } from '../helpers/elements';
import { Element } from '../models/element';

import { useOptimisticMarkAs } from './useOptimisticChange';

export enum MARK_AS_STATUS {
    READ = 'read',
    UNREAD = 'unread'
}

export const useMarkAs = () => {
    const api = useApi();
    const { call } = useEventManager();
    const optimisticMarkAs = useOptimisticMarkAs();

    const markAs = useCallback(async (elements: Element[], labelID = '', status: MARK_AS_STATUS) => {
        if (!elements.length) {
            return;
        }

        const isMessage = testIsMessage(elements[0]);
        const markAsReadAction = isMessage ? markMessageAsRead : markConversationsAsRead;
        const markAsUnreadAction = isMessage ? markMessageAsUnread : markConversationsAsUnread;
        const action = status === MARK_AS_STATUS.READ ? markAsReadAction : markAsUnreadAction;

        const rollback = optimisticMarkAs(elements, labelID, { status });

        try {
            await api(action(elements.map((element) => element.ID)));
        } catch (error) {
            rollback();
            throw error;
        }
        await call();
    }, []);

    return markAs;
};
