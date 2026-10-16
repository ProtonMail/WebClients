import { useCallback } from 'react';

import { useNotifications } from '@proton/app-context/useNotifications';

import type { WorkerMessageWithSender } from '../../types/messages';
import { WorkerMessageType } from '../../types/messages';
import { useExtensionNotificationEnhancer } from './useExtensionNotificationEnhancer';

export const usePageNotificationHandler = () => {
    const { createNotification } = useNotifications();
    const enhance = useExtensionNotificationEnhancer();

    return useCallback((message: WorkerMessageWithSender) => {
        if (message.type === WorkerMessageType.NOTIFICATION && message.payload.notification.endpoint === 'page') {
            createNotification(enhance(message.payload.notification));
        }
    }, []);
};
