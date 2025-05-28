import metrics from '@proton/metrics';
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
import { getApiError, getIs401Error } from '../api/helpers/apiErrorHelper';
import { createRefreshHandlers, getIsRefreshFailure, refresh } from '../api/helpers/refreshHandlers';
import { createOnceHandler } from '../apiHandlers';
import type { ChallengePayload } from '../authentication/interface';
import { HTTP_ERROR_CODES } from '../errors';
import { getUIDHeaderValue, withAuthHeaders, withUIDHeaders } from '../fetch/headers';
import { getDateHeader } from '../fetch/helpers';
import { createPromise, wait } from '../helpers/promise';
import { setUID } from '../helpers/sentry';
import { getItem, removeItem, setItem } from '../helpers/sessionStorage';
import type { Api } from '../interfaces';
import { telemetry } from '../telemetry';

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

export const createUnauthenticatedApi = (api: Api) => {
    const unAuthStorageKey = 'ua_uid';

    const context: Context = {
        UID: undefined,
        api,
        abortController: new AbortController(),
        challenge: createPromise<ChallengePayload | undefined>(),
        auth: { set: false, id: {}, finalised: false },
        setup: null,
        refresh: () => {},
    };

    const updateUID = (UID: string) => {
        setItem(unAuthStorageKey, UID);

        setUID(UID);
        metrics.setAuthHeaders(UID);
        telemetry.setAuthHeaders(UID || '');

        context.UID = UID;
        context.auth.set = false;
        context.auth.finalised = false;
        context.auth.id = {};
        context.abortController = new AbortController();
    };

    const init = createOnceHandler(async () => {
        context.abortController.abort();

        const challengePromise = context.challenge.promise.catch(noop);
        const challengePayload = await Promise.race([challengePromise, wait(300)]);

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

    const apiCallback: Api = async (config: any) => {
        await initSetup();
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
                        ...(Array.isArray(config.ignoreHandler) ? config.ignoreHandler : []),
                    ],
                    silence:
                        config.silence === true
                            ? true
                            : [HTTP_ERROR_CODES.UNAUTHORIZED, ...(Array.isArray(config.silence) ? config.silence : [])],
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
            if (getIs401Error(e)) {
                const { code } = getApiError(e);
                // Don't attempt to refresh on 2fa 401 failures since the session has become invalidated.
                // NOTE: Only one the PASSWORD_WRONG_ERROR code, since 401 is also triggered on session expiration.
                if (config.url === auth2FAConfig.url && code === PASSWORD_WRONG_ERROR) {
                    throw e;
                }
                return await refreshHandler(UID, getDateHeader(e?.response?.headers)).then(() => {
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
        setChallenge,
        startUnAuthFlow,
        setup: initSetup,
        getUID: () => context.UID,
    };
};

export type UnauthenticatedApi = ReturnType<typeof createUnauthenticatedApi>;
