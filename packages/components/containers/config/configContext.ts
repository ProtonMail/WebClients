import { createContext } from 'react';

import type { ProtonConfig } from '@proton/shared/lib/interfaces';

export default createContext<ProtonConfig>(null as unknown as ProtonConfig);
