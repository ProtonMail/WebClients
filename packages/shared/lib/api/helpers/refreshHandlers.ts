import { create as createMutex } from '@protontech/mutex-browser';

import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { createOnceHandler } from '../../apiHandlers';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '../../constants';
import { HTTP_ERROR_CODES } from '../../errors';
import type { ApiError } from '../../fetch/ApiError';
import { wait } from '../../helpers/promise';
import { retryHandler } from './retryHandler';

export const createRefreshHandlers = (refresh: (UID: string) => Promise<Response>) => {
    const refreshHandlers: { [key: string]: () => Promise<void> } = {};

    const refreshHandler = (UID: string) => {
        if (!refreshHandlers[UID]) {
            const mutex = createMutex({ expiry: 15000 });

            const getMutexLock = async (UID: string) => {
                try {
                    await mutex.lock(UID);
                    return () => {
                        return mutex.unlock(UID).catch(noop);
                    };
                } catch (e) {
                    // If getting the mutex fails, fall back to a random wait
                    await wait(randomIntFromInterval(100, 2000));
                    return () => {
                        return Promise.resolve();
                    };
                }
            };

            /**
             * Refreshing the session needs to handle multiple race conditions.
             * 1) Race conditions within the context (tab). Solved by the once handler.
             * 2) Race conditions within multiple contexts (tabs). Solved by the shared mutex.
             */
            refreshHandlers[UID] = createOnceHandler(async () => {
                const unlockMutex = await getMutexLock(UID);
                try {
                    await refresh(UID);
                    // Add an artificial delay to ensure cookies are properly updated to avoid race conditions
                    await wait(50);
                } finally {
                    await unlockMutex();
                }
            });
        }

        return refreshHandlers[UID]();
    };

    return refreshHandler;
};

export const getIsRefreshFailure = (error: ApiError) => {
    // Any 4xx from the refresh call and the session is no longer valid, 429 is already handled in the refreshHandler
    return error.status >= 400 && error.status <= 499;
};

/**
 * Handle refresh token. Happens when the access token has expired.
 * Multiple calls can fail, so this ensures the refresh route is called once.
 * Needs to re-handle errors here for that reason.
 */
export const refresh = (call: () => Promise<Response>, attempts: number, maxAttempts: number): Promise<Response> => {
    return call().catch((e) => {
        if (attempts >= maxAttempts) {
            throw e;
        }

        const { status, name } = e;

        if (name === 'OfflineError') {
            if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                throw e;
            }
            return wait(OFFLINE_RETRY_DELAY).then(() => refresh(call, attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX));
        }

        if (name === 'TimeoutError') {
            if (attempts > OFFLINE_RETRY_ATTEMPTS_MAX) {
                throw e;
            }
            return refresh(call, attempts + 1, OFFLINE_RETRY_ATTEMPTS_MAX);
        }

        if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
            return retryHandler(e).then(() => refresh(call, attempts + 1, RETRY_ATTEMPTS_MAX));
        }

        throw e;
    });
};
