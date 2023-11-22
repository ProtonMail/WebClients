import { type Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { getApiError } from '@proton/shared/lib/api/helpers/apiErrorHelper';
import { getAuthHeaders } from '@proton/shared/lib/fetch/headers';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export type APIProxyOptions = {
    apiUrl: string;
    apiProxyUrl: string;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
};

export const API_PROXY_KEY = 'api-proxy';
export const API_PROXY_IMAGE_ENDPOINT = 'core/v4/images/logo';
export const API_PROXY_ENDPOINTS = [API_PROXY_IMAGE_ENDPOINT];
export const API_IMAGE_DEFAULT_MAX_AGE = 1_209_600; /* 14 days */
export const API_IMAGE_FALLBACK_MAX_AGE = 86_400; /* 1 day */
export const API_BODYLESS_STATUS_CODES = [101, 204, 205, 304];

const withDelay = (value: number) => value + randomIntFromInterval(0, 3_600);

/** Encode the authentication data in the cache request URL */
export const withAuthHash = (url: string, UID: string, AccessToken: string) =>
    `${url}#${btoa(JSON.stringify({ UID, AccessToken }))}`;

/** Extract the authentication data from the hash if any */
export const getAuthFromHash = (url: URL): Maybe<{ UID: string; AccessToken: string }> => {
    try {
        const [, ...hash] = url.hash;
        const auth = JSON.parse(atob(hash.join('')));

        if ('UID' in auth && 'AccessToken' in auth) {
            url.hash = '';
            return { UID: auth.UID, AccessToken: auth.AccessToken };
        }
    } catch {}
};

/** stale-while-revalidate approach :
 * Should account for stale-while-revalidate window
 * when backend supports this cache header directive.
 * Leveraging standard Cache-Control directives:
 *  - `max-age: <seconds>`
 *  - `stale-while-revalidate: <seconds>` <- FIXME
 * would allow us not to query the remote API on every request,
 * as long as the cache response is "fresh", and only perform the
 * request when the cache response is "stale" */
const shouldRevalidate = (response: Response): boolean => {
    const cacheControlHeader = response.headers.get('Cache-Control');
    const dateHeader = response.headers.get('Date');

    const maxAge = cacheControlHeader?.match(/max-age=(\d+)/)?.[1];
    const date = dateHeader ? new Date(dateHeader) : null;

    if (maxAge !== undefined && date) {
        const now = new Date();
        date.setSeconds(date.getSeconds() + parseInt(maxAge, 10));
        return date.getTime() < now.getTime();
    }

    return true;
};

/** Opens the API proxy cache and wipes every stale
 * entries. This allows triggering revalidation */
export const cleanAPIProxyCache = async () => {
    try {
        const cache = await caches.open(API_PROXY_KEY);
        const cacheKeys = await cache.keys();

        const staleKeys = (
            await Promise.all(
                cacheKeys.map(async (request) => {
                    const res = await cache.match(request);
                    return res && shouldRevalidate(res) ? request : null;
                })
            )
        ).filter(truthy);

        logger.info(`[CacheProxy] Removing ${staleKeys.length} stale cache entrie(s)`);
        await Promise.all(staleKeys.map((req) => cache.delete(req)));
    } catch {}
};

/** Clears the whole API proxy cache */
export const clearAPIProxyCache = () => caches.delete(API_PROXY_KEY).catch(noop);

const createAPIProxyHandler =
    (options: APIProxyOptions) =>
    async (remotePath: string, method: string): Promise<Response> => {
        const apiProxyCache = await caches.open(API_PROXY_KEY);

        const url = new URL(`${options.apiUrl}/${remotePath}`);
        const auth = getAuthFromHash(url);
        const cachedResponse = await apiProxyCache.match(url);

        if (cachedResponse && !shouldRevalidate(cachedResponse)) {
            logger.debug(`[CacheProxy] Serving GET ${url} from cache without revalidation`);
            return cachedResponse;
        }

        logger.debug(`[CacheProxy] Attempting to revalidate GET ${url} from network`);
        const response = options
            .fetch(url.toString(), { method, ...(auth ? { headers: getAuthHeaders(auth.UID, auth.AccessToken) } : {}) })
            .then(async (res) => {
                logger.debug('[CacheProxy] Caching succesful network response', res.url);

                if (API_BODYLESS_STATUS_CODES.includes(res.status)) {
                    void apiProxyCache.put(url, res.clone());
                    return res;
                } else {
                    /* max-age is set to 0 on image responses from BE: this is sub-optimal in
                     * the context of the extension -> override the max-age header. */
                    const headers = new Headers(res.headers);
                    headers.set('Date', res.headers.get('Date') ?? new Date().toUTCString());
                    headers.set('Cache-Control', `max-age=${withDelay(API_IMAGE_DEFAULT_MAX_AGE)}`);

                    const response = new Response(await res.blob(), {
                        status: res.status,
                        statusText: res.statusText,
                        headers,
                    });

                    void apiProxyCache.put(url, response.clone());
                    return response;
                }
            })
            .catch((err) => {
                logger.debug(`[CacheProxy] Network or API error while fetching ${url}`, err);

                /* When dealing with unprocessable content from the image
                 * endpoint - cache the error eitherway for now as we want
                 * to avoid swarming the service-worker with unnecessary
                 * parallel requests which may block other api calls with
                 * higher priority */
                if (getApiError(err).status === 422 && err.response.url.includes(API_PROXY_IMAGE_ENDPOINT)) {
                    const res = err.response as Response;

                    const headers = new Headers(res.headers);
                    headers.set('Date', res.headers.get('Date') ?? new Date().toUTCString());
                    headers.set('Cache-Control', `max-age=${withDelay(API_IMAGE_FALLBACK_MAX_AGE)}`);

                    const response = new Response('Unprocessable Content', {
                        status: res.status,
                        statusText: res.statusText,
                        headers,
                    });

                    void apiProxyCache.put(url, response.clone());

                    return response;
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

export const handleAPIProxy = (options: APIProxyOptions) => (event: FetchEvent) => {
    const handler = createAPIProxyHandler(options);
    /* Proxy path : GET {apiProxyUrl}/{remotePath}
     * Checks SW cache or forwards request to api endpoint */
    if (event.request.url.startsWith(options.apiProxyUrl)) {
        const remotePath = event.request.url.replace(options.apiProxyUrl, '');
        if (API_PROXY_ENDPOINTS.find((allowedEndpoint) => remotePath.startsWith(allowedEndpoint))) {
            return event.respondWith(handler(remotePath, event.request.method));
        }

        logger.debug(`[CacheProxy]: Refusing to serve non-allowed API endpoint for remote path: `, remotePath);
    }
};
