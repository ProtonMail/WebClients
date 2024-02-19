import { cleanCache, clearCache } from '@proton/pass/lib/api/cache';
import { fetchController } from '@proton/pass/lib/api/fetch-controller';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { CLIENT_CHANNEL, type ServiceWorkerMessage, type WithOrigin } from './channel';
import { handleImage, matchImageRoute } from './image';
import { handlePolling, matchPollingRoute } from './polling';
import {
    handleLock,
    handleRefresh,
    handleSetLocalKey,
    matchLockRoute,
    matchRefreshRoute,
    matchSetLocalKeyRoute,
} from './session';

export default null;
declare let self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
    logger.info('[ServiceWorker] Skip waiting..');
    return self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    logger.info('[ServiceWorker] Activation in progress..');
    cleanCache().catch(noop);
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const { url, method } = event.request;
    const { pathname } = new URL(url);

    if (matchLockRoute(pathname)) return handleLock(event);
    if (matchSetLocalKeyRoute(pathname, method)) return handleSetLocalKey(event);
    if (matchRefreshRoute(pathname)) return handleRefresh(event);
    if (matchPollingRoute(pathname)) return handlePolling(event);
    if (matchImageRoute(pathname)) return handleImage(event);
});

self.addEventListener('message', (event) => {
    const message = event.data as WithOrigin<ServiceWorkerMessage>;
    if (message.type === 'unauthorized') void clearCache().catch(noop);
    if (message.type === 'abort') fetchController.abort(message.requestUrl);
    if (message.broadcast) CLIENT_CHANNEL.postMessage(event.data);
});
