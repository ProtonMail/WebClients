import { createContext } from 'react';

import { NotificationContextProps } from './interfaces';

export default createContext<NotificationContextProps>({ type: 'success' });
