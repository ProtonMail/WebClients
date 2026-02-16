import { useEffect } from 'react';

import useNotifications from '@proton/components/hooks/useNotifications';

import { extendStore } from '../../../store/store';

const NotificationManagerInjector = () => {
    const notificationManager = useNotifications();

    useEffect(() => {
        extendStore({ notificationManager });
    }, [notificationManager]);

    return null;
};

export default NotificationManagerInjector;
