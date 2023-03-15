import { createContext, useContext } from 'react';

import { KTContext } from '../interfaces';
import { defaultKTContext } from './defaults';

export const KeyTransparencyContext = createContext<KTContext>(defaultKTContext);
export const useKeyTransparencyContext = () => useContext(KeyTransparencyContext);
