import { c } from 'ttag';

import { browserSessionStorage } from '@proton/pass/lib/extension/storage';
import type { Api } from '@proton/pass/types';
import { pullForkSession, setRefreshCookies as refreshTokens } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import type { FORK_TYPE } from '@proton/shared/lib/authentication/ForkInterface';
import type { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { APPS, MAIL_APP_NAME, PASS_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import type { User } from '@proton/shared/lib/interfaces';

import type { AuthSession } from './session';

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

export const consumeFork = async ({ api, apiUrl, selector, keyPassword }: ConsumeForkOptions): Promise<AuthSession> => {
    const pullForkParams = pullForkSession(selector);
    pullForkParams.url = apiUrl ? `${apiUrl}/${pullForkParams.url}` : pullForkParams.url;

    const { UID, RefreshToken } = await api<PullForkResponse>(pullForkParams);
    const refresh = await api<RefreshSessionResponse>(withUIDHeaders(UID, refreshTokens({ RefreshToken })));
    const { User } = await api<{ User: User }>(withAuthHeaders(UID, refresh.AccessToken, getUser()));

    return {
        AccessToken: refresh.AccessToken,
        keyPassword,
        RefreshToken: refresh.RefreshToken,
        UID,
        UserID: User.ID,
    };
};

export enum AccountForkResponse {
    CONFLICT,
    SUCCESS,
    ERROR,
}

export const getAccountForkResponsePayload = (type: AccountForkResponse, error?: any) => {
    const additionalMessage = error?.message ?? '';

    const payload = (() => {
        switch (type) {
            case AccountForkResponse.CONFLICT: {
                return {
                    title: c('Error').t`Authentication error`,
                    message: c('Info')
                        .t`It seems you are already logged in to ${PASS_APP_NAME}. If you're trying to login with a different account, please logout from the extension first.`,
                };
            }
            case AccountForkResponse.SUCCESS: {
                return {
                    title: c('Title').t`Welcome to ${PASS_APP_NAME}`,
                    message: c('Info')
                        .t`More than a password manager, ${PASS_APP_NAME} protects your password and your personal email address via email aliases. Powered by the same technology behind ${MAIL_APP_NAME}, your data is end to end encrypted and is only accessible by you.`,
                };
            }
            case AccountForkResponse.ERROR: {
                return {
                    title: c('Error').t`Something went wrong`,
                    message: c('Warning').t`Unable to sign in to ${PASS_APP_NAME}. ${additionalMessage}`,
                };
            }
        }
    })();

    return { payload };
};
