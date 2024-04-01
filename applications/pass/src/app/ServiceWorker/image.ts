import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    getCache,
    getMaxAgeHeaders,
    shouldRevalidate,
} from '@proton/pass/lib/api/cache';
import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { API_BODYLESS_STATUS_CODES } from '@proton/pass/lib/api/utils';
import { globToRegExp } from '@proton/pass/utils/url/glob';

const IMAGE_ROUTE = globToRegExp('/api/core/v4/images/logo');
export const matchImageRoute = (pathname: string): boolean => IMAGE_ROUTE.test(pathname);

export const handleImage = fetchController.register(async (event, signal) => {
    const url = event.request.url;
    const cache = await getCache();
    const cachedResponse = await cache.match(url);

    if (cachedResponse && !shouldRevalidate(cachedResponse)) return cachedResponse;

    const response = fetchController
        .fetch(event.request, signal)
        .then(async (res) => {
            if (API_BODYLESS_STATUS_CODES.includes(res.status)) {
                void cache.put(url, res.clone());
                return res;
            } else if (res.status === 422) {
                /* When dealing with unprocessable content from the image
                 * endpoint - cache the error eitherway for now as we want
                 * to avoid swarming the service-worker with unnecessary
                 * parallel requests which may block other api calls with
                 * higher priority */
                const response = new Response('Unprocessable Content', {
                    status: res.status,
                    statusText: res.statusText,
                    headers: getMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                });

                void cache.put(url, response.clone());
                return response;
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
        .catch(
            () =>
                new Response('Network error', {
                    status: 408,
                    headers: { 'Content-Type': 'text/plain' },
                })
        );

    /* FIXME: stale-while-revalidate window should be computed */
    if (cachedResponse) return cachedResponse;
    return response;
});
