import { browserSessionStorage } from '@proton/pass/lib/extension/storage';
import type { Api } from '@proton/pass/types';
import { pullForkSession, setRefreshCookies as refreshTokens } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import type { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import type { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import type { User as tsUser } from '@proton/shared/lib/interfaces';

import type { ExtensionSession } from './session';

/* FIXME: update to `APPS.PROTONPASSBROWSEREXTENSION` */
export const requestFork = async (host: string, type?: FORK_TYPE) => {
    const state = encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append('app', APPS.PROTONEXTENSION);
    searchParams.append('state', state);
    searchParams.append('independent', '0');
    if (type) searchParams.append('t', type);

    await browserSessionStorage.setItem(`f${state}`, JSON.stringify({}));

    return `${host}${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`;
};

type ConsumeForkOptions = {
    api: Api;
    apiUrl?: string;
    state: string;
    selector: string;
    keyPassword: string;
};

export const consumeFork = async ({
    api,
    apiUrl,
    selector,
    keyPassword,
}: ConsumeForkOptions): Promise<ExtensionSession> => {
    const pullForkParams = pullForkSession(selector);
    pullForkParams.url = apiUrl ? `${apiUrl}/${pullForkParams.url}` : pullForkParams.url;

    const { UID, RefreshToken } = await api<PullForkResponse>(pullForkParams);
    const refresh = await api<RefreshSessionResponse>(withUIDHeaders(UID, refreshTokens({ RefreshToken })));
    const { User } = await api<{ User: tsUser }>(withAuthHeaders(UID, refresh.AccessToken, getUser()));

    return {
        AccessToken: refresh.AccessToken,
        keyPassword,
        RefreshToken: refresh.RefreshToken,
        UID,
        UserID: User.ID,
    };
};
