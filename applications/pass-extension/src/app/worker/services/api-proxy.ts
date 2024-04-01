import { API_URL } from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';
import store from 'proton-pass-extension/app/worker/store';

import { api } from '@proton/pass/lib/api/api';
import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    cleanCache,
    clearCache,
    getCache,
    getMaxAgeHeaders,
    shouldRevalidate,
} from '@proton/pass/lib/api/cache';
import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { API_BODYLESS_STATUS_CODES } from '@proton/pass/lib/api/utils';
import { authStore } from '@proton/pass/lib/auth/store';
import browser from '@proton/pass/lib/globals/browser';
import { selectCanLoadDomainImages } from '@proton/pass/store/selectors';
import { type Api, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

export type APIProxyOptions = {
    apiUrl: string;
    apiProxyUrl: string;
    api: Api;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
};

export const API_PROXY_PATH = '/api-proxy';
export const API_PROXY_URL = browser.runtime.getURL(API_PROXY_PATH);
export const API_PROXY_IMAGE_ENDPOINT = '/core/v4/images/logo';
export const API_PROXY_ENDPOINTS = [API_PROXY_IMAGE_ENDPOINT];

const getAPIProxyResponse = async (remotePath: string, request: Request, signal: AbortSignal): Promise<Response> => {
    const cache = await getCache();

    const url = new URL(`${API_URL}${remotePath}`);
    const cachedResponse = await cache.match(url);

    if (cachedResponse && !shouldRevalidate(cachedResponse)) {
        logger.debug(`[CacheProxy] Serving GET ${url} from cache without revalidation`);
        return cachedResponse;
    }

    logger.debug(`[CacheProxy] Attempting to revalidate GET ${url} from network`);

    const response = api<Response>({
        url: url.toString(),
        output: 'raw',
        method: request.method,
        signal,
    })
        .then(async (res) => {
            logger.debug('[CacheProxy] Caching succesful network response', res.url);

            if (API_BODYLESS_STATUS_CODES.includes(res.status)) {
                void cache.put(url, res.clone());
                return res;
            } else if (res.ok) {
                /* max-age is set to 0 on image responses from BE: this is sub-optimal in
                 * the context of the extension -> override the max-age header. */
                const response = new Response(await res.blob(), {
                    status: res.status,
                    statusText: res.statusText,
                    headers: getMaxAgeHeaders(res, CACHED_IMAGE_DEFAULT_MAX_AGE),
                });

                void cache.put(url, response.clone());
                return response;
            } else throw new Error();
        })
        .catch((err) => {
            /* When dealing with unprocessable content from the image
             * endpoint - cache the error eitherway for now as we want
             * to avoid swarming the service-worker with unnecessary
             * parallel requests which may block other api calls with
             * higher priority */
            if (getApiError(err).status === 422 && err.response.url.includes(API_PROXY_IMAGE_ENDPOINT)) {
                const res = err.response as Response;
                const response = new Response('Unprocessable Content', {
                    status: res.status,
                    statusText: res.statusText,
                    headers: getMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                });

                void cache.put(url, response.clone());
                return response;
            }

            logger.debug(`[CacheProxy] Network or API error while fetching ${url}`, err);
            return new Response('Network error', {
                status: 408,
                headers: { 'Content-Type': 'text/plain' },
            });
        });

    /* FIXME: stale-while-revalidate window should be computed */
    if (cachedResponse) {
        logger.debug(`[CacheProxy] Serving GET ${url} from cache`);
        return cachedResponse;
    }

    logger.debug(`[CacheProxy] Attempting to serve GET ${url} from network`);
    return response;
};

export const createApiProxyService = () => {
    const canLoadDomainImages = () => selectCanLoadDomainImages(store.getState());

    if (BUILD_TARGET === 'chrome') {
        WorkerMessageBroker.registerMessage(WorkerMessageType.FETCH_ABORT, ({ payload }) => {
            fetchController.abort(payload.requestId);
            return true;
        });

        /* Proxy path : GET {apiProxyUrl}/{remotePath}
         * Checks SW cache or forwards request to api endpoint */
        (self as any as ServiceWorkerGlobalScope).onfetch = fetchController.register(
            (event, signal) => {
                if (event.request.url.startsWith(API_PROXY_URL)) {
                    const remotePath = event.request.url.replace(API_PROXY_URL, '');
                    if (API_PROXY_ENDPOINTS.find((allowedEndpoint) => remotePath.startsWith(allowedEndpoint))) {
                        return getAPIProxyResponse(remotePath, event.request, signal);
                    }

                    logger.debug(
                        `[CacheProxy]: Refusing to serve non-allowed API endpoint for remote path: `,
                        remotePath
                    );
                }
            },
            { unauthenticated: true }
        );

        return { clean: cleanCache, clear: clearCache };
    }

    /* Firefox does not support service workers yet : reassess
     * this workaround when full MV3 support is released */
    if (BUILD_TARGET === 'firefox') {
        browser.webRequest.onBeforeSendHeaders.addListener(
            (details) => {
                const UID = authStore.getUID();
                const AccessToken = authStore.getAccessToken();

                if (
                    UID &&
                    AccessToken &&
                    canLoadDomainImages() &&
                    details.url.startsWith(`${API_URL}${API_PROXY_IMAGE_ENDPOINT}`)
                ) {
                    details.requestHeaders?.push({ name: 'x-pm-uid', value: UID });
                    details.requestHeaders?.push({ name: 'Authorization', value: `Bearer ${AccessToken}` });
                }

                return { requestHeaders: details.requestHeaders };
            },
            { urls: [`${API_URL}/*/*`] },
            ['blocking', 'requestHeaders']
        );
    }

    return {};
};

export type APIProxyService = ReturnType<typeof createApiProxyService>;
