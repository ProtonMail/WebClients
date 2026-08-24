import { createContext } from 'react';

import type { NotificationContextProps } from '@proton/app-context/notifications/interfaces';

export default createContext<NotificationContextProps>({ type: 'success' });
