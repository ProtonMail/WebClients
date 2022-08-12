import { createContext } from 'react';

import noop from '@proton/utils/noop';

export type RefreshFn = () => void;

export default createContext<RefreshFn>(noop);
