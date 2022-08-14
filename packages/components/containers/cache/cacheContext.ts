import { createContext } from 'react';

import { Cache } from '@proton/shared/lib/helpers/cache';

export default createContext<Cache<any, any> | null>(null);
