import { createContext } from 'react';
import { NotificationsManager } from './manager';

export type NotificationsContextValue = NotificationsManager;

export default createContext<NotificationsManager>(null as unknown as NotificationsManager);
