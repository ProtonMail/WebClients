import { useLayoutEffect } from 'react';

import useNotifications from '@proton/components/hooks/useNotifications';

import { setNotificationsManager } from './notifications.singleton';

export const useSetupNotificationManager = () => {
    const notificationsManager = useNotifications();
    // useLayoutEffect (not useEffect) so the singleton is wired before paint,
    // ahead of any user interaction that could trigger a createNotification call.
    useLayoutEffect(() => {
        setNotificationsManager(notificationsManager);
    }, [notificationsManager]);
};
