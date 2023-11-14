import { type FC, createContext, useContext, useMemo } from 'react';

import type { AuthStore } from '@proton/pass/lib/auth/store';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import type { Maybe } from '@proton/pass/types';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';

export const AuthStoreContext = createContext<Maybe<AuthStore>>(undefined);

export const AuthStoreProvider: FC = ({ children }) => {
    const authStore = useMemo(() => exposeAuthStore(createAuthStore(createSecureSessionStorage())), []);
    return <AuthStoreContext.Provider value={authStore}>{children}</AuthStoreContext.Provider>;
};

export const useAuthStore = (): AuthStore => {
    const authStore = useContext(AuthStoreContext);
    if (authStore === undefined) throw new Error('authentication store not set');
    return authStore;
};
