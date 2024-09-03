import { API_URL } from 'proton-pass-extension/app/config';
import WorkerMessageBroker from 'proton-pass-extension/app/worker/channel';

import { api } from '@proton/pass/lib/api/api';
import { cleanCache, clearCache } from '@proton/pass/lib/api/cache';
import { fetchControllerFactory } from '@proton/pass/lib/api/fetch-controller';
import { createImageProxyHandler, imageResponsetoDataURL } from '@proton/pass/lib/api/images';
import { authStore } from '@proton/pass/lib/auth/store';
import browser from '@proton/pass/lib/globals/browser';
import { type Api, WorkerMessageType } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';

export type APIProxyOptions = {
    apiUrl: string;
    apiProxyUrl: string;
    api: Api;
    fetch: (info: RequestInfo, init?: RequestInit) => Promise<Response>;
};

export const API_PROXY_PATH = '/api-proxy';
export const API_PROXY_URL = browser?.runtime.getURL(API_PROXY_PATH);
export const API_PROXY_IMAGE_ENDPOINT = '/core/v4/images/logo';

export const createApiProxyService = () => {
    if (BUILD_TARGET === 'chrome') {
        const fetchController = fetchControllerFactory();
        const imageProxy = createImageProxyHandler(api);

        WorkerMessageBroker.registerMessage(WorkerMessageType.FETCH_ABORT, ({ payload }) => {
            fetchController.abort(payload.requestId);
            return true;
        });

        /* Proxy path : GET {apiProxyUrl}/{remotePath}
         * Checks SW cache or forwards request to api endpoint */
        (self as any as ServiceWorkerGlobalScope).onfetch = fetchController.register(
            (event, signal) => {
                if (event.request.url.startsWith(API_PROXY_URL)) {
                    const remotePath = event.request.url.replace(API_PROXY_URL, '');
                    const url = `${API_URL}${remotePath}`;

                    if (remotePath.startsWith(API_PROXY_IMAGE_ENDPOINT)) return imageProxy(url, signal);

                    logger.debug(
                        `[CacheProxy]: Refusing to serve non-allowed API endpoint for remote path: `,
                        remotePath
                    );
                }
            },
            { unauthenticated: true }
        );

        return { clean: cleanCache, clear: clearCache };
    }

    /* Firefox does not support service workers yet : reassess
     * this workaround when full MV3 support is released */
    if (BUILD_TARGET === 'firefox') {
        browser.webRequest.onBeforeSendHeaders.addListener(
            (details) => {
                const UID = authStore.getUID();
                const AccessToken = authStore.getAccessToken();

                if (UID && AccessToken && details.url.startsWith(`${API_URL}${API_PROXY_IMAGE_ENDPOINT}`)) {
                    details.requestHeaders?.push({ name: 'x-pm-uid', value: UID });
                    details.requestHeaders?.push({ name: 'Authorization', value: `Bearer ${AccessToken}` });
                }

                return { requestHeaders: details.requestHeaders };
            },
            { urls: [`${API_URL}/*/*`] },
            ['blocking', 'requestHeaders']
        );
    }

    WorkerMessageBroker.registerMessage(WorkerMessageType.FETCH_DOMAINIMAGE, async ({ payload: { url } }) => {
        const UID = authStore.getUID();
        const AccessToken = authStore.getAccessToken();
        const headers = {
            'x-pm-uid': UID!,
            Authorization: `Bearer ${AccessToken}`,
        };
        const response = await fetch(url, { headers }).then(imageResponsetoDataURL);
        return { result: response };
    });

    return {};
};

export type APIProxyService = ReturnType<typeof createApiProxyService>;
