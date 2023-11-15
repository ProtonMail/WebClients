import type { ApiAuth, ApiCallFn, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
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
export type RefreshSessionData = RefreshSessionResponse & { RefreshTime: number };
export type OnRefreshCallback = (response: RefreshSessionData) => void;

type CreateRefreshHandlerOptions = {
    call: ApiCallFn;
    getAuth: () => Maybe<ApiAuth>;
    onRefresh: OnRefreshCallback;
};

/**
 * Handle refresh token. Happens when the access token has expired.
 * Multiple calls can fail, so this ensures the refresh route is called once.
 * Needs to re-handle errors here for that reason.
 */
const refresh = async (options: {
    call: ApiCallFn;
    getAuth: () => Maybe<ApiAuth>;
    attempt: number;
    maxAttempts: number;
}): Promise<Response> => {
    const { call, getAuth, attempt, maxAttempts } = options;
    const auth = getAuth();

    try {
        if (auth === undefined || !auth.UID) throw InactiveSessionError();
        return await call(withUIDHeaders(auth.UID, refreshTokens({ RefreshToken: auth.RefreshToken })));
    } catch (error: any) {
        if (attempt >= maxAttempts) throw error;

        const { status, name } = error;
        const next = () => refresh({ call, getAuth, attempt: attempt + 1, maxAttempts: OFFLINE_RETRY_ATTEMPTS_MAX });

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

export const createRefreshHandler = ({ call, getAuth, onRefresh }: CreateRefreshHandlerOptions): RefreshHandler => {
    const refreshHandlers: Map<string, RefreshHandler> = new Map();

    return (responseDate) => {
        const auth = getAuth();
        if (auth === undefined || !auth.UID) throw InactiveSessionError();

        if (!refreshHandlers.has(auth.UID)) {
            refreshHandlers.set(
                auth.UID,
                createOnceHandler(async (responseDate?: Date) => {
                    await wait(randomIntFromInterval(100, 2000));
                    const lastRefreshDate = auth.RefreshTime;

                    if (lastRefreshDate === undefined || +(responseDate ?? new Date()) > lastRefreshDate) {
                        const response = await refresh({ call, getAuth, attempt: 1, maxAttempts: RETRY_ATTEMPTS_MAX });
                        const timestamp = getDateHeader(response.headers) ?? new Date();
                        const result: RefreshSessionResponse = await response.json();

                        logger.info('[API] Successfully refreshed session tokens');
                        onRefresh({ ...result, RefreshTime: +timestamp });

                        await wait(50);
                    }
                })
            );
        }

        return refreshHandlers.get(auth.UID)!(responseDate);
    };
};
