import { createContext } from 'react';

import type { Notification, NotificationOffset } from '@proton/app-context/notifications/interfaces';

export default createContext<{ notifications: Notification[]; offset: NotificationOffset | undefined }>({
    notifications: [],
    offset: undefined,
});
