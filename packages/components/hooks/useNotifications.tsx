import { useContext } from 'react';
import NotificationsContext from '../containers/notifications/notificationsContext';

const useNotifications = () => {
    const manager = useContext(NotificationsContext);

    if (!manager) {
        throw new Error('Trying to use uninitialized NotificationsContext');
    }

    return manager;
};

export default useNotifications;
