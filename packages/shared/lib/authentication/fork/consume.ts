import { importKey } from '@proton/crypto/lib/subtle/aesGcm';
import { getAuthAPI } from '@proton/shared/lib/api/helpers/customConfig';
import getRandomString from '@proton/utils/getRandomString';
import noop from '@proton/utils/noop';

import { pullForkSession, revoke, setCookies } from '../../api/auth';
import { getAppHref } from '../../apps/helper';
import { InvalidForkConsumeError, InvalidPersistentSessionError } from '../../authentication/error';
import type { ExtraSessionForkData, PullForkResponse } from '../../authentication/interface';
import type { OfflineKey } from '../../authentication/offlineKey';
import type { ResumedSessionResult } from '../../authentication/persistedSessionHelper';
import { persistSession, resumeSession } from '../../authentication/persistedSessionHelper';
import type { APP_NAMES } from '../../constants';
import { APPS, SSO_PATHS } from '../../constants';
import { withAuthHeaders } from '../../fetch/headers';
import { replaceUrl } from '../../helpers/browser';
import type { Api, User } from '../../interfaces';
import type { SessionSource } from '../SessionInterface';
import { getUser } from '../getUser';
import { getForkDecryptedBlob } from './blob';
import { ExtraSessionForkSearchParameters, ForkSearchParameters, ForkType, ForkVersion } from './constants';
import { type ForkState, getCurrentUrl, getForkStateData, setForkStateData } from './forkState';
import type { ConsumeForkParameters } from './getConsumeForkParameters';

export const removeHashParameters = () => {
    window.location.hash = '';
};

interface ConsumeForkArguments {
    api: Api;
    mode: 'sso' | 'standalone';
    parameters: ConsumeForkParameters;
}

export const requestFork = ({
    fromApp,
    localID,
    reason,
    forkType: maybeForkType,
    payloadType,
    payloadVersion,
    extra,
}: {
    fromApp: APP_NAMES;
    localID?: number;
    forkType?: ForkType;
    reason?: 'signout' | 'session-expired';
    payloadType?: 'offline';
    payloadVersion?: 2;
    extra?: ExtraSessionForkData;
}) => {
    const searchParams = new URLSearchParams();
    searchParams.append(ForkSearchParameters.App, fromApp);

    const state = crypto.getRandomValues(new Uint8Array(32)).toBase64({ alphabet: 'base64url', omitPadding: true });
    searchParams.append(ForkSearchParameters.State, state);
    searchParams.append(ForkSearchParameters.Version, `${ForkVersion}`);
    if (localID !== undefined) {
        searchParams.append(ForkSearchParameters.LocalID, `${localID}`);
    }

    const forkType = (() => {
        if (maybeForkType !== undefined) {
            return maybeForkType;
        }
        if (extra?.pathname === SSO_PATHS.SIGNUP) {
            return ForkType.SIGNUP;
        }
        if (extra?.pathname === SSO_PATHS.SWITCH) {
            return ForkType.SWITCH;
        }
    })();
    if (forkType !== undefined) {
        searchParams.append(ForkSearchParameters.ForkType, forkType);
    }
    if (reason !== undefined) {
        searchParams.append('reason', reason);
    }
    if (payloadType !== undefined) {
        searchParams.append(ForkSearchParameters.PayloadType, payloadType);
    }
    if (payloadVersion !== undefined) {
        searchParams.append(ForkSearchParameters.PayloadVersion, `${payloadVersion}`);
    }
    if (extra?.unauthenticatedReturnUrl) {
        searchParams.append(ForkSearchParameters.UnauthenticatedReturnUrl, extra.unauthenticatedReturnUrl);
    }
    if (extra?.email) {
        searchParams.append(ExtraSessionForkSearchParameters.Email, `${extra.email}`);
    }

    setForkStateData(state, {
        url: getCurrentUrl({ forkType, fromApp }),
        returnUrl: extra?.returnUrl,
        reloadDocument: extra?.reloadDocument,
    });

    return replaceUrl(getAppHref(`${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`, APPS.PROTONACCOUNT));
};

export const maybeResumeForkedSession = async ({
    api,
    pullForkResponse,
}: {
    api: Api;
    pullForkResponse: PullForkResponse;
}): Promise<ResumedSessionResult | undefined> => {
    const { UID, AccessToken, LocalID } = pullForkResponse;

    try {
        // Resume and use old session if it exists
        const validatedSession = await resumeSession({ api, localID: LocalID });

        // Revoke the discarded forked session
        await api(withAuthHeaders(UID, AccessToken, revoke({ Child: 1 }))).catch(noop);

        return validatedSession;
    } catch (e: any) {
        // If existing session is invalid. Fall through to continue using the new fork.
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }
};

export const persistForkedSession = async ({
    api,
    user,
    pullForkResponse: { UID, RefreshToken, LocalID },
    payload: { keyPassword, forkedOfflineKey, persistent, trusted, mode, source },
}: {
    api: Api;
    user: User;
    pullForkResponse: PullForkResponse;
    payload: {
        persistent: boolean;
        trusted: boolean;
        keyPassword: string;
        forkedOfflineKey?: OfflineKey;
        mode?: 'sso' | 'standalone';
        source: SessionSource;
    };
}): Promise<ResumedSessionResult> => {
    const sessionResult = await persistSession({
        api,
        User: user,
        UID,
        LocalID,
        keyPassword,
        persistent,
        trusted,
        clearKeyPassword: '',
        offlineKey: forkedOfflineKey,
        mode,
        source,
    });
    await api(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: persistent }));
    return sessionResult;
};

export const resolveForkPasswords = async ({
    key,
    payloadVersion,
    pullForkResponse,
}: {
    key: ConsumeForkParameters['key'];
    payloadVersion: ConsumeForkParameters['payloadVersion'];
    pullForkResponse: PullForkResponse;
}) => {
    let keyPassword = '';
    let forkedOfflineKey: OfflineKey | undefined;
    const payload = pullForkResponse.Payload;

    if (payload) {
        try {
            const data = await getForkDecryptedBlob(await importKey(key), payload, payloadVersion);
            keyPassword = data?.keyPassword ?? '';
            if (data?.type === 'offline') {
                forkedOfflineKey = {
                    password: data.offlineKeyPassword,
                    salt: data.offlineKeySalt,
                };
            }
        } catch (e: any) {
            throw new InvalidForkConsumeError('Failed to decrypt payload');
        }
    }

    return {
        keyPassword,
        forkedOfflineKey,
    };
};

export const consumeFork = async ({
    api,
    mode,
    parameters,
    parameters: { selector, state: stateKey, key, persistent, trusted, payloadVersion, source },
}: ConsumeForkArguments): Promise<{
    session: ResumedSessionResult;
    forkState: ForkState;
}> => {
    const forkState = getForkStateData(stateKey, parameters);

    const pullForkResponse = await api<PullForkResponse>(pullForkSession(selector));
    const resumedSession = await maybeResumeForkedSession({ api, pullForkResponse });

    if (resumedSession) {
        return {
            session: resumedSession,
            forkState,
        };
    }

    const { keyPassword, forkedOfflineKey } = await resolveForkPasswords({
        key,
        payloadVersion,
        pullForkResponse,
    });

    const authApi = getAuthAPI(pullForkResponse.UID, pullForkResponse.AccessToken, api);
    const user = await getUser(authApi);

    const result = await persistForkedSession({
        api: authApi,
        user,
        pullForkResponse,
        payload: { persistent, trusted, keyPassword, forkedOfflineKey, mode, source },
    });

    return {
        session: result,
        forkState,
    };
};
