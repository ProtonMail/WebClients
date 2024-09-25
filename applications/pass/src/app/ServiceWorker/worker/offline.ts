import { createNetworkError } from '@proton/pass/lib/api/fetch-controller';
import type { Maybe } from '@proton/pass/types';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { logger } from '@proton/pass/utils/logger';
import { globToRegExp } from '@proton/pass/utils/url/utils';
import noop from '@proton/utils/noop';

import { fetchController } from './fetch-controller';

const OFFLINE_CACHE_KEY = 'Pass::Offline::Cache';
const OFFLINE_ASSET_MANIFEST = '/assets/offline.json';
const EXCLUDED_OFFLINE_ASSETS_RE = /(offline|version)\.json/;
const ASSET_ROUTE = globToRegExp('/assets/*');

export const getOfflineCache = (): Promise<Maybe<Cache>> => caches.open(OFFLINE_CACHE_KEY).catch(noop);

/** Excludes certain assets (offline.json and version.json) from being
 * cached, ensuring they are always served from the network. */
export const matchAssetRoute = (pathname: string): boolean => {
    if (!OFFLINE_SUPPORTED || EXCLUDED_OFFLINE_ASSETS_RE.test(pathname)) return false;
    return ASSET_ROUTE.test(pathname);
};

/** If the browser is online, we avoid matching the index route to ensure
 * that an updated version is served, preventing the delivery of potentially
 * stale files that reference outdated assets. */
export const matchNavigate = (pathname: string): boolean => {
    if (!OFFLINE_SUPPORTED) return false;
    return pathname === '/' || pathname.startsWith('/u/');
};

/** Clears the entire offline cache. This should be called whenever a new service
 * worker is installed to ensure that outdated cached assets are removed. */
export const clearOfflineCache = async () => {
    const cache = await getOfflineCache();
    const keys = (await cache?.keys()) ?? [];
    await Promise.all(keys.map((key) => cache?.delete(key).catch(noop)));
};

/** Fetches the critical offline assets with cache-busting to ensure the request
 * always retrieves the latest version of the offline.json file. */
export const getCriticalOfflineAssets = async (): Promise<string[]> =>
    fetch(`${OFFLINE_ASSET_MANIFEST}?cache-bust=${new Date().getTime()}`)
        .then(async (res) => Object.values<string>(await res.json()))
        .catch(() => []);

/** Reads the offline asset manifest and attempts to cache all critical offline
 * assets. Should be called during the install phase of the service worker. */
export const cacheOfflineAssets = async (clear: boolean) => {
    if (!OFFLINE_SUPPORTED) return;

    try {
        if (clear) await clearOfflineCache();
        const cache = await getOfflineCache();

        if (cache) {
            const precached = new Set((await cache.keys()).map((request) => request.url.replace(location.origin, '')));
            const assets = (await getCriticalOfflineAssets()).filter((asset) => !precached.has(asset));

            const cached = (
                await Promise.all(
                    assets.map((asset) =>
                        cache
                            ?.add(asset)
                            .then(() => asset)
                            .catch(() => logger.warn(`[ServiceWorker] failed to cache "${asset}"`))
                    )
                )
            ).filter(truthy);

            logger.debug(`[ServiceWorker] Pre-cached ${cached.length} resources`);
        }
    } catch (err) {
        logger.error(`[ServiceWorker] Failed to cache critical resources`, err);
    }
};

export const handleAsset = fetchController.register(
    async (event) => {
        const { request } = event;
        const cache = await getOfflineCache();

        try {
            const response = await fetchController.fetch(request);
            const status = response.status;

            if (status === 200 || status === 304) {
                logger.debug(`[ServiceWorker] Caching asset ${request.url}`);
                void cache?.put(request, response.clone()).catch(noop);
            }

            return response;
        } catch (err) {
            const match = await cache?.match(request).catch(noop);
            return match ?? createNetworkError();
        }
    },
    { unauthenticated: true }
);

export const handleIndex = fetchController.register(
    async (event) => {
        try {
            return await fetchController.fetch(event.request);
        } catch (err) {
            const cache = await getOfflineCache();
            const match = await cache?.match('/index.html').catch(noop);
            if (match) return match;
            throw err;
        }
    },
    { unauthenticated: true }
);
