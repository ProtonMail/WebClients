import { createContext } from 'react';

import { NotificationOffset, NotificationOptions } from './interfaces';

export default createContext<{ notifications: NotificationOptions[]; offset: NotificationOffset | undefined }>({
    notifications: [],
    offset: undefined,
});
