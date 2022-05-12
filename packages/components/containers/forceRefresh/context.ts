import { createContext } from 'react';
import { noop } from '@proton/util/function';

export type RefreshFn = () => void;

export default createContext<RefreshFn>(noop);
