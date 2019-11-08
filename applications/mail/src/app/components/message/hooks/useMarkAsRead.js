import { useCallback } from 'react';
import { useApi, useEventManager } from 'react-components';
import { markMessageAsRead } from 'proton-shared/lib/api/messages';

export const useMarkAsRead = () => {
    const api = useApi();
    const { call } = useEventManager();

    return useCallback(async ({ data: message }) => {
        const markAsRead = async () => {
            await api(markMessageAsRead([message.ID]));
            await call();
        };

        if (message.Unread) {
            markAsRead(); // No await to not slow down the UX
            return { data: { ...message, Unread: false } };
        }
    });
};
