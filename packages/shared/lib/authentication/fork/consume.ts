import type { ForkState } from '@proton/shared/lib/authentication/fork/forkState';
import { getCurrentUrl, getForkStateData, setForkStateData } from '@proton/shared/lib/authentication/fork/forkState';
import getRandomString from '@proton/utils/getRandomString';
import noop from '@proton/utils/noop';

import { pullForkSession, revoke, setCookies } from '../../api/auth';
import { getUser } from '../../api/user';
import { getAppHref } from '../../apps/helper';
import { getKey } from '../../authentication/cryptoHelper';
import { InvalidForkConsumeError, InvalidPersistentSessionError } from '../../authentication/error';
import type { ExtraSessionForkData, PullForkResponse } from '../../authentication/interface';
import type { OfflineKey } from '../../authentication/offlineKey';
import type { ResumedSessionResult } from '../../authentication/persistedSessionHelper';
import { persistSession, resumeSession } from '../../authentication/persistedSessionHelper';
import type { APP_NAMES } from '../../constants';
import { APPS, SSO_PATHS } from '../../constants';
import { withAuthHeaders } from '../../fetch/headers';
import { replaceUrl } from '../../helpers/browser';
import { encodeBase64URL, uint8ArrayToString } from '../../helpers/encoding';
import type { Api, User as tsUser } from '../../interfaces';
import { getForkDecryptedBlob } from './blob';
import { ExtraSessionForkSearchParameters, ForkSearchParameters, ForkType, ForkVersion } from './constants';
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

    const state = encodeBase64URL(uint8ArrayToString(crypto.getRandomValues(new Uint8Array(32))));
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
    if (extra?.email) {
        searchParams.append(ExtraSessionForkSearchParameters.Email, `${extra.email}`);
    }

    setForkStateData(state, {
        url: getCurrentUrl({ forkType, fromApp }),
        returnUrl: extra?.returnUrl,
    });

    return replaceUrl(getAppHref(`${SSO_PATHS.AUTHORIZE}?${searchParams.toString()}`, APPS.PROTONACCOUNT));
};

export const consumeFork = async ({
    api,
    mode,
    parameters,
    parameters: { selector, state: stateKey, key, persistent, trusted, payloadVersion },
}: ConsumeForkArguments): Promise<{
    session: ResumedSessionResult;
    forkState: ForkState;
}> => {
    const forkState = getForkStateData(stateKey, parameters);

    const { UID, AccessToken, RefreshToken, Payload, LocalID } = await api<PullForkResponse>(pullForkSession(selector));
    const authApi = <T>(config: any) => api<T>(withAuthHeaders(UID, AccessToken, config));

    try {
        // Resume and use old session if it exists
        const validatedSession = await resumeSession({ api, localID: LocalID });

        // Revoke the discarded forked session
        await authApi(revoke({ Child: 1 })).catch(noop);

        return {
            session: validatedSession,
            forkState,
        } as const;
    } catch (e: any) {
        // If existing session is invalid. Fall through to continue using the new fork.
        if (!(e instanceof InvalidPersistentSessionError)) {
            throw e;
        }
    }

    let keyPassword = '';
    let forkedOfflineKey: OfflineKey | undefined;

    if (Payload) {
        try {
            const data = await getForkDecryptedBlob(await getKey(key), Payload, payloadVersion);
            keyPassword = data?.keyPassword || '';
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

    const User = await authApi<{ User: tsUser }>(getUser()).then(({ User }) => User);

    const result = {
        User,
        UID,
        LocalID,
        keyPassword,
        persistent,
        trusted,
        AccessToken,
        RefreshToken,
    };

    const { clientKey, offlineKey } = await persistSession({
        api: authApi,
        ...result,
        clearKeyPassword: '',
        offlineKey: forkedOfflineKey,
        mode,
    });
    await authApi(setCookies({ UID, RefreshToken, State: getRandomString(24), Persistent: persistent }));

    return {
        session: {
            ...result,
            clientKey,
            offlineKey,
        },
        forkState,
    } as const;
};
