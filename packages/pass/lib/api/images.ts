import type { Api, Maybe } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { ApiError } from '@proton/shared/lib/fetch/ApiError';
import noop from '@proton/utils/noop';

import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    getCache,
    shouldRevalidate,
    withMaxAgeHeaders,
} from './cache';
import { createAbortResponse, createEmptyResponse, createNetworkError } from './fetch-controller';
import { API_BODYLESS_STATUS_CODES } from './utils';

export const imageResponsetoDataURL = (response: Response): Promise<Maybe<string>> =>
    new Promise<Maybe<string>>(async (resolve, reject) => {
        try {
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result?.toString());
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        } catch {
            reject();
        }
    }).catch(noop);

export const createImageProxyHandler = (api: Api) => async (url: string, signal?: AbortSignal) => {
    const cache = await getCache();
    const cachedResponse = await cache?.match(url).catch(noop);

    if (cachedResponse && !shouldRevalidate(cachedResponse)) {
        logger.debug(`[ImageProxy] Serving GET ${url} from cache without revalidation`);
        return cachedResponse;
    }

    logger.debug(`[ImageProxy] Attempting to revalidate GET ${url} from network`);

    const response = api<Response>({ url, output: 'raw', signal, sideEffects: false })
        .then(async (res) => {
            logger.debug('[Image] Caching succesfull network response', res.url);

            const response = new Response(API_BODYLESS_STATUS_CODES.includes(res.status) ? null : await res.blob(), {
                status: res.status,
                statusText: res.statusText,
                headers: withMaxAgeHeaders(res, CACHED_IMAGE_DEFAULT_MAX_AGE),
            });

            cache?.put(url, response.clone()).catch(noop);
            return response;
        })
        .catch((err) => {
            if (err?.name === 'AbortError') return createAbortResponse();

            if (err instanceof ApiError) {
                const { status } = getApiError(err);
                const res = err?.response?.bodyUsed ? createEmptyResponse(err.response) : createEmptyResponse();

                if (status === 422) {
                    const response = new Response('Unprocessable Content', {
                        status,
                        statusText: res.statusText,
                        headers: withMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                    });

                    void cache?.put(url, response.clone()).catch(noop);
                    return response;
                }

                return res;
            }

            return createNetworkError(408);
        });

    if (cachedResponse) {
        /* FIXME: stale-while-revalidate window should be computed */
        logger.debug(`[ImageProxy] Serving ${url} from cache`);
        return cachedResponse;
    }

    logger.debug(`[ImageProxy] Attempting to serve ${url} from network`);
    return response;
};
