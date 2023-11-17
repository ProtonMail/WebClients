import { type PassConfig } from '@proton/pass/hooks/usePassConfig';
import { exposeApi } from '@proton/pass/lib/api/api';
import { createApi } from '@proton/pass/lib/api/factory';
import { createAuthStore, exposeAuthStore } from '@proton/pass/lib/auth/store';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import createSecureSessionStorage from '@proton/shared/lib/authentication/createSecureSessionStorage';
import { APPS } from '@proton/shared/lib/constants';

import * as config from '../app/config';

export const PASS_CONFIG = {
    ...config,
    SSO_URL: getAppHref('/', APPS.PROTONACCOUNT),
} as PassConfig;

export const authStore = exposeAuthStore(createAuthStore(createSecureSessionStorage()));

export const api = exposeApi(
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
    })
);
