import { createContext, useContext } from 'react';

import type { KTContext } from './ktContext';
import { defaultKTContext } from './ktContext';

export const KeyTransparencyContext = createContext<KTContext>(defaultKTContext);
export const useKeyTransparencyContext = () => useContext(KeyTransparencyContext);
