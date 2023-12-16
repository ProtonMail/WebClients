import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const CACHE_KEY = 'Pass::Http::Cache';
export const CACHED_IMAGE_DEFAULT_MAX_AGE = 1_209_600; /* 14 days */
export const CACHED_IMAGE_FALLBACK_MAX_AGE = 86_400; /* 1 day */

/** stale-while-revalidate approach :
 * Should account for stale-while-revalidate window
 * when backend supports this cache header directive.
 * Leveraging standard Cache-Control directives:
 *  - `max-age: <seconds>`
 *  - `stale-while-revalidate: <seconds>` <- FIXME
 * would allow us not to query the remote API on every request,
 * as long as the cache response is "fresh", and only perform the
 * request when the cache response is "stale" */
export const shouldRevalidate = (response: Response): boolean => {
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

export const getMaxAgeHeaders = (res: Response, maxAge: number): Headers => {
    const headers = new Headers(res.headers);
    headers.set('Date', res.headers.get('Date') ?? new Date().toUTCString());
    headers.set('Cache-Control', `max-age=${maxAge + randomIntFromInterval(0, 3_600)}`);
    return headers;
};

export const getCache = () => caches.open(CACHE_KEY);

/** Opens the http cache and wipes every stale
 * entries. This allows triggering revalidation */
export const cleanCache = async () => {
    try {
        const cache = await caches.open(CACHE_KEY);
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

export const clearCache = () => caches.delete(CACHE_KEY).catch(noop);
