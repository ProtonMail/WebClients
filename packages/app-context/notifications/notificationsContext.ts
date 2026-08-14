import { createContext } from 'react';

import type { NotificationsManager } from './manager';

export type NotificationsContextValue = NotificationsManager;

export const NotificationsContext = createContext<NotificationsManager>(null as unknown as NotificationsManager);
