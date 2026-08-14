import { createContext } from 'react';

import type { Api } from '@proton/shared/lib/interfaces';

export const ApiContext = createContext<Api>(undefined as any);
