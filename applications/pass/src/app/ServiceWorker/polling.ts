import { ACTIVE_POLLING_TIMEOUT } from '@proton/pass/lib/events/constants';
import { type AsyncLockedFunc, asyncLock } from '@proton/pass/utils/fp/promises';
import { logger } from '@proton/pass/utils/logger';
import { globToRegExp } from '@proton/pass/utils/url/glob';
import noop from '@proton/utils/noop';

const POLLING_CACHE_KEY = 'polling';
const POLLING_REQ_MAX_AGE = ACTIVE_POLLING_TIMEOUT;
const POLLING_HANDLERS = new Map<string, AsyncLockedFunc<(event: FetchEvent) => Promise<Response>>>();

const EVENT_ROUTES = ['/api/pass/v1/share/*/event/*', '/api/pass/v1/invite', '/api/core/v4/events/*'].map(globToRegExp);

const isValidEventCache = (cached: Response) => {
    const now = new Date().getTime();
    const date = cached.headers.get('date')!;
    const cachedAt = new Date(date).getTime();
    return now - cachedAt < POLLING_REQ_MAX_AGE;
};

export const matchPollingRoute = (pathname: string): boolean => EVENT_ROUTES.some((route) => route.test(pathname));
export const clearPollingCache = () => caches.delete(POLLING_CACHE_KEY).catch(noop);

/** Event routes will be polled every `ACTIVE_POLLING_TIMEOUT` in worst case scenarios.
 * This service worker fetch handler allows handling concurrent requests to the same
 * event route through an "async lock" and also caching responses accordingly. */
export const processPolling = async (event: FetchEvent): Promise<void> => {
    const { url } = event.request;

    const handlerForRoute = POLLING_HANDLERS.get(url);

    const handler =
        handlerForRoute ??
        asyncLock(async (evt: FetchEvent) => {
            const cache = await caches.open(POLLING_CACHE_KEY);
            const hit = await cache.match(evt.request);

            if (hit && isValidEventCache(hit)) {
                logger.debug(`[Polling] Cache hit for ${new URL(url).pathname.slice(0, 25)}…`);
                return hit;
            }

            await cache.delete(evt.request).catch(noop);
            const response = await fetch(evt.request);
            if (response.ok && response.status === 200) cache.put(evt.request, response.clone());
            POLLING_HANDLERS.delete(url);

            return response;
        });

    POLLING_HANDLERS.set(url, handler);
    event.respondWith(handler(event).then((response) => response.clone()));
};
