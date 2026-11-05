import { createContext } from 'react';

import type { EventLoop } from '@proton/redux-shared-store-types/eventLoop';
import type { EventManager } from '@proton/shared/lib/eventManager/eventManager';

export default createContext<EventManager<EventLoop> | null>(null);
