import { createContext, useContext } from 'react';

export const GuestContext = createContext<boolean>(false);

export const useGuestContext = () => useContext(GuestContext);
