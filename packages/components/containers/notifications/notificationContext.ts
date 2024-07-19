import { createContext } from 'react';

import type { NotificationContextProps } from './interfaces';

export default createContext<NotificationContextProps>({ type: 'success' });
