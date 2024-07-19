import { createContext } from 'react';

import type { Cache } from '@proton/shared/lib/helpers/cache';

export default createContext<Cache<any, any> | null>(null);
