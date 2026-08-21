import type { Dispatch, SetStateAction } from 'react';
import { createContext } from 'react';

export default createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([] as any);
