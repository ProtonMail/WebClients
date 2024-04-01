import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { logger } from '@proton/pass/utils/logger';
import { globToRegExp } from '@proton/pass/utils/url/glob';

const OFFLINE_CACHE_KEY = 'Pass::Offline::Cache';
const OFFLINE_ASSET_MANIFEST = '/assets/offline.json';
const ASSET_ROUTE = globToRegExp('/assets/*');

const getOfflineCache = () => caches.open(OFFLINE_CACHE_KEY);

export const matchAssetRoute = (pathname: string): boolean => ASSET_ROUTE.test(pathname);

/** If the browser is online : we avoid matchinig the index route
 * as it may have been updated, thus preventing serving a potentially
 * stale file referencing outdated assets */
export const matchOfflineIndexRoute = (pathname: string): boolean => {
    if (navigator.onLine) return false;
    return pathname === '/' || pathname.startsWith('/u/');
};

export const clearOfflineCache = async () => {
    const cache = await getOfflineCache();
    const keys = await cache.keys();
    await Promise.all(keys.map((key) => cache.delete(key)));
};

export const getCriticalOfflineAssets = async (): Promise<string[]> =>
    fetch(OFFLINE_ASSET_MANIFEST)
        .then(async (res) => Object.values<string>(await res.json()))
        .catch(() => []);

/** Reads the offline asset manifest and tries to
 * cache all critical offline assets. This should be
 * done in the install phase of the service-worker */
export const cacheCriticalOfflineAssets = async () => {
    try {
        if (ENV !== 'development') await clearOfflineCache();
        const cache = await getOfflineCache();
        const assets = await getCriticalOfflineAssets();
        await cache.addAll(assets);
        logger.debug(`[ServiceWorker] Pre-cached ${assets.length} resources`);
    } catch {
        logger.debug(`[ServiceWorker] Failed to cache critical resources`);
    }
};

export const handleAsset = fetchController.register(
    async (event) => {
        const { request } = event;

        try {
            const response = await fetchController.fetch(request);
            const status = response.status;

            if (status === 200 || status === 304) {
                logger.debug(`[ServiceWorker] Caching asset ${request.url}`);
                void (await getOfflineCache()).put(request, response.clone());
            }

            return response;
        } catch (err) {
            const cache = await getOfflineCache();
            const match = await cache.match(request);

            if (match) {
                logger.debug(`[ServiceWorker] Serving offline asset ${request.url}`);
                return match;
            }

            throw err;
        }
    },
    { unauthenticated: true }
);

export const handleIndex = fetchController.register(
    async () => {
        const cache = await getOfflineCache();
        const match = await cache.match('/index.html');
        if (!match) throw new Error();

        return match;
    },
    { unauthenticated: true }
);
