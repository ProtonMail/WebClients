import { useContext } from 'react';
import NotificationsContext from './notificationsContext';

const useNotifications = () => {
    const manager = useContext(NotificationsContext);

    if (!manager) {
        throw new Error('Trying to use uninitialized NotificationsContext');
    }

    return manager;
};

export default useNotifications;
