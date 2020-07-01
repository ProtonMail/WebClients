import { createContext } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';

export type refreshFn = () => void;

export default createContext<refreshFn>(noop);
