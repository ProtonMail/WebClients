import { type FC, createContext, useContext, useMemo } from 'react';

import { usePassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import type { Api, Maybe } from '@proton/pass/types';

import { useAuthStore } from './AuthStoreProvider';

export const ApiContext = createContext<Maybe<Api>>(undefined);

export const useApi = (): Api => {
    const api = useContext(ApiContext);
    if (api === undefined) throw new Error('API was not created');
    return api;
};

export const ApiProvider: FC = ({ children }) => {
    const config = usePassConfig();
    const authStore = useAuthStore();

    const api = useMemo<Api>(
        () =>
            createApi({
                config,
                getAuth: () => {
                    const AccessToken = authStore.getAccessToken();
                    const RefreshToken = authStore.getRefreshToken();
                    const RefreshTime = authStore.getRefreshTime();
                    const UID = authStore.getUID();

                    if (!(UID && AccessToken && RefreshToken)) return undefined;
                    return { UID, AccessToken, RefreshToken, RefreshTime };
                },
            }),
        []
    );

    return <ApiContext.Provider value={exposeApi(api)}>{children}</ApiContext.Provider>;
};
