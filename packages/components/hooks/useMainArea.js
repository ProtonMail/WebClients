import { useContext, createContext } from 'react';

export const MainAreaContext = createContext();
export const useMainArea = () => useContext(MainAreaContext);
