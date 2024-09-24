import {
    CACHED_IMAGE_DEFAULT_MAX_AGE,
    CACHED_IMAGE_FALLBACK_MAX_AGE,
    getCache,
    shouldRevalidate,
    withMaxAgeHeaders,
} from '@proton/pass/lib/api/cache';
import { createNetworkError } from '@proton/pass/lib/api/fetch-controller';
import { API_BODYLESS_STATUS_CODES } from '@proton/pass/lib/api/utils';
import { globToRegExp } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

import { fetchController } from './fetch-controller';

const IMAGE_ROUTE = globToRegExp('/api/core/v4/images/logo');
export const matchImageRoute = (pathname: string): boolean => IMAGE_ROUTE.test(pathname);

export const handleImage = fetchController.register(async (event, signal) => {
    const url = event.request.url;
    const cache = await getCache();
    const cachedResponse = await cache?.match(url).catch(noop);

    if (cachedResponse && !shouldRevalidate(cachedResponse)) return cachedResponse;

    const response = fetchController
        .fetch(event.request, signal)
        .then(async (res) => {
            if (res.status === 422) {
                /* When dealing with unprocessable content from the image
                 * endpoint - cache the error eitherway for now as we want
                 * to avoid swarming the service-worker with unnecessary
                 * parallel requests which may block other api calls with
                 * higher priority */
                const response = new Response('Unprocessable Content', {
                    status: res.status,
                    statusText: res.statusText,
                    headers: withMaxAgeHeaders(res, CACHED_IMAGE_FALLBACK_MAX_AGE),
                });

                cache?.put(url, response.clone()).catch(noop);
                return response;
            } else if (res.ok) {
                /* max-age is set to 0 on image responses from BE: this is sub-optimal in
                 * the context of the extension -> override the max-age header. */
                const response = new Response(
                    API_BODYLESS_STATUS_CODES.includes(res.status) ? null : await res.blob(),
                    {
                        status: res.status,
                        statusText: res.statusText,
                        headers: withMaxAgeHeaders(res, CACHED_IMAGE_DEFAULT_MAX_AGE),
                    }
                );

                cache?.put(url, response.clone()).catch(noop);
                return response;
            } else return res;
        })
        .catch(() => createNetworkError(408));

    /* FIXME: stale-while-revalidate window should be computed */
    if (cachedResponse) return cachedResponse;
    return response;
});
