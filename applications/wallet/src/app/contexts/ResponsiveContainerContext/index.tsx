import { createContext, useContext } from 'react';

interface ResponsiveContainerContextValue {
    isNarrow: boolean;
}

/**
 * This context will be used to quickly move to the narrow (mobile-like) UI when needed
 *
 * There are basically 2 cases for now:
 * - viewportwidth is <=medium
 * - context is used with the drawer app (mail integration)
 */
export const ResponsiveContainerContext = createContext<ResponsiveContainerContextValue>({
    isNarrow: false,
});

export const useResponsiveContainerContext = () => useContext(ResponsiveContainerContext);
