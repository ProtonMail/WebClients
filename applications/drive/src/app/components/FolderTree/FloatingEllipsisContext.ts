import { createContext } from 'react';

import { FloatingEllipsisContextValue } from './hooks';

export const FloatingEllipsisContext = createContext<FloatingEllipsisContextValue>({
    events: new EventTarget(),
    getDimensions: () => ({ scrollWidth: 0, scrollLeft: 0 }),
});
