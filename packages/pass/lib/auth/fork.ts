import { c } from 'ttag';

import { ARGON2_PARAMS } from '@proton/crypto/lib';
import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import type { ReauthActionPayload } from '@proton/pass/lib/auth/reauth';
import type { TabId } from '@proton/pass/types';
import { type Api, AuthMode, type MaybeNull } from '@proton/pass/types';
import { getErrorMessage } from '@proton/pass/utils/errors/get-error-message';
import { isObject } from '@proton/pass/utils/object/is-object';
import { getEpoch } from '@proton/pass/utils/time/epoch';
import { pullForkSession, setRefreshCookies as refreshTokens, setCookies } from '@proton/shared/lib/api/auth';
import { getUser } from '@proton/shared/lib/api/user';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getWelcomeToText } from '@proton/shared/lib/apps/text';
import { InvalidForkConsumeError } from '@proton/shared/lib/authentication/error';
import type { ForkEncryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import { getForkDecryptedBlob } from '@proton/shared/lib/authentication/fork/blob';
import {
    ExtraSessionForkSearchParameters,
    ForkSearchParameters,
    type ForkType,
} from '@proton/shared/lib/authentication/fork/constants';
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
    email?: string;
    forkType?: ForkType;
    host?: string;
    localID?: number;
    payloadType?: 'offline' | 'default';
    payloadVersion?: AuthSessionVersion;
    plan?: string;
    prompt?: 'login';
    promptBypass?: 'none' | 'sso';
    promptType?: 'default' | 'offline' | 'offline-bypass';
};

export type RequestForkResult = {
    state: string;
    url: string;
};

export type RequestForkData = {
    type: 'reauth';
    /** LocalID which initiated the re-auth fork in Pass */
    localID?: number;
    /** UserID which initiated the re-auth fork. Compare against
     * the `PullForkResponse` in order to validate */
    userID?: string;
    /** Action that should be resumed upon successful re-auth */
    reauth: ReauthActionPayload;
};

export const getStateKey = (state: string) => `f${state}`;
export const generateForkState = () => encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));

/** Will compute offline params by default. Only allows by-pass for web.
 * Extension does not support password locking yet, as such force re-auth. */
export const requestFork = ({
    app,
    email,
    host = getAppHref('/', APPS.PROTONACCOUNT),
    forkType,
    localID,
    payloadType = 'offline',
    payloadVersion,
    plan,
    /** `login` prompt will force re-auth if no by-pass is set-up */
    prompt = 'login',
    /** Default behaviour will by pass re-auth for SSO on login.
     * When doing an in-app SSO re-auth check (ie: before triggering
     * a data export), pass `none` to force re-auth. */
    promptBypass = 'sso',
    promptType = 'offline',
}: RequestForkOptions): RequestForkResult => {
    const searchParams = new URLSearchParams();
    const state = generateForkState();

    searchParams.append(ForkSearchParameters.App, app);
    searchParams.append(ForkSearchParameters.State, state);
    searchParams.append(ForkSearchParameters.Independent, '0');

    if (prompt === 'login') {
        searchParams.append(ForkSearchParameters.Prompt, 'login');
        searchParams.append(ForkSearchParameters.PromptBypass, promptBypass);
        searchParams.append(ForkSearchParameters.PromptType, promptType);
    }

    if (payloadType) searchParams.append(ForkSearchParameters.PayloadType, payloadType);
    if (payloadVersion === 2) searchParams.append(ForkSearchParameters.PayloadVersion, `${payloadVersion}`);
    if (localID !== undefined) searchParams.append(ForkSearchParameters.LocalID, `${localID}`);
    if (localID === undefined && email) searchParams.append(ExtraSessionForkSearchParameters.Email, email);
    if (forkType) searchParams.append(ForkSearchParameters.ForkType, forkType);
    if (plan !== undefined) searchParams.append(ForkSearchParameters.Plan, plan);

    return { state, url: `${host}${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}` };
};

export type PullForkCall = (payload: ConsumeForkPayload) => Promise<PullForkResponse>;
export type ConsumedFork = { session: AuthSession; Scopes: string[] };
export type ConsumeForkParameters = ReturnType<typeof getConsumeForkParameters>;

