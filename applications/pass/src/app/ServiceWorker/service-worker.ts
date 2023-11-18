import { API_PROXY_KEY, cleanCache, clearCache, handleAPIProxy } from '@proton/pass/lib/api/proxy';
import { logger } from '@proton/pass/utils/logger';
import noop from '@proton/utils/noop';

import { API_URL } from '../config';
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
    void cleanCache().catch(noop);
    event.waitUntil(self.clients.claim());
});

const apiProxyHandler = handleAPIProxy({
    apiUrl: `${self.location.origin}${API_URL}`,
    apiProxyUrl: `${self.location.origin}/${API_PROXY_KEY}/`,
    fetch: (url, init = {}) =>
        fetch(url, {
            ...init,
            credentials: 'include',
            mode: 'cors',
            redirect: 'follow',
        }),
});

self.addEventListener('fetch', (event) => {
    const { method, url } = event.request;
    const { pathname } = new URL(url);

    if (pathname === '/api/auth/refresh' && method === 'POST') return processRefresh(event);
    return apiProxyHandler(event);
});

self.addEventListener('message', (event) => {
    const message = event.data as WithOrigin<ServiceWorkerMessage>;
    if (message.type === 'unauthorized') void clearCache().catch(noop);
    if (message.broadcast) CLIENT_CHANNEL.postMessage(event.data);
});
