import { createContext } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

export default createContext<Api>(undefined as any);
