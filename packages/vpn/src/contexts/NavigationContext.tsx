import { type ReactNode, createContext, useContext, useMemo } from 'react';

import { useB2BAdminSidebarFeature } from '../hooks/useB2BAdminSidebarFeature';

export type B2BAdminNavigation = ReturnType<typeof useB2BAdminSidebarFeature>;

interface NavigationContextValue {
    navigation: B2BAdminNavigation;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
    /** Path prefix forwarded to the navigation routes (e.g. `/u/0/vpn`). */
    prefix?: string;
    children: ReactNode;
}

/**
 * Computes the B2B admin navigation (the full `useB2BAdminSidebarFeature` value),
 * then shares both with its subtree — so neither has to be drilled
 * through props. Descendants read them via `useB2BAdminNavigation`.
 */
export const NavigationProvider = ({ prefix, children }: NavigationProviderProps) => {
    const navigation = useB2BAdminSidebarFeature({ prefix });

    const value = useMemo<NavigationContextValue>(() => ({ navigation }), [navigation]);

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

const useNavigationContext = () => {
    const context = useContext(NavigationContext);
    if (!context) {
        throw new Error('Navigation hooks must be used within a NavigationProvider');
    }
    return context;
};

export const useB2BAdminNavigation = () => useNavigationContext().navigation;
