import { createContext, Dispatch, SetStateAction } from 'react';

export default createContext<[boolean, Dispatch<SetStateAction<boolean>>]>([] as any);

