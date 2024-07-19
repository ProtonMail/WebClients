import { createContext } from 'react';

import type createEventManager from '@proton/shared/lib/eventManager/eventManager';

export default createContext<ReturnType<typeof createEventManager> | null>(null);
