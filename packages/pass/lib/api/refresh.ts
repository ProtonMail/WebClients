import type { ApiContext } from '@proton/pass/types';
import { setRefreshCookies as refreshTokens } from '@proton/shared/lib/api/auth';
import { retryHandler } from '@proton/shared/lib/api/helpers/retryHandler';
import { InactiveSessionError } from '@proton/shared/lib/api/helpers/withApiHandlers';
import { createOnceHandler } from '@proton/shared/lib/apiHandlers';
import type { RefreshSessionResponse } from '@proton/shared/lib/authentication/interface';
import { OFFLINE_RETRY_ATTEMPTS_MAX, OFFLINE_RETRY_DELAY, RETRY_ATTEMPTS_MAX } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { withUIDHeaders } from '@proton/shared/lib/fetch/headers';
import { getDateHeader } from '@proton/shared/lib/fetch/helpers';
import { wait } from '@proton/shared/lib/helpers/promise';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export type RefreshHandler = (responseDate?: Date) => Promise<void>;

type CreateRefreshHandlerOptions = {
    apiContext: ApiContext;
    onRefresh: (response: RefreshSessionResponse, refreshTime: number) => void;
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
        if (apiContext.auth === undefined) throw InactiveSessionError();
        const { UID, RefreshToken } = apiContext.auth;
        return await apiContext.call(withUIDHeaders(UID, refreshTokens({ RefreshToken: RefreshToken })));
    } catch (error: any) {
        const { status, name } = error;
        const next = () => refresh({ apiContext, attempt: attempt + 1, maxAttempts: OFFLINE_RETRY_ATTEMPTS_MAX });

        if (attempt >= maxAttempts) throw error;

        if (['OfflineError', 'TimeoutError'].includes(name)) {
            if (attempt > OFFLINE_RETRY_ATTEMPTS_MAX) throw error;
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
        if (apiContext.auth === undefined) throw InactiveSessionError();

        const { UID } = apiContext.auth;

        if (!refreshHandlers.has(UID)) {
            refreshHandlers.set(
                UID,
                createOnceHandler(async (responseDate: Date) => {
                    await wait(randomIntFromInterval(100, 2000));
                    const lastRefreshDate = apiContext.auth?.RefreshTime;

                    if (lastRefreshDate === undefined || +responseDate > lastRefreshDate) {
                        const response = await refresh({ apiContext, attempt: 1, maxAttempts: RETRY_ATTEMPTS_MAX });
                        const timestamp = getDateHeader(response.headers) ?? new Date();
                        const result = await response.json();
                        onRefresh(result, +timestamp);

                        await wait(50);
                    }
                })
            );
        }

        return refreshHandlers.get(UID)!(responseDate ?? new Date());
    };
};
