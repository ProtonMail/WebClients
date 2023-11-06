import * as config from 'proton-pass-extension/app/config';
import { createDevReloader } from 'proton-pass-extension/lib/utils/dev-reload';

import { generateKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { backgroundMessage } from '@proton/pass/lib/extension/message';
import browser from '@proton/pass/lib/globals/browser';
import { WorkerMessageType } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from './channel';
import { createWorkerContext } from './context';

if (BUILD_TARGET === 'chrome') {
    /* FIXME: create a custom webpack plugin to automatically register
     * chunks loaded through `importScripts` for the chromium build
     * https://bugs.chromium.org/p/chromium/issues/detail?id=1198822#c10*/
    const globalScope = self as any as ServiceWorkerGlobalScope;
    const getLocaleAsset = (locale: string) => browser.runtime.getURL(`chunk.locales/${locale}-json.js`);
    const chunks = Object.keys(config.LOCALES).map(getLocaleAsset);

    globalScope.oninstall = async () => {
        importScripts(...chunks);
        /* In order to alleviate MV3 service worker potentially ending up
         * in a broken state after an update or a manual refresh, force the
         * incoming service worker to skip its waiting state
         * https://bugs.chromium.org/p/chromium/issues/detail?id=1271154#c66
         * return globalScope.skipWaiting(); // fixed in chrome v117 */
    };
}

/* The `EXTENSION_KEY` is a random & unique identifier for the current
 * extension runtime. It is currently used for verifiying the origin of
 * messages sent through unsecure channels (ie: iframe postmessaging).
 * see: `IFrameContextProvider.tsx` */
const EXTENSION_KEY = uint8ArrayToBase64String(generateKey());
WorkerMessageBroker.registerMessage(WorkerMessageType.RESOLVE_EXTENSION_KEY, () => ({ key: EXTENSION_KEY }));

if (ENV === 'development') {
    createDevReloader(async () => {
        const tabs = await browser.tabs.query({});
        const csUnloads = tabs
            .filter((tab) => tab.id !== undefined)
            .map((tab) =>
                browser.tabs
                    .sendMessage(tab.id!, backgroundMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }))
                    .catch(noop)
            );

        await Promise.all(csUnloads);
        setTimeout(() => browser.runtime.reload(), 250);
    }, '[DEV] Reloading runtime');
}

sentry({
    config,
    sentryConfig: {
        host: new URL(config.API_URL).host,
        release: config.APP_VERSION,
        environment: `browser-pass::worker`,
    },
    ignore: () => false,
    denyUrls: [],
});

const context = createWorkerContext(config);

browser.runtime.onConnect.addListener(WorkerMessageBroker.ports.onConnect);
browser.runtime.onMessageExternal.addListener(WorkerMessageBroker.onMessage);
browser.runtime.onMessage.addListener(WorkerMessageBroker.onMessage);
browser.runtime.onStartup.addListener(context.service.activation.onStartup);
browser.runtime.onInstalled.addListener(context.service.activation.onInstall);
browser.runtime.onUpdateAvailable.addListener(context.service.activation.onUpdateAvailable);

if (BUILD_TARGET === 'firefox' && ENV === 'production') {
    /* Block direct access to certain `web_accessible_resources`
     * at their direct runtime url: only allow through page actions
     * or iframe injections. Only works on FF as we don't have access
     * to tab information on chrome for `web_accessible_resources` */
    browser.tabs.onUpdated.addListener(async (tabId, _, { url, status }) => {
        try {
            const BLOCKING = ['/dropdown.html', '/notification.html'];
            const regex = new RegExp(`^(${BLOCKING.map((path) => browser.runtime.getURL(path)).join('|')})`);
            return await (status === 'complete' && regex.test(url ?? '') && browser.tabs.remove(tabId));
        } catch (_) {}
    });
}
