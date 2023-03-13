import { createContext } from 'react';

import { Notification, NotificationOffset } from './interfaces';

export default createContext<{ notifications: Notification[]; offset: NotificationOffset | undefined }>({
    notifications: [],
    offset: undefined,
});
