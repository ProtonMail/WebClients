import { createContext } from 'react';
import { NotificationsManager } from './manager';

export default createContext<NotificationsManager>(null as unknown as NotificationsManager);
