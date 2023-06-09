import { api } from '@proton/pass/api';
import browser from '@proton/pass/globals/browser';
import { selectCanLoadDomainImages } from '@proton/pass/store';
import { logger } from '@proton/pass/utils/logger';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';

import { API_URL } from '../../app/config';
import store from '../store';

const API_PROXY_KEY = 'api-proxy';
const API_PROXY_PATH = browser.runtime.getURL(`${API_PROXY_KEY}/`);
const API_PROXY_IMAGE_ENDPOINT = 'core/v4/images/logo';
const API_PROXY_ENDPOINTS = [API_PROXY_IMAGE_ENDPOINT];
const API_IMAGE_FALLBACK_MAX_AGE = 86400;

export const createCacheProxyService = () => {
    const canLoadDomainImages = () => selectCanLoadDomainImages(store.getState());

    if (BUILD_TARGET === 'chrome') {
        /**
         * stale-while-revalidate approach :
         * Should account for stale-while-revalidate window
         * when backend supports this cache header directive.
         *
         * Leveraging standard Cache-Control directives:
         *  - `max-age: <seconds>`
         *  - `stale-while-revalidate: <seconds>` <- FIXME
         * would allow us not to query the remote API on every request,
         * as long as the cache response is "fresh", and only perform the
         * request when the cache response is "stale".
         */
        const shouldRevalidate = (response: Response): boolean => {
            const cacheControlHeader = response.headers.get('Cache-Control');
            const dateHeader = response.headers.get('Date');

            const maxAge = cacheControlHeader?.match(/max-age=(\d+)/)?.[1];
            const date = dateHeader ? new Date(dateHeader) : null;

            if (maxAge && date) {
                const now = new Date();
                date.setSeconds(date.getSeconds() + parseInt(maxAge, 10));

                return date.getTime() < now.getTime();
            }

            return true;
        };

        const handleApiProxy = async (remotePath: string): Promise<Response> => {
            const apiProxyCache = await caches.open(API_PROXY_KEY);
            const url = new URL(`${API_URL}/${remotePath}`);
            const cachedResponse = await apiProxyCache.match(url);

            if (cachedResponse && !shouldRevalidate(cachedResponse)) {
                logger.debug(`[CacheProxy] Serving GET ${url} from cache without revalidation`);
                return cachedResponse;
            }

            logger.debug(`[CacheProxy] Attempting to revalidate GET ${url} from network`);
            const response = api<Response>({ url: url.toString(), method: 'get', output: 'raw' })
                .then((res) => {
                    logger.debug('[CacheProxy] Caching succesful network response', res.url);
                    apiProxyCache.put(url, res.clone()).catch((e) => logger.warn('[Cache::Proxy]', e));

                    return res;
                })
                .catch((err) => {
                    logger.debug(`[CacheProxy] Network or API error while fetching ${url}`, err);

                    /**
                     * When dealing with unprocessable content from the image
                     * endpoint - cache the error eitherway for now as we want
                     * to avoid swarming the service-worker with unnecessary
                     * parallel requests which may block other api calls with
                     * higher priority
                     */
                    if (getApiError(err).status === 422 && err.response.url.includes(API_PROXY_IMAGE_ENDPOINT)) {
                        const { status, headers } = err.response as Response;

                        const res = new Response('Unprocessable Content', {
                            status,
                            headers: {
                                /* ideally these headers should be set by the server */
                                Date: headers.get('Date') ?? new Date().toUTCString(),
                                'Cache-Control': `max-age=${API_IMAGE_FALLBACK_MAX_AGE}`,
                            },
                        });
                        apiProxyCache.put(url, res.clone()).catch((e) => logger.warn('[CacheProxy]', e));

                        return res;
                    }

                    return new Response('Network error', {
                        status: 408,
                        headers: { 'Content-Type': 'text/plain' },
                    });
                });

            // FIXME: stale-while-revalidate window should be computed
            if (cachedResponse) {
                logger.debug(`[CacheProxy] Serving GET ${url} from cache`);
                return cachedResponse;
            }

            logger.debug(`[CacheProxy] Attempting to serve GET ${url} from network`);
            return response;
        };

        const globalScope = self as any as ServiceWorkerGlobalScope;
        globalScope.onfetch = (evt) => {
            /**
             * Proxy path : GET chrome-extension://{extensionId}/api-proxy/{remotePath}
             * Checks SW cache or forwards request to api endpoint
             */
            if (evt.request.url.startsWith(API_PROXY_PATH)) {
                const remotePath = evt.request.url.replace(API_PROXY_PATH, '');
                if (API_PROXY_ENDPOINTS.find((allowedEndpoint) => remotePath.startsWith(allowedEndpoint))) {
                    if (remotePath.startsWith(API_PROXY_IMAGE_ENDPOINT) && !canLoadDomainImages()) return;
                    return evt.respondWith(handleApiProxy(remotePath));
                }

                logger.debug(`[CacheProxy]: Refusing to serve non-allowed API endpoint for remote path: `, remotePath);
            }
        };
    }

    /**
     * Firefox does not support service workers yet : reassess
     * this workaround when full MV3 support is released.
     */
    if (BUILD_TARGET === 'firefox') {
        browser.webRequest.onBeforeSendHeaders.addListener(
            (details) => {
                const auth = api.getAuth();

                if (
                    auth !== undefined &&
                    canLoadDomainImages() &&
                    details.url.startsWith(`${API_URL}/${API_PROXY_IMAGE_ENDPOINT}`)
                ) {
                    details.requestHeaders?.push({ name: 'x-pm-uid', value: auth.UID });
                    details.requestHeaders?.push({ name: 'Authorization', value: `Bearer ${auth.AccessToken}` });
                }

                return { requestHeaders: details.requestHeaders };
            },
            { urls: [`${API_URL}/*/*`] },
            ['blocking', 'requestHeaders']
        );
    }

    return {};
};

export type CacheProxyService = ReturnType<typeof createCacheProxyService>;
