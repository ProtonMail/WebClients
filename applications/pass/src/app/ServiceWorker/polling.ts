import { getCache } from '@proton/pass/lib/api/cache';
import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { globToRegExp } from '@proton/pass/utils/url/glob';
import noop from '@proton/utils/noop';

import { getUID } from './utils';

const POLLING_REQ_MAX_AGE = ACTIVE_POLLING_TIMEOUT;
const EVENT_ROUTES = ['/api/pass/v1/share/*/event/*', '/api/pass/v1/invite', '/api/core/v4/events/*'].map(globToRegExp);

const isValidEventCache = (cached: Response) => {
    const now = new Date().getTime();
    const date = cached.headers.get('date')!;
    const cachedAt = new Date(date).getTime();
    return now - cachedAt < POLLING_REQ_MAX_AGE;
};

export const matchPollingRoute = (pathname: string): boolean => EVENT_ROUTES.some((route) => route.test(pathname));

const pollingLock = asyncLock(
    async (event: FetchEvent, signal: AbortSignal): Promise<Response> => {
        const { url } = event.request;

        const cache = await getCache();
        const hit = await cache.match(url);

        if (hit && isValidEventCache(hit)) return hit;
        await cache.delete(url);

        const response = await fetch(event.request, { signal });
        if (response.ok && response.status === 200) cache.put(url, response.clone()).catch(noop);

        return response;
    },
    { key: (event) => getUID(event) + event.request.url }
);

/** Event routes will be polled every `ACTIVE_POLLING_TIMEOUT` in worst case scenarios.
 * This service worker fetch handler allows handling concurrent requests to the same
 * event route through an "async lock" and also caching responses accordingly. */
export const handlePolling = fetchController.register((event, signal) =>
    pollingLock(event, signal).then((res) => res.clone())
);
