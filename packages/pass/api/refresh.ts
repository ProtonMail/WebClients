import { setRefreshCookies as refreshTokens } from '@proton/shared/lib/api/auth';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { createOnceHandler } from '@proton/shared/lib/apiHandlers';
import type { RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { encodeBase64URL } from '@proton/shared/lib/helpers/encoding';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

import { browserLocalStorage } from '../extension/storage';
import type { StorageData } from '../extension/storage/types';
import type { ApiContext, Maybe } from '../types';

export type RefreshHandler = (responseDate?: Date) => Promise<void>;

type CreateRefreshHandlerOptions = {
    apiContext: ApiContext;
    onRefresh: (response: RefreshSessionResponse) => void;
};

const getRefreshKey = (UID: string): string => encodeBase64URL(`r-${UID}`);

export const setLastRefreshDate = async (UID: string, now: Date): Promise<void> => {
    await browserLocalStorage.setItem<StorageData>(getRefreshKey(UID), `${+now}`);
};

export const getLastRefreshDate = async (UID: string): Promise<Maybe<Date>> => {
    const oldString = await browserLocalStorage.getItem<StorageData>(getRefreshKey(UID));
    const parsed = Number.parseInt(oldString ?? '', 10);
    const date = new Date(parsed);
    return Number.isNaN(+date) ? undefined : date;
};

export const removeLastRefreshDate = async (UID: string): Promise<void> => {
    await browserLocalStorage.removeItem<StorageData>(getRefreshKey(UID));
};

/**
 * Handle refresh token. Happens when the access token has expired.
 * Multiple calls can fail, so this ensures the refresh route is called once.
 * Needs to re-handle errors here for that reason.
 */
const refresh = async (options: {
    apiContext: ApiContext;
    attempt: number;
    maxAttempts: number;
}): Promise<Response> => {
    const { attempt, maxAttempts, apiContext } = options;

    try {
        if (apiContext.auth === undefined) {
            throw InactiveSessionError();
        }

        const { UID, RefreshToken } = apiContext.auth;
        return await apiContext.call(withUIDHeaders(UID, refreshTokens({ RefreshToken: RefreshToken })));
    } catch (error: any) {
        const { status, name } = error;

        const next = () =>
            refresh({
                apiContext,
                attempt: attempt + 1,
                maxAttempts: OFFLINE_RETRY_ATTEMPTS_MAX,
            });

        if (attempt >= maxAttempts) {
            throw error;
        }

        if (['OfflineError', 'TimeoutError'].includes(name)) {
            if (attempt > OFFLINE_RETRY_ATTEMPTS_MAX) {
                throw error;
            }
            await wait(name === 'OfflineError' ? OFFLINE_RETRY_DELAY : 0);
            return next();
        }

        if (status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS) {
            await retryHandler(error);
            return next();
        }

        throw error;
    }
};

export const createRefreshHandler = ({ apiContext, onRefresh }: CreateRefreshHandlerOptions): RefreshHandler => {
    const refreshHandlers: Map<string, (responseDate: Date) => Promise<void>> = new Map();

    return (responseDate) => {
        if (apiContext.auth === undefined) {
            throw InactiveSessionError();
        }

        const { UID } = apiContext.auth;

        if (!refreshHandlers.has(UID)) {
            refreshHandlers.set(
                UID,
                createOnceHandler(async (responseDate: Date) => {
                    await wait(randomIntFromInterval(100, 2000));
                    const lastRefreshDate = await getLastRefreshDate(UID);

                    if (lastRefreshDate === undefined || responseDate > lastRefreshDate) {
                        const response = await refresh({
                            apiContext,
                            attempt: 1,
                            maxAttempts: RETRY_ATTEMPTS_MAX,
                        });
                        const timestamp = getDateHeader(response.headers) ?? new Date();
                        const result = await response.json();

                        await setLastRefreshDate(UID, timestamp);
                        onRefresh(result);

                        await wait(50);
                    }
                })
            );
        }

        return refreshHandlers.get(UID)!(responseDate ?? new Date());
    };
};
