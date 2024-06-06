import type { FC, PropsWithChildren } from 'react';
import { createContext, useContext } from 'react';

import type { AuthStore } from '@proton/pass/lib/auth/store';
import type { MaybeNull } from '@proton/pass/types';

const AuthStoreContext = createContext<MaybeNull<AuthStore>>(null);
export const useAuthStore = () => useContext(AuthStoreContext);

type Props = { store: AuthStore };

export const AuthStoreProvider: FC<PropsWithChildren<Props>> = ({ store, children }) => (
    <AuthStoreContext.Provider value={store}>{children}</AuthStoreContext.Provider>
);