export type ConsumeForkOptions = {
    apiUrl?: string;
    payload: ConsumeForkPayload;
    api: Api;
    pullFork?: PullForkCall;
};

export type ConsumeForkPayload =
    | {
          key?: Uint8Array<ArrayBuffer>;
          localState: MaybeNull<string>;
          mode: 'web';
          payloadVersion: AuthSessionVersion;
          persistent: boolean;
          selector: string;
          state: string;
      }
    | {
          keyPassword: string;
          localState: MaybeNull<string>;
          mode: 'extension';
          persistent: boolean;
          selector: string;
          state: string;
          tabId: TabId;
      };

export const pullFork = async (options: ConsumeForkOptions): Promise<PullForkResponse> => {
    const { payload, apiUrl, api } = options;

    const validFork =
        (payload.mode === 'extension' || (payload.localState !== null && payload.key)) &&
        payload.selector &&
        payload.state;

    if (!validFork) throw new InvalidForkConsumeError('Invalid fork state');

    return (
        options.pullFork ??
        (({ selector }) => {
            const pullForkParams = pullForkSession(selector);
            pullForkParams.url = apiUrl ? `${apiUrl}/${pullForkParams.url}` : pullForkParams.url;
            return api<PullForkResponse>(pullForkParams);
        })
    )(payload);
};

export const extractOfflineComponents = ({
    offlineKeyPassword,
    offlineKeySalt,
}: Extract<ForkEncryptedBlob, { type: 'offline' }>): Required<Pick<AuthSession, 'offlineConfig' | 'offlineKD'>> => ({
    offlineKD: atob(offlineKeyPassword),
    offlineConfig: {
        salt: atob(offlineKeySalt),
        params: ARGON2_PARAMS.RECOMMENDED,
    },
});

/**
 * If `keyPassword` is not provided to `ConsumeForkOptions`, it will attempt to recover it from
 * the `Payload` property of the `PullForkResponse`. `keyPassword` will always be omitted when
 * retrieving the fork options from the url parameters. This is not the case when using secure
 * extension messaging where `keyPassword` can safely be passed.
 * ⚠️ Only validates the fork state in SSO mode.
 */
export const consumeFork = async (options: ConsumeForkOptions): Promise<ConsumedFork> => {
    const { payload, api } = options;
    const cookies = AUTH_MODE === AuthMode.COOKIE;

    const { UID, RefreshToken, LocalID, Payload, Scopes } = await pullFork(options);
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
                    Persistent: payload.persistent,
                })
            )
        );
    }

    /** Note: When consuming an extension fork, we do not retrieve offline
     * password components. Consequently, any password verification triggered
     * in the extension will require a full SRP flow to validate the primary
     * user password. Pass lacks sufficient scope to verify the secondary mailbox
     * password, making secondary password verification impossible. */
    const data =
        payload.mode === 'extension'
            ? { keyPassword: payload.keyPassword, payloadVersion: SESSION_VERSION }
            : await (async () => {
                  try {
                      const { payloadVersion, key } = payload;
                      const clientKey = await importKey(key!);
                      const decryptedBlob = await getForkDecryptedBlob(clientKey, Payload, payloadVersion);
                      if (!decryptedBlob?.keyPassword) throw new Error('Missing `keyPassword`');

                      return {
                          keyPassword: decryptedBlob.keyPassword,
                          payloadVersion,
                          ...(decryptedBlob.type === 'offline' ? extractOfflineComponents(decryptedBlob) : {}),
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
        sso: User.Flags.sso,
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
    REAUTH,
}

export const getAccountForkResponsePayload = (type: AccountForkResponse, error?: any) => {
    const additionalMessage = getErrorMessage(error);

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
                        .t`More than a password manager, ${PASS_APP_NAME} protects your password and your personal email address via email aliases. Powered by the same technology behind ${MAIL_APP_NAME}, your data is end-to-end encrypted and is only accessible by you.`,
                };
            }

            case AccountForkResponse.REAUTH: {
                return {
                    title: c('Info').t`Identity confirmed`,
                    message: c('Info').t`You may close this tab.`,
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

export const isReauthForkState = (data: unknown): data is Extract<RequestForkData, { type: 'reauth' }> =>
    isObject(data) && 'type' in data && 'reauth' in data && data.type === 'reauth';
