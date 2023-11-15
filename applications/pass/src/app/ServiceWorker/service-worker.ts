import { logger } from '@proton/pass/utils/logger';

import { CLIENT_CHANNEL, type ServiceWorkerMessage, type WithOrigin } from './channel';
import { processRefresh } from './refresh';

export default null;
declare let self: ServiceWorkerGlobalScope;

self.addEventListener('install', () => {
    logger.info('[ServiceWorker] Skip waiting..');
    void self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    logger.info('[ServiceWorker] Activation in progress..');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    switch (url.pathname) {
        case '/api/auth/refresh': {
            if (event.request.method === 'POST') processRefresh(event);
            break;
        }
    }
});

self.addEventListener('message', (event) => {
    const message = event.data as WithOrigin<ServiceWorkerMessage>;
    if (message.broadcast) CLIENT_CHANNEL.postMessage(event.data);
});
