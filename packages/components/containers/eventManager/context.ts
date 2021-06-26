import { createContext } from 'react';
import createEventManager from 'proton-shared/lib/eventManager/eventManager';

export default createContext<ReturnType<typeof createEventManager> | null>(null);
