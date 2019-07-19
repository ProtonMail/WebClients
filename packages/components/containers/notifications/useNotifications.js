import { useContext } from 'react';

import NotificationsContext from './notificationsContext';

const useNotifications = () => {
    return useContext(NotificationsContext);
};

export default useNotifications;
