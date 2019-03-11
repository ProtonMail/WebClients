import { useContext } from 'react';
import NotificationsContext from '../context/notifications';

const useNotifications = () => {
    return useContext(NotificationsContext);
};

export default useNotifications;
