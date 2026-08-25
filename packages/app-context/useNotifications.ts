import { useContext } from 'react';

import { NotificationsContext } from './notifications/notificationsContext';

export const useNotifications = () => {
    const manager = useContext(NotificationsContext);

    if (!manager) {
        throw new Error('Trying to use uninitialized NotificationsContext');
    }

    return manager;
};
