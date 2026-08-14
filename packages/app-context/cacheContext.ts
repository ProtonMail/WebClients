import { createContext } from 'react';

import type { Cache } from '@proton/shared/lib/helpers/cache';

export const CacheContext = createContext<Cache<any, any> | null>(null);
