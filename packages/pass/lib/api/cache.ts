import type { Maybe, MaybeNull } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';
import randomIntFromInterval from '@proton/utils/randomIntFromInterval';

export const CACHE_KEY = 'Pass::Http::Cache';
export const CACHED_IMAGE_DEFAULT_MAX_AGE = 1_209_600; /* 14 days */
export const CACHED_IMAGE_FALLBACK_MAX_AGE = 86_400; /* 1 day */

/** Returns the Cache Storage API if available.
 * Will not be defined on:
 * - Non-secure contexts (non-HTTPS/localhost)
 * - Safari Private/Lockdown mode
 * - Browsers without Cache API support */
export const getCacheStorage = (): Maybe<CacheStorage> => globalThis?.caches;

export const getResponseMaxAge = (response: Response): MaybeNull<number> => {
    const cacheControlHeader = response.headers.get('Cache-Control');
    const maxAge = cacheControlHeader?.match(/max-age=(\d+)/)?.[1];
    return maxAge ? parseInt(maxAge, 10) : null;
};

export const getResponseDate = (response: Response): MaybeNull<Date> => {
    const dateHeader = response.headers.get('Date');
    return dateHeader ? new Date(dateHeader) : null;
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
export const shouldRevalidate = (response: Response): boolean => {
    const maxAge = getResponseMaxAge(response);
    const date = getResponseDate(response);

    if (maxAge !== null && date) {
        const now = new Date();
        date.setSeconds(date.getSeconds() + maxAge);
        return date.getTime() < now.getTime();
    }

    return true;
};

export const withMaxAgeHeaders = (res: Response, maxAge: number): Headers => {
    const headers = new Headers(res.headers);
    headers.set('Date', res.headers.get('Date') ?? new Date().toUTCString());
    headers.set('Cache-Control', `max-age=${maxAge + randomIntFromInterval(0, 3_600)}`);
    return headers;
};

export const getCache = async (): Promise<Maybe<Cache>> => getCacheStorage()?.open(CACHE_KEY).catch(noop);
export const clearCache = async (): Promise<Maybe<boolean>> => getCacheStorage()?.delete(CACHE_KEY).catch(noop);

/** Opens the http cache and wipes every stale
 * entries. This allows triggering revalidation */
export const cleanCache = async () => {
    try {
        const cache = await getCache();
        const cacheKeys = (await cache?.keys()) ?? [];

        const staleKeys = (
            await Promise.all(
                cacheKeys.map(async (request) => {
                    const res = await cache?.match(request).catch(noop);
                    return res && shouldRevalidate(res) ? request : null;
                })
            )
        ).filter(truthy);

        logger.debug(`[HttpCache] Removing ${staleKeys.length} stale cache entrie(s)`);
        await Promise.all(staleKeys.map((req) => cache?.delete(req).catch(noop)));
    } catch {}
};
