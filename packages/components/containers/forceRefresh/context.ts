import { createContext } from 'react';
import noop from '@proton/util/noop';

export type RefreshFn = () => void;

export default createContext<RefreshFn>(noop);
