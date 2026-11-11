import { createContext } from 'react';

import type { DesktopAppOption } from '../utils/desktopAppDetector';

export const DesktopAppOptionContext = createContext<DesktopAppOption | undefined>(undefined);
