import { createContext } from 'react';
import createNotificationManager from './manager';

export default createContext<ReturnType<typeof createNotificationManager> | null>(null);
