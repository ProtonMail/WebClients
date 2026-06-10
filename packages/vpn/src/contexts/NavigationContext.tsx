import type { ReactNode, RefObject } from 'react';
import { createContext, useContext, useMemo, useRef } from 'react';

import { useB2BAdminSidebarFeature } from '../hooks/useB2BAdminSidebarFeature';

export type B2BAdminNavigation = ReturnType<typeof useB2BAdminSidebarFeature>;

interface NavigationContextValue {
    navigation: B2BAdminNavigation;
    navigationRef: RefObject<HTMLDivElement>;
}

const NavigationContext = createContext<NavigationContextValue | undefined>(undefined);

interface NavigationProviderProps {
    /** Path prefix forwarded to the navigation routes (e.g. `/u/0/vpn`). */
    prefix?: string;
    children: ReactNode;
}

/**
 * Computes the B2B admin navigation (the full `useB2BAdminSidebarFeature` value) and owns
 * the navigation DOM ref, then shares both with its subtree — so neither has to be drilled
 * through props. Descendants read them via `useB2BAdminNavigation` / `useNavigationRef`.
 *
 * The ref lives here (not redux) because a DOM ref isn't serializable, and the feature
 * value carries functions for the same reason.
 */
export const NavigationProvider = ({ prefix, children }: NavigationProviderProps) => {
    const navigationRef = useRef<HTMLDivElement>(null);
    const navigation = useB2BAdminSidebarFeature({ prefix, navigationRef });

    const value = useMemo<NavigationContextValue>(() => ({ navigation, navigationRef }), [navigation]);

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

export const useNavigationRef = () => useNavigationContext().navigationRef;
