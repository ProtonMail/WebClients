import { createContext, useContext } from 'react';

import { KTContext, defaultKTContext } from './ktContext';

export const KeyTransparencyContext = createContext<KTContext>(defaultKTContext);
export const useKeyTransparencyContext = () => useContext(KeyTransparencyContext);
