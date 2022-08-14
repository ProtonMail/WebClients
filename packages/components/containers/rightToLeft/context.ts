import { Dispatch, SetStateAction, createContext } from 'react';

export default createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([] as any);
