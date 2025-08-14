import { createContext, useContext } from 'react';

const IsGuestContext = createContext<boolean | null>(null);

export const useIsGuest = () => {
    const context = useContext(IsGuestContext);
    if (context === null) {
        throw new Error('useIsGuest must be used within an IsGuestProvider');
    }
    return context;
};

// Provider component
interface IsGuestProviderProps {
    isGuest: boolean;
    children: React.ReactNode;
}

export const IsGuestProvider = ({ children, isGuest }: IsGuestProviderProps) => {
    return <IsGuestContext.Provider value={isGuest}>{children}</IsGuestContext.Provider>;
};
