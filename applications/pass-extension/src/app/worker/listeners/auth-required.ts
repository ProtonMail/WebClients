import { withContext } from 'proton-pass-extension/app/worker/context/inject';
import { WEB_REQUEST_PERMISSIONS, hasPermissions } from 'proton-pass-extension/lib/utils/permissions';
import type { WebRequest } from 'webextension-polyfill';

import browser from '@proton/pass/lib/globals/browser';
import { intoUserIdentifier } from '@proton/pass/lib/items/item.utils';
import { selectAutofillSettings } from '@proton/pass/store/selectors/settings';
import type { ItemRevision } from '@proton/pass/types';
import { logger } from '@proton/pass/utils/logger';
import { deobfuscate } from '@proton/pass/utils/obfuscate/xor';

type OnAuthRequiredParams = { items: ItemRevision<'login'>[]; url: string; attempt: AttemptCount };
type RequestID = string;
type AttemptCount = number;

export const BASIC_AUTH_URL_RE = /^(https?:\/\/)(.+?):(.+?)@/;

export const resolveCredentials = ({ items, url, attempt }: OnAuthRequiredParams): WebRequest.BlockingResponse => {
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

export type BasicAuthController = {
    active: boolean;
    listen: () => void;
    destroy: () => void;
};

const basicAuthEnabled = async (): Promise<boolean> =>
    BUILD_TARGET !== 'safari' && browser.webRequest.onAuthRequired && (await hasPermissions(WEB_REQUEST_PERMISSIONS));

export const createBasicAuthController = (): BasicAuthController => {
    const authFilter = { urls: ['https://*/*', 'http://*/*'] };
    const authRequests = new Map<RequestID, AttemptCount>();

    const onAuthRequired = withContext((ctx, { url, requestId }: WebRequest.OnAuthRequiredDetailsType) => {
        const attempt = authRequests.get(requestId) ?? 0;

        try {
            const authorized = ctx.getState().authorized;
            const enabled = selectAutofillSettings(ctx.service.store.getState()).basicAuth ?? false;
            if (!(authorized && enabled)) return { cancel: false };

            const items = ctx.service.autofill.getLoginCandidates({ url });
            return resolveCredentials({ items, url, attempt });
        } finally {
            authRequests.set(requestId, attempt + 1);
        }
    });

    const onCompleted = ({ requestId }: WebRequest.OnCompletedDetailsType) => authRequests.delete(requestId);
    const onErrored = ({ requestId }: WebRequest.OnErrorOccurredDetailsType) => authRequests.delete(requestId);

    const controller = {
        active: false,
        listen: () => {
            if (!controller.active) {
                controller.active = true;
                basicAuthEnabled()
                    .then((enabled) => {
                        if (!enabled) throw new Error();
                        logger.info('[BasicAuth] Listening for basic auth..');
                        browser.webRequest.onAuthRequired.addListener(onAuthRequired, authFilter, ['blocking']);
                        browser.webRequest.onCompleted.addListener(onCompleted, authFilter);
                        browser.webRequest.onErrorOccurred.addListener(onErrored, authFilter);
                    })
                    .catch(() => logger.info('[BasicAuth] Failed initializating basic auth listeners'));
            }
        },
        destroy: () => {
            if (controller.active) {
                logger.info('[BasicAuth] Stopped listeners');
                authRequests.clear();
                controller.active = false;
                browser.webRequest.onAuthRequired.removeListener(onAuthRequired);
                browser.webRequest.onCompleted.removeListener(onCompleted);
                browser.webRequest.onErrorOccurred.removeListener(onErrored);
            }
        },
    };

    return controller;
};
