import { Cache } from 'proton-shared/lib/helpers/cache';
import { createContext } from 'react';

export default createContext<Cache<any, any> | null>(null);
