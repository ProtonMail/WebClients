import { c } from 'ttag';

import { ARGON2_PARAMS } from '@proton/crypto/lib';
import { type Api, AuthMode, type MaybeNull } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { pullForkSession, setRefreshCookies as refreshTokens, setCookies } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { getKey } from '@proton/shared/lib/authentication/cryptoHelper';
import { InvalidForkConsumeError } from '@proton/shared/lib/authentication/error';
import { getForkDecryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import { ForkSearchParameters, type ForkType } from '@proton/shared/lib/authentication/fork/constants';
import { getValidatedForkType, getValidatedRawKey } from '@proton/shared/lib/authentication/fork/validation';
import type { PullForkResponse, RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, MAIL_APP_NAME, PASS_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { withAuthHeaders, withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { encodeBase64URL, uint8ArrayToString } from '@proton/shared/lib/helpers/encoding';
import type { User } from '@proton/shared/lib/interfaces';
import getRandomString from '@proton/utils/getRandomString';

import { AUTH_MODE } from './flags';
import { LockMode } from './lock/types';
import { type AuthSession, type AuthSessionVersion, SESSION_VERSION } from './session';
import { encodeUserData } from './store';

export type RequestForkOptions = {
    app: APP_NAMES;
    host?: string;
    localID?: number;
    forkType?: ForkType;
    prompt?: 'login';
    payloadType?: 'offline';
    payloadVersion?: AuthSessionVersion;
};
export type RequestForkResult = { state: string; url: string };

export const requestFork = ({
    app,
    host = getAppHref('/', APPS.PROTONACCOUNT),
    localID,
    forkType,
    prompt = 'login',
    payloadType = 'offline',
    payloadVersion,
}: RequestForkOptions): RequestForkResult => {
    const state = encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));

    const searchParams = new URLSearchParams();
    searchParams.append(ForkSearchParameters.App, app);
    searchParams.append(ForkSearchParameters.State, state);
    searchParams.append(ForkSearchParameters.Independent, '0');
    if (prompt === 'login') {
        searchParams.append(ForkSearchParameters.Prompt, 'login'); /* force re-auth */
        searchParams.append(ForkSearchParameters.PromptType, 'offline'); /* compute offline params */
    }
    if (payloadType === 'offline') {
        searchParams.append(ForkSearchParameters.PayloadType, payloadType); /* offline payload */
    }
    if (payloadVersion === 2) searchParams.append(ForkSearchParameters.PayloadVersion, `${payloadVersion}`);
    if (localID !== undefined) searchParams.append(ForkSearchParameters.LocalID, `${localID}`);
    if (forkType) searchParams.append(ForkSearchParameters.ForkType, forkType);

    return { url: `${host}${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`, state };
};

export type ConsumeForkParameters = ReturnType<typeof getConsumeForkParameters>;
export type ConsumeForkOptions = { api: Api; apiUrl?: string; payload: ConsumeForkPayload };
export type ConsumeForkPayload =
    | {
          mode: 'sso';
          localState: MaybeNull<string>;
          state: string;
          selector: string;
          key?: Uint8Array;
          persistent: boolean;
          payloadVersion: AuthSessionVersion;
      }
    | {
          mode: 'secure';
          state: string;
          selector: string;
          keyPassword: string;
          persistent: boolean;
          /** FIXME: support passing offline key components
           * when consuming a "secure" extension fork */
      };

/**
 * If `keyPassword` is not provided to `ConsumeForkOptions`, it will attempt to recover it from
 * the `Payload` property of the `PullForkResponse`. `keyPassword` will always be omitted when
 * retrieving the fork options from the url parameters. This is not the case when using secure
 * extension messaging where `keyPassword` can safely be passed.
 * ⚠️ Only validates the fork state in SSO mode.
 */
export const consumeFork = async (options: ConsumeForkOptions): Promise<{ session: AuthSession; Scopes: string[] }> => {
    const { payload, apiUrl, api } = options;
    const cookies = AUTH_MODE === AuthMode.COOKIE;

    const validFork =
        (payload.mode === 'secure' || (payload.localState !== null && payload.key)) &&
        payload.selector &&
        payload.state;

    if (!validFork) throw new InvalidForkConsumeError(`Invalid fork state`);

    const pullForkParams = pullForkSession(payload.selector);
    pullForkParams.url = apiUrl ? `${apiUrl}/${pullForkParams.url}` : pullForkParams.url;

    const { UID, RefreshToken, LocalID, Payload, Scopes } = await api<PullForkResponse>(pullForkParams);
    const refresh = await api<RefreshSessionResponse>(withUIDHeaders(UID, refreshTokens({ RefreshToken })));
    const { User } = await api<{ User: User }>(withAuthHeaders(UID, refresh.AccessToken, getUser()));

    if (cookies) {
        await api(
            withAuthHeaders(
                UID,
                refresh.AccessToken,
                setCookies({
                    UID,
                    RefreshToken: refresh.RefreshToken,
                    State: getRandomString(24),
                    Persistent: options.payload.persistent,
                })
            )
        );
    }

    const data =
        payload.mode === 'secure'
            ? { keyPassword: payload.keyPassword, payloadVersion: SESSION_VERSION }
            : await (async () => {
                  try {
                      const { payloadVersion, key } = payload;
                      const clientKey = await getKey(key!);
                      const decryptedBlob = await getForkDecryptedBlob(clientKey, Payload, payloadVersion);
                      if (!decryptedBlob?.keyPassword) throw new Error('Missing `keyPassword`');

                      return {
                          keyPassword: decryptedBlob.keyPassword,
                          payloadVersion,
                          ...(decryptedBlob.type === 'offline'
                              ? {
                                    offlineConfig: {
                                        salt: atob(decryptedBlob.offlineKeySalt),
                                        params: ARGON2_PARAMS.RECOMMENDED,
                                    },
                                    offlineKD: atob(decryptedBlob.offlineKeyPassword),
                                }
                              : {}),
                      };
                  } catch (err) {
                      throw new InvalidForkConsumeError(getErrorMessage(err));
                  }
              })();

    const session: AuthSession = {
        ...data,
        UID,
        LocalID,
        UserID: User.ID,
        userData: encodeUserData(User.Email, User.DisplayName),
        lastUsedAt: getEpoch(),
        AccessToken: cookies ? '' : refresh.AccessToken,
        RefreshToken: cookies ? '' : refresh.RefreshToken,
        lockMode: LockMode.NONE,
        persistent: payload.persistent,
        cookies,
    };

    return { session, Scopes };
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
                    title: getWelcomeToText(PASS_APP_NAME),
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

export const getConsumeForkParameters = () => {
    const sliceIndex = window.location.hash.lastIndexOf('#') + 1;
    const hashParams = new URLSearchParams(window.location.hash.slice(sliceIndex));
    const selector = hashParams.get(ForkSearchParameters.Selector) || '';
    const state = hashParams.get(ForkSearchParameters.State) || '';
    const base64StringKey = hashParams.get(ForkSearchParameters.Base64Key) || '';
    const type = hashParams.get(ForkSearchParameters.ForkType) || '';
    const persistent = hashParams.get(ForkSearchParameters.Persistent) || '';
    const trusted = hashParams.get(ForkSearchParameters.Trusted) || '';
    const payloadVersion = hashParams.get(ForkSearchParameters.PayloadVersion) || '';
    const payloadType = hashParams.get(ForkSearchParameters.PayloadType) || '';

    return {
        state: state.slice(0, 100),
        selector,
        key: base64StringKey.length ? getValidatedRawKey(base64StringKey) : undefined,
        type: getValidatedForkType(type),
        persistent: persistent === '1',
        trusted: trusted === '1',
        payloadVersion: payloadVersion === '2' ? 2 : 1,
        payloadType: payloadType === 'offline' ? payloadType : 'default',
    } as const;
};
