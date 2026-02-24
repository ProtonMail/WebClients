import {createContext, type ReactNode, useContext} from 'react';

import {useUser} from '@proton/account/user/hooks';
import type {User} from '@proton/shared/lib/interfaces';

import {useIsGuest} from '../providers/IsGuestProvider';

const SafeUserContext = createContext<User | undefined>(undefined);

/**
 * Authenticated-only provider - calls useUser() hook
 * Requires UserProvider to be present in the tree above (from StandardPrivateApp)
 */
const AuthenticatedSafeUserProvider = ({ children }: { children: ReactNode }) => {
    const [user] = useUser();
    return <SafeUserContext.Provider value={user}>{children}</SafeUserContext.Provider>;
};

/**
 * SafeUserProvider provides user data for both authenticated and guest users.
 *
 * Architecture:
 * - Auth routes: StandardPrivateApp → UserProvider → SafeUserProvider(auth)
 * - Guest routes: BasePublicApp → SafeUserProvider(guest)
 *
 * Why separate providers?
 * - Calling useUser() for guests causes 401 errors
 * - Conditional hook calls violate Rules of Hooks
 * - This pattern is the cleanest solution that satisfies both constraints
 */
export function SafeUserProvider({ children }: { children: ReactNode }) {
    const isGuest = useIsGuest();

    // Guest: return undefined directly (no hooks, no API calls)
    if (isGuest) {
        return <SafeUserContext.Provider value={undefined}>{children}</SafeUserContext.Provider>;
    }

    // Auth: delegate to sub-provider that calls useUser()
    return <AuthenticatedSafeUserProvider>{children}</AuthenticatedSafeUserProvider>;
}

/**
 * Hook to safely access user data.
 * Returns undefined for guest users, User object for authenticated users.
 */
export function useSafeUser(): User | undefined {
    // Note: We don't throw here because undefined is a valid value (guest mode)
    // If SafeUserProvider is missing, context will be undefined, which is the same as guest mode
    return useContext(SafeUserContext);
}
