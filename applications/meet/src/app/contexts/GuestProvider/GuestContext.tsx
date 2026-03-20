import { createContext, useContext } from 'react';

export const GuestContext = createContext<boolean>(window.location.pathname.includes('guest'));

export const useGuestContext = () => useContext(GuestContext);
