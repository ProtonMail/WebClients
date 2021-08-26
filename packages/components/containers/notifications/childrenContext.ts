import { createContext } from 'react';
import { NotificationOptions } from './interfaces';

export default createContext<NotificationOptions[]>([]);
