import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { EnrichedError } from './EnrichedError';

const is4xx = (status: number) => status >= 400 && status < 500;

const is5xx = (status: number) => status >= 500 && status < 600;

export const getErrorMetricType = (error: unknown) => {
    const apiError = getApiError(error);
    if (apiError.status && typeof apiError.status === 'number') {
        if (is4xx(apiError.status)) {
            return '4xx';
        }
        if (is5xx(apiError.status)) {
            return '5xx';
        }
    }

    if (
        error instanceof EnrichedError &&
        typeof error.context === 'object' &&
        error.context.extra &&
        error.context.extra.crypto
    ) {
        return 'crypto';
    }

    return 'unknown';
};
