import { type ServiceWorkerMessage } from 'proton-pass-web/app/ServiceWorker/types';
import { COMMIT } from 'proton-pass-web/app/config';

import { cleanCache, clearCache } from '@proton/pass/lib/api/cache';
import { fileStorage, fileStorageReady } from '@proton/pass/lib/file-storage/fs';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { ServiceWorkerMessageBroker } from './channel';
import { fetchController } from './fetch-controller';
import { handleImage, matchImageRoute } from './image';
import { cacheOfflineAssets, handleAsset, handleIndex, matchAssetRoute, matchPrivateAppNavigate } from './offline';
import { handlePolling, matchPollingRoute } from './polling';
import {
    handleLock,
    handleRefresh,
    handleSetLocalKey,
    matchLockRoute,
    matchRefreshRoute,
    matchSetLocalKeyRoute,
} from './session';

declare let self: ServiceWorkerGlobalScope;

/** Claims all clients to ensure they are controlled by the latest service worker.
 * After claiming, sends a message to all clients (including uncontrolled ones)
 * to check for version mismatches. If a mismatch is detected, clients should
 * perform a full reload to update to the latest version of the application. */
const onClaim = async () => {
    await self.clients.claim();
    const clients = await self.clients.matchAll({ includeUncontrolled: true });
    const message = { type: 'check', hash: COMMIT } satisfies ServiceWorkerMessage;
    clients.forEach((client) => client.postMessage(message));
};

const onConnect = async () => {
    try {
        await cleanCache();
        await cacheOfflineAssets(false);

        /** Clear file storage when one client is connected to this service worker. */
        const clients = await self.clients.matchAll({ includeUncontrolled: true });
        if (clients.length <= 1) void fileStorageReady.then(() => fileStorage.clearAll());
    } catch {}
};

const onFileStorageGC = (filenames: string[]) => {
    logger.info(`[ServiceWorker] Removing ${filenames.length} file(s)`);
    filenames.forEach((filename) => fileStorage.deleteFile(filename).catch(noop));
};

self.addEventListener('install', (event) =>
    event.waitUntil(
        (() => {
            logger.debug(`[ServiceWorker] Skip waiting..`);
            void cacheOfflineAssets(true);
            return self.skipWaiting();
        })()
    )
);

self.addEventListener('activate', async (event) =>
    event.waitUntil(
        (() => {
            logger.debug(`[ServiceWorker] Activation in progress..`);
            void cleanCache();
            void fileStorageReady.then(() => fileStorage.clearAll());
            return onClaim();
        })()
    )
);

self.addEventListener('fetch', async (event) => {
    const { url, mode, destination } = event.request;
    const { pathname } = new URL(url);

    if (matchPrivateAppNavigate(pathname, mode, destination)) return handleIndex(event);
    if (matchLockRoute(pathname)) return handleLock(event);
    if (matchSetLocalKeyRoute(pathname)) return handleSetLocalKey(event);
    if (matchRefreshRoute(pathname)) return handleRefresh(event);
    if (matchPollingRoute(pathname)) return handlePolling(event);
    if (matchImageRoute(pathname)) return handleImage(event);
    if (matchAssetRoute(pathname)) return handleAsset(event);
});

ServiceWorkerMessageBroker.register('connect', onConnect);
ServiceWorkerMessageBroker.register('abort', ({ requestId }) => fetchController.abort(requestId));
ServiceWorkerMessageBroker.register('claim', onClaim);
ServiceWorkerMessageBroker.register('unauthorized', () => clearCache().then(noop));
ServiceWorkerMessageBroker.register('fs_gc', ({ filenames }) => onFileStorageGC(filenames));

self.addEventListener('message', ServiceWorkerMessageBroker.onMessage);
