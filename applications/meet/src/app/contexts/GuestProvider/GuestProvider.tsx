import { GuestContext } from './GuestContext';

export const GuestProvider = ({ children, isGuest = false }: { children: React.ReactNode; isGuest?: boolean }) => {
    return <GuestContext.Provider value={isGuest}>{children}</GuestContext.Provider>;
};
