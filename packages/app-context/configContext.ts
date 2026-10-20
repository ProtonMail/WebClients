import { createContext } from 'react';

import type { ProtonConfig } from '@proton/shared/lib/interfaces/config';

export const ConfigContext = createContext<ProtonConfig>(null as unknown as ProtonConfig);
