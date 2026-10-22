import { createContext } from 'react';

import type { FloatingEllipsisContextValue } from './hooks/useFloatingEllipsisContext';

export const FloatingEllipsisContext = createContext<FloatingEllipsisContextValue>({
    events: new EventTarget(),
    getDimensions: () => ({ scrollWidth: 0, scrollLeft: 0 }),
});
