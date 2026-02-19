/** Due to a Safari MV3 service-worker registration error, the worker may be
 * registered in a corrupted state without access to the browser runtime API
 * after history/cookie clearing. To prevent issues: DO NOT access or call any
 * browser APIs from the top-level scope of this file. "Top-level" refers to
 * any bundled code that runs immediately when the file is loaded. This includes
 * side-effects such as directly executed statements and exported constants. */
import config from 'proton-pass-extension/app/config';
import { backgroundMessage } from 'proton-pass-extension/lib/message/send-message';
import 'proton-pass-extension/lib/polyfills/shim';
import { checkChromeRuntimeError } from 'proton-pass-extension/lib/utils/chrome';
import { devReload } from 'proton-pass-extension/lib/utils/reload';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import browser from '@proton/pass/lib/globals/browser';
import { safeCall } from '@proton/pass/utils/fp/safe-call';
import noop from '@proton/utils/noop';

import WorkerMessageBroker from './channel';
import { createWorkerContext } from './context/factory';
import './debugger';

if (typeof browser !== 'undefined') {
    if (BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari') {
        /* FIXME: create a custom webpack plugin to automatically register
         * chunks loaded through `importScripts` for the chromium build
         * https://bugs.chromium.org/p/chromium/issues/detail?id=1198822#c10*/
        const globalScope = self as any as ServiceWorkerGlobalScope;

        const localeChunks = Object.keys(config.LOCALES)
            .filter((locale) => locale !== 'en_US')
            .map((locale) => `chunk.locales/${locale}-json.js`);

        const extraChunks = ['chunk.zip.js', 'chunk.csv.reader.js'];

        const cryptoChunks = [
            'chunk.crypto-worker-api.js',
            'chunk.crypto-argon2.js',
            'chunk.crypto-nacl.js',
            'chunk.crypto-pqc.js',
            'chunk.crypto-noblehashes.js',
            'chunk.pass-core.main.js',
        ];

        const chunks = localeChunks.concat(cryptoChunks).concat(extraChunks);

        globalScope.oninstall = () => {
            safeCall(() => importScripts(...chunks.map((path) => browser.runtime.getURL(path))))();
            /* In order to alleviate MV3 service worker potentially ending up
             * in a broken state after an update or a manual refresh, force the
             * incoming service worker to skip its waiting state
             * https://bugs.chromium.org/p/chromium/issues/detail?id=1271154#c66 */
            if (BUILD_TARGET === 'chrome') return globalScope.skipWaiting().catch(checkChromeRuntimeError);
        };
    }

    if (BUILD_TARGET !== 'safari' && ENV === 'development') {
        devReload(async () => {
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

    const context = createWorkerContext(config);

    context.service.autofill.init().catch(noop);
    browser.runtime.onConnect.addListener(WorkerMessageBroker.ports.onConnect);
    browser.runtime.onMessageExternal.addListener(WorkerMessageBroker.onMessage);
    browser.runtime.onMessage.addListener(WorkerMessageBroker.onMessage);
    browser.runtime.onStartup.addListener(context.service.activation.onStartup);
    browser.runtime.onInstalled.addListener(context.service.activation.onInstall);

    if (BUILD_TARGET !== 'safari') {
        browser.runtime.onUpdateAvailable.addListener(context.service.activation.onUpdateAvailable);
    }

    if (BUILD_TARGET === 'firefox' && ENV === 'production') {
        const BLOCKING_PATHS = ['/dropdown.html', '/notification.html'];
        const BLOCKING_REGEX = new RegExp(`^(${BLOCKING_PATHS.map((p) => browser.runtime.getURL(p)).join('|')})`);

        browser.tabs.onUpdated.addListener(async (tabId, _, tab) => {
            try {
                /* Block direct access to certain `web_accessible_resources`
                 * at their direct runtime url: only allow through page actions
                 * or iframe injections. Only works on FF as we don't have access
                 * to tab information on chrome for `web_accessible_resources` */
                if (tab.status === 'complete' && BLOCKING_REGEX.test(tab.url ?? '')) await browser.tabs.remove(tabId);
            } catch (_) {}
        });
    }
}
