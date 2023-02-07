import { RETRY_DELAY_MAX } from '@proton/shared/lib/constants';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import { wait } from '@proton/shared/lib/helpers/promise';

export const retryHandler = (e: ApiError, maxDelay = RETRY_DELAY_MAX) => {
    const headers = e?.response?.headers;

    const retryAfterSeconds = parseInt(headers?.get('retry-after') || '0', 10);

    if (retryAfterSeconds < 0 || retryAfterSeconds >= maxDelay) {
        return Promise.reject(e);
    }

    return wait(retryAfterSeconds * 1000);
};
