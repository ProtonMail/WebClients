/** Due to a Safari MV3 service-worker registration error, the worker may be
 * registered in a corrupted state without access to the browser runtime API
 * after history/cookie clearing. To prevent issues: DO NOT access or call any
 * browser APIs from the top-level scope of this file. "Top-level" refers to
 * any bundled code that runs immediately when the file is loaded. This includes
 * side-effects such as directly executed statements and exported constants. */
import * as config from 'proton-pass-extension/app/config';
import { createDevReloader } from 'proton-pass-extension/lib/utils/dev-reload';
import 'proton-pass-extension/lib/utils/polyfills';

import { backgroundMessage } from '@proton/pass/lib/extension/message/send-message';
import browser from '@proton/pass/lib/globals/browser';
import { WorkerMessageType } from '@proton/pass/types';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from './channel';
import { createWorkerContext } from './context/factory';

if (typeof browser !== 'undefined') {
    if (BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari') {
        /* FIXME: create a custom webpack plugin to automatically register
         * chunks loaded through `importScripts` for the chromium build
         * https://bugs.chromium.org/p/chromium/issues/detail?id=1198822#c10*/
        const globalScope = self as any as ServiceWorkerGlobalScope;

        const localeChunks = Object.keys(config.LOCALES).map((locale: string) => `chunk.locales/${locale}-json.js`);
        const cryptoChunks = ['chunk.crypto-worker-api.js', 'chunk.crypto-argon2.js'];

        const chunks = localeChunks.concat(cryptoChunks);

        globalScope.oninstall = async () => {
            importScripts(...chunks.map((path) => browser.runtime.getURL(path)));
            /* In order to alleviate MV3 service worker potentially ending up
             * in a broken state after an update or a manual refresh, force the
             * incoming service worker to skip its waiting state
             * https://bugs.chromium.org/p/chromium/issues/detail?id=1271154#c66 */
            if (BUILD_TARGET === 'chrome') return globalScope.skipWaiting();
        };
    }

    if (BUILD_TARGET !== 'safari' && ENV === 'development') {
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
    const { activation } = context.service;

    browser.runtime.onConnect.addListener(WorkerMessageBroker.ports.onConnect);
    browser.runtime.onMessageExternal.addListener(WorkerMessageBroker.onMessage);
    browser.runtime.onMessage.addListener(WorkerMessageBroker.onMessage);
    browser.runtime.onStartup.addListener(activation.onStartup);
    browser.runtime.onInstalled.addListener(activation.onInstall);
    if (BUILD_TARGET !== 'safari') browser.runtime.onUpdateAvailable.addListener(activation.onUpdateAvailable);

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
}
