import { createContext } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';

export type RefreshFn = () => void;

export default createContext<RefreshFn>(noop);
