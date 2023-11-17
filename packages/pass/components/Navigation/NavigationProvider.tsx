import { type FC, createContext, useContext, useMemo } from 'react';

import noop from '@proton/utils/noop';

type NavigationContextValue = {
    /** defines how this client handles external links.
     * In extension, this will leverage the `browser.tabs` API
     * whereas in the web-app, we can use `window.location` */
    onLink: (url: string) => void;
};

type NavigationProviderProps = Pick<NavigationContextValue, 'onLink'>;

const NavigationContext = createContext<NavigationContextValue>({ onLink: noop });

export const NavigationProvider: FC<NavigationProviderProps> = ({ onLink, children }) => {
    const context = useMemo<NavigationContextValue>(() => ({ onLink }), []);
    return <NavigationContext.Provider value={context}>{children}</NavigationContext.Provider>;
};

export const useNavigation = () => useContext(NavigationContext);
