import { useLayoutEffect } from 'react';

import { useNotifications } from '@proton/components';

import { setNotificationsManager } from './notifications.singleton';

export const NotificationsBridge = () => {
    const manager = useNotifications();
    useLayoutEffect(() => {
        setNotificationsManager(manager);
        return () => setNotificationsManager(null);
    }, [manager]);
    return null;
};
