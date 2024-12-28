import type { PropsWithChildren } from 'react';
import { type FC, createContext, useMemo } from 'react';
import { useRouteMatch } from 'react-router-dom';

import { createUseContext } from '@proton/pass/hooks/useContextFactory';
import type { MaybeNull } from '@proton/pass/types';

import { getItemRoute, getLocalPath, getMonitorRoute, getOnboardingRoute, getTrashRoute } from './routing';

export type NavigationMatchesContextValue = {
    /** Flag indicating whether we are currently on an item list page  */
    matchItemList: boolean;
    /** Flag indicating whether we are currently on the onboarding route */
    matchOnboarding: boolean;
    /** Flag indicating whether we are currently on any monitor route */
    matchMonitor: boolean;
    /** Flag indicating whether we are currently on a trash route */
    matchTrash: boolean;
};

const NavigationMatchesContext = createContext<MaybeNull<NavigationMatchesContextValue>>(null);

export const NavigationMatches: FC<PropsWithChildren> = ({ children }) => {
    const matchTrash = useRouteMatch(getTrashRoute()) !== null;
    const matchOnboarding = useRouteMatch(getOnboardingRoute()) !== null;
    const matchMonitor = useRouteMatch(getMonitorRoute()) !== null;
    const matchRootExact = useRouteMatch({ exact: true, path: getLocalPath() }) !== null;

    const itemRoute = getItemRoute(':shareId', ':itemId', { trashed: matchTrash });
    const matchItemExact = useRouteMatch({ exact: true, path: itemRoute }) !== null;
    const matchItemList = matchRootExact || matchItemExact || matchTrash;

    return (
        <NavigationMatchesContext.Provider
            value={useMemo<NavigationMatchesContextValue>(
                () => ({
                    matchItemList,
                    matchOnboarding,
                    matchMonitor,
                    matchTrash,
                }),
                [matchItemList, matchOnboarding, matchMonitor, matchTrash]
            )}
        >
            {children}
        </NavigationMatchesContext.Provider>
    );
};

export const useNavigationMatches = createUseContext(NavigationMatchesContext);
