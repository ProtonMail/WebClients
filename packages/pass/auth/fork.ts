/* eslint-disable @typescript-eslint/no-throw-literal */
import { pullForkSession, setRefreshCookies as refreshTokens } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, SSO_PATHS } from '@proton/shared/lib/constants';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import type { User as tsUser } from '@proton/shared/lib/interfaces';

import { browserSessionStorage } from '../extension/storage';
import type { StorageData } from '../extension/storage/types';
import type { Api } from '../types';

export const requestFork = async (host: string, type: FORK_TYPE) => {
    const state = encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append('app', APPS.PROTONEXTENSION);
    searchParams.append('state', state);
    searchParams.append('t', type);
    searchParams.append('independent', '1');

    await browserSessionStorage.setItem<StorageData>(`f${state}`, JSON.stringify({}));

    return `${host}${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`;
};

export const consumeFork = async ({
    api,
    state,
    selector,
    keyPassword,
    persistent,
    trusted,
}: {
    api: Api;
    state: string;
    selector: string;
    keyPassword: string;
    persistent: boolean;
    trusted: boolean;
}) => {
    const stateKey = `f${state}`;
    const maybeStoredState = await browserSessionStorage.getItem<StorageData>(stateKey);

    if (!maybeStoredState) {
        throw new Error('Invalid state');
    }
    const { UID, RefreshToken, LocalID } = await api<PullForkResponse>(pullForkSession(selector));

    const { AccessToken: newAccessToken, RefreshToken: newRefreshToken } = await api<RefreshSessionResponse>({
        ...withUIDHeaders(UID, refreshTokens({ RefreshToken })),
    });

    const { User } = await api<{ User: tsUser }>(withAuthHeaders(UID, newAccessToken, getUser()));

    const result = {
        User,
        UID,
        LocalID,
        keyPassword,
        persistent,
        trusted,
        AccessToken: newAccessToken,
        RefreshToken: newRefreshToken,
    };

    return result;
};
