import getRandomString from '@proton/utils/getRandomString';
import noop from '@proton/utils/noop';

import {
    PASSWORD_WRONG_ERROR,
    auth,
    auth2FA,
    authMnemonic,
    createSession,
    payload,
    revoke,
    setCookies,
    setLocalKey,
    setRefreshCookies,
} from '../api/auth';
import type { ApiEvent, ApiListenerCallback } from '../api/createApi';
import { getApiError, getIs401Error } from '../api/helpers/apiErrorHelper';
import { getHumanVerificationData, withVerification } from '../api/helpers/humanVerification';
import { createCrossTabMutex } from '../api/helpers/mutex';
import { createRefreshHandlers, getIsRefreshFailure, refresh } from '../api/helpers/refreshHandlers';
import { createOnceHandler } from '../apiHandlers';
import type { ChallengePayload } from '../authentication/interface';
import { API_CUSTOM_ERROR_CODES, HTTP_ERROR_CODES } from '../errors';
import { getUIDHeaderValue, withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { createPromise, wait } from '../helpers/promise';
import { setUID } from '../helpers/sentry';
import { getItem, removeItem, setItem } from '../helpers/sessionStorage';
import type { Api, HumanVerificationMethodType } from '../interfaces';

const setupComplete = Symbol('setup complete');

const authConfig = auth({} as any, true);
const mnemonicAuthConfig = authMnemonic('', true);
const auth2FAConfig = auth2FA({ TwoFactorCode: '' });
const localKeyConfig = setLocalKey('');

interface Context {
    UID: string | undefined;
    auth: { set: boolean; id: any; finalised: boolean };
    api: Api;
    refresh: () => void;
    abortController: AbortController;
    setup: null | typeof setupComplete | Promise<void>;
    challenge: ReturnType<typeof createPromise<ChallengePayload | undefined>>;
}

export interface UnauthenticatedApiOptions {
    onUID?: (UID: string) => void;
}

export const createUnauthenticatedApi = (api: Api, { onUID }: UnauthenticatedApiOptions = {}) => {
    const unAuthStorageKey = 'ua_uid';
    const unAuthMutexKey = 'ua_session';

    const context: Context = {
        UID: undefined,
        api,
        abortController: new AbortController(),
        challenge: createPromise<ChallengePayload | undefined>(),
        auth: { set: false, id: {}, finalised: false },
        setup: null,
        refresh: () => {},
    };

    const listeners: ApiListenerCallback[] = [];
    const notify = (event: ApiEvent) => {
        return listeners.map((listener) => listener(event)).some((value) => value === true);
    };

    const updateUID = (UID: string) => {
        setItem(unAuthStorageKey, UID);

        setUID(UID);
        onUID?.(UID);

        context.UID = UID;
        context.auth.set = false;
        context.auth.finalised = false;
        context.auth.id = {};
        context.abortController = new AbortController();
    };

    // Kept short on purpose: a contending context spins until the lock is released or expires, and
    // session setup gates every unauth request, so the expiry is the worst case boot delay for the
    // other contexts. If it does expire mid-flight we just degrade to the unsynchronized behavior.
    // It only has to cover a single request, so it doesn't need the refresh handler's headroom.
    const getSessionMutexLock = createCrossTabMutex({ expiry: 5000 });

    /**
     * The local id is assigned by this request, per device, and the device is identified by the
     * Session-Id cookie that's already sent along with it. Two contexts (tabs) of the same device
     * creating a session concurrently can therefore both be handed the same local id, and
     * whichever of them signs in last overwrites the other one's persisted session. See
     * assertUniqueLocalID.
     *
     * Serializing the request between contexts is enough to avoid that, since the session then
     * exists for the device before the next context asks for one. Note that no cookie of ours
     * changes in between, so unlike in the refresh handler there's nothing to let settle here.
     */
    const createUnauthSession = async (challengePayload: ChallengePayload | undefined) => {
        const unlockMutex = await getSessionMutexLock(unAuthMutexKey);

        try {
            const response = await context.api<Response>({
                ...createSession(challengePayload ? { Payload: challengePayload } : undefined),
                silence: true,
                headers: {
                    // This is here because it's required for clients that aren't in the min version
                    // And we won't put e.g. the standalone login for apps there
                    'x-enforce-unauthsession': true,
                },
                output: 'raw',
            });

            return response;
        } finally {
            await unlockMutex();
        }
    };

    /**
     * Creating an unauthenticated session needs to handle multiple race conditions.
     * 1) Race conditions within the context (tab). Solved by the once handler.
     * 2) Race conditions within multiple contexts (tabs). Solved by the shared mutex.
     *
     * Note: the mutex name differs from the one the refresh handler uses, so the refresh handler
     * falling back to `init` on a refresh failure can't dead-lock on it.
     */
    const init = createOnceHandler(async () => {
        context.abortController.abort();

        const challengePromise = context.challenge.promise.catch(noop);
        const challengePayload = (await Promise.race([challengePromise, wait(300)])) || undefined;

        const response = await createUnauthSession(challengePayload);

        const { UID, AccessToken, RefreshToken } = await response.json();
        await context.api({
            ...withAuthHeaders(UID, AccessToken, setCookies({ UID, RefreshToken, State: getRandomString(24) })),
            silence: true,
        });

        updateUID(UID);

        if (!challengePayload) {
            challengePromise
                .then((challengePayload) => {
                    if (!challengePayload) {
                        return;
                    }
                    context
                        .api({
                            ...withUIDHeaders(UID, payload(challengePayload)),
                            ignoreHandler: [HTTP_ERROR_CODES.UNAUTHORIZED],
                            silence: true,
                        })
                        .catch(noop);
                })
                .catch(noop);
        }

        return response;
    });

    const refreshHandler = createRefreshHandlers((UID: string) => {
        return refresh(
            () =>
                context.api({
                    ...withUIDHeaders(UID, setRefreshCookies()),
                    ignoreHandler: [HTTP_ERROR_CODES.UNAUTHORIZED],
                    output: 'raw',
                    silence: 'true',
                }),
            1,
            3
        ).catch((e) => {
            if (getIsRefreshFailure(e)) {
                return init().then((result) => {
                    return result;
                });
            }
            throw e;
        });
    });

    const setup = async () => {
        const oldUID = getItem(unAuthStorageKey);
        if (oldUID) {
            updateUID(oldUID);
        } else {
            return init();
        }
    };

    const clearTabPersistedUID = () => {
        removeItem(unAuthStorageKey);
    };

    const initSetup = (): Promise<void> | undefined => {
        if (context.setup === setupComplete) {
            return;
        }
        if (context.setup === null) {
            context.setup = setup()
                .then(() => {
                    context.setup = setupComplete;
                })
                .catch(() => {
                    context.setup = null;
                });
        }
        return context.setup;
    };

    // This session handles its own human verification, the same way it handles its own 401s. The app level
    // handler never sees the challenge, so it can't answer it on another session.
    const handleVerification = (error: any, config: any, retry: Api) => {
        const { token, methods, title } = getHumanVerificationData(error);

        return new Promise((resolve, reject) => {
            const onVerify = (verificationToken: string, tokenType: HumanVerificationMethodType) => {
                return retry(withVerification(config, verificationToken, tokenType));
            };

            const handled = notify({
                type: 'handle-verification',
                payload: { token, methods, onVerify, title, error, resolve, reject },
            });
            if (handled) {
                return;
            }
            return reject(error);
        });
    };

    const apiCallback: Api = async (config: any) => {
        await initSetup();
        // Only opt out of the app level handler when this session can show the challenge itself, so that
        // a caller using this api without a host mounted for it keeps the app level modal
        const handlesVerification = listeners.length > 0;
        const verificationOptOut = handlesVerification ? [API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED] : [];
        const UID = context.UID;
        if (!UID) {
            return context.api(config);
        }

        // Note: requestUID !== UID means that this is an API request that is using an already established session, so we ignore unauth here.
        const requestUID = getUIDHeaderValue(config.headers) ?? UID;
        if (requestUID !== UID) {
            return context.api(config);
        }

        // If an unauthenticated session attempts to signs in, the unauthenticated session has to be discarded so it's not
        // accidentally re-used for another session. We do this before the response has returned to avoid race conditions,
        // e.g. a user refreshing the page before the response has come back.
        const isAuthUrl = [authConfig.url, mnemonicAuthConfig.url].includes(config.url);
        if (isAuthUrl) {
            clearTabPersistedUID();
        }

        const requestAbortController = new AbortController();
        const contextAbortController = context.abortController;
        // This is basically a merged abort signal for:
        //  1) the context's global abort controller
        //  2) the request's own abort controller
        // The idea is that if the global abort controller is canceled, this request should get canceled too,
        // maintaining the behavior that if the request's own abort controller is canceled, this request gets canceled.
        const otherAbortCb = () => {
            requestAbortController.abort();
        };
        config.signal?.addEventListener('abort', otherAbortCb);
        contextAbortController.signal.addEventListener('abort', otherAbortCb);
        const id = {}; // Unique symbol for this run

        try {
            // This is set BEFORE the API calls finishes. This might give false positives (when the credentials are incorrect) but
            // it'll ensure that the session is reset if a user hits the back button before the auth call finishes and credentials are correct.
            // It's also reset in case the credentials are incorrect, but that assumes that one user can only trigger one auth process at a time.
            if (isAuthUrl) {
                context.auth.set = true;
                context.auth.id = id;
            }

            if (config.url === localKeyConfig.url) {
                context.auth.finalised = true;
            }

            const result = await context.api(
                withUIDHeaders(UID, {
                    ...config,
                    signal: requestAbortController.signal,
                    ignoreHandler: [
                        HTTP_ERROR_CODES.UNAUTHORIZED,
                        ...verificationOptOut,
                        ...(Array.isArray(config.ignoreHandler) ? config.ignoreHandler : []),
                    ],
                    silence:
                        config.silence === true
                            ? true
                            : [
                                  HTTP_ERROR_CODES.UNAUTHORIZED,
                                  ...verificationOptOut,
                                  ...(Array.isArray(config.silence) ? config.silence : []),
                              ],
                })
            );

            return result;
        } catch (e: any) {
            if (isAuthUrl && context.auth.id === id) {
                context.auth.set = false;
            }
            if (config.url === localKeyConfig.url && context.auth.id === id) {
                context.auth.finalised = false;
            }
            const { code: errorCode } = getApiError(e);
            const ignoreHumanVerification =
                Array.isArray(config.ignoreHandler) &&
                config.ignoreHandler.includes(API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED);
            if (
                handlesVerification &&
                errorCode === API_CUSTOM_ERROR_CODES.HUMAN_VERIFICATION_REQUIRED &&
                !ignoreHumanVerification
            ) {
                return await handleVerification(e, config, apiCallback);
            }
            if (getIs401Error(e)) {
                const { code } = getApiError(e);
                // Don't attempt to refresh on 2fa 401 failures since the session has become invalidated.
                // NOTE: Only one the PASSWORD_WRONG_ERROR code, since 401 is also triggered on session expiration.
                if (config.url === auth2FAConfig.url && code === PASSWORD_WRONG_ERROR) {
                    throw e;
                }
                return await refreshHandler(UID).then(() => {
                    return apiCallback(config);
                });
            }
            throw e;
        } finally {
            config.signal?.removeEventListener('abort', otherAbortCb);
            contextAbortController.signal.removeEventListener('abort', otherAbortCb);
        }
    };

    const setChallenge = (data: ChallengePayload | undefined) => {
        context.challenge.resolve(data);
    };

    const startUnAuthFlow = createOnceHandler(async (): Promise<void> => {
        if (!(context.auth.set && context.UID)) {
            return;
        }

        // Avoid deleting the session if it's been fully finalised and persisted
        if (context.auth.set && context.UID && context.auth.finalised) {
            updateUID('');
            await init();
            return;
        }

        // Abort all previous request to prevent it triggering 401 and refresh
        context.abortController.abort();

        await context
            .api(
                withUIDHeaders(context.UID, {
                    ...revoke(),
                    silence: true,
                    ignoreHandler: [HTTP_ERROR_CODES.UNAUTHORIZED],
                })
            )
            .catch(noop);

        await init();
    });

    return {
        apiCallback,
        addEventListener: (cb: ApiListenerCallback) => {
            listeners.push(cb);
        },
        removeEventListener: (cb: ApiListenerCallback) => {
            const index = listeners.indexOf(cb);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        },
        setChallenge,
        startUnAuthFlow,
        setup: initSetup,
        getUID: () => context.UID,
    };
};

export type UnauthenticatedApi = ReturnType<typeof createUnauthenticatedApi>;
