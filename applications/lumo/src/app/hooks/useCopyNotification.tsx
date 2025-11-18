import { useCallback } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/components/index';

export const useCopyNotification = (notificationText?: string) => {
    const { createNotification } = useNotifications();

    const showCopyNotification = useCallback(() => {
        createNotification({
            text: notificationText || c('collider_2025:Notification').t`Code copied to clipboard`,
        });
    }, [createNotification]);

    return { showCopyNotification };
};
