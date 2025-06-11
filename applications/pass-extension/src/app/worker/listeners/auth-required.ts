import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import { intoUserIdentifier } from '@proton/pass/lib/items/item.utils';
import { selectAutofillSettings } from '@proton/pass/store/selectors/settings';
import type { ItemRevision } from '@proton/pass/types';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';
import { parseUrl } from '@proton/pass/utils/url/parser';

type OnAuthRequiredParams = { items: ItemRevision<'login'>[]; url: string; attempt: AttemptCount };
type RequestID = string;
type AttemptCount = number;

export const BASIC_AUTH_URL_RE = /^(https?:\/\/)(.+?):(.+?)@/;

export const onAuthRequired = ({ items, url, attempt }: OnAuthRequiredParams): WebRequest.BlockingResponse => {
    /** When we've exhausted all available credentials, allow
     * the request to proceed (will likely result in 401/403) */
    if (attempt >= items.length) return { cancel: false };

    /* URL already contains embedded credentials (user:pass@domain) - no action needed */
    if (BASIC_AUTH_URL_RE.test(url)) return { cancel: false };

    /** Select credentials based on current attempt number (attempt acts as index into items array)
     * When used in `onAuthRequired` listener: if these credentials fail, the browser will
     * retry the request with attempt incremented, cycling through all available items */
    const item = items[attempt];
    if (!item) return { cancel: false };

    return {
        authCredentials: {
            username: intoUserIdentifier(item),
            password: deobfuscate(item.data.content.password),
        },
    };
};

export const createBasicAuthListener = () => {
    const authFilter = { urls: ['https://*/*', 'http://*/*'] };
    const authRequests = new Map<RequestID, AttemptCount>();

    browser.webRequest.onAuthRequired.addListener(
        withContext((ctx, { url, requestId }) => {
            const attempt = authRequests.get(requestId) ?? 0;

            try {
                const authorized = ctx.getState().authorized;
                const enabled = selectAutofillSettings(ctx.service.store.getState()).basicAuth ?? false;
                if (!(authorized && enabled)) return { cancel: false };

                const items = ctx.service.autofill.getLoginCandidates(parseUrl(url));
                return onAuthRequired({ items, url, attempt });
            } finally {
                authRequests.set(requestId, attempt + 1);
            }
        }),
        authFilter,
        [BUILD_TARGET === 'firefox' ? 'blocking' : 'asyncBlocking']
    );

    browser.webRequest.onCompleted.addListener(({ requestId }) => authRequests.delete(requestId), authFilter);
    browser.webRequest.onErrorOccurred.addListener(({ requestId }) => authRequests.delete(requestId), authFilter);
};
