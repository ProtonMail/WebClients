import { api } from '@proton/pass/lib/api/api';
import {
    API_PROXY_IMAGE_ENDPOINT,
    API_PROXY_KEY,
    cleanCache,
    clearCache,
    handleAPIProxy,
} from '@proton/pass/lib/api/proxy';
import { authentication } from '@proton/pass/lib/auth/store';
import browser from '@proton/pass/lib/globals/browser';
import { selectCanLoadDomainImages } from '@proton/pass/store/selectors';

import { API_URL } from '../../config';
import store from '../store';

export const createCacheProxyService = () => {
    const canLoadDomainImages = () => selectCanLoadDomainImages(store.getState());

    if (BUILD_TARGET === 'chrome') {
        (self as any as ServiceWorkerGlobalScope).onfetch = handleAPIProxy({
            apiUrl: API_URL,
            apiProxyUrl: browser.runtime.getURL(`${API_PROXY_KEY}/`),
            fetch: (url, init) => api<Response>({ url: url.toString(), method: init?.method, output: 'raw' }),
        });

        return { clean: cleanCache, clear: clearCache };
    }

    /* Firefox does not support service workers yet : reassess
     * this workaround when full MV3 support is released */
    if (BUILD_TARGET === 'firefox') {
        browser.webRequest.onBeforeSendHeaders.addListener(
            (details) => {
                const UID = authentication.getUID();
                const AccessToken = authentication.getAccessToken();

                if (
                    UID &&
                    AccessToken &&
                    canLoadDomainImages() &&
                    details.url.startsWith(`${API_URL}/${API_PROXY_IMAGE_ENDPOINT}`)
                ) {
                    details.requestHeaders?.push({ name: 'x-pm-uid', value: UID });
                    details.requestHeaders?.push({ name: 'Authorization', value: `Bearer ${AccessToken}` });
                }

                return { requestHeaders: details.requestHeaders };
            },
            { urls: [`${API_URL}/*/*`] },
            ['blocking', 'requestHeaders']
        );
    }

    return {};
};

export type CacheProxyService = ReturnType<typeof createCacheProxyService>;
