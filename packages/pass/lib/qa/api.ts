import { setRefreshCookies } from '@proton/shared/lib/api/auth';
import { RETRY_DELAY_MAX } from '@proton/shared/lib/constants';
import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { createApiError } from '@proton/shared/lib/fetch/ApiError';

import type { ApiCallFn } from '../../types';
import { QA_SERVICE } from './service';

const REFRESH_URL = setRefreshCookies().url;
const RETRY_AFTER = String(RETRY_DELAY_MAX * 3);

/** Dev-only: reproduces a failing session refresh. Every call is answered with a
 * 401 so a refresh is triggered, and the refresh itself with the configured status.
 * On 429 the `retry-after` is set above `RETRY_DELAY_MAX` so it escapes `retryHandler`. */
export const withQARefreshStatus =
    (call: ApiCallFn): ApiCallFn =>
    (options) => {
        const refreshStatus = QA_SERVICE?.state.refresh_status;
        if (!refreshStatus) return call(options);

        const refreshing = options.url === REFRESH_URL;
        const status = refreshing ? refreshStatus : HTTP_ERROR_CODES.UNAUTHORIZED;
        const response = new Response(null, {
            status,
            headers: {
                date: new Date().toUTCString(),
                ...(status === HTTP_ERROR_CODES.TOO_MANY_REQUESTS ? { 'retry-after': RETRY_AFTER } : {}),
            },
        });

        return Promise.reject(createApiError('StatusCodeError', response, options));
    };
