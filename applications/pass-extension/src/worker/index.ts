import createApi, { exposeApi } from '@proton/pass/api';
import { getPersistedSession, setPersistedSession } from '@proton/pass/auth';
import { generateKey } from '@proton/pass/crypto/utils';
import { backgroundMessage } from '@proton/pass/extension/message';
import { browserSessionStorage } from '@proton/pass/extension/storage';
import browser from '@proton/pass/globals/browser';
import { WorkerMessageType, WorkerStatus } from '@proton/pass/types';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import sentry from '@proton/shared/lib/helpers/sentry';
import noop from '@proton/utils/noop';

import * as config from '../app/config';
import { createDevReloader } from '../shared/extension';
import WorkerMessageBroker from './channel';
import { createWorkerContext } from './context';

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

const api = exposeApi(
    createApi({
        config,
        onSessionRefresh: async ({ AccessToken, RefreshToken }) => {
            const persistedSession = await getPersistedSession();
            if (persistedSession) {
                await Promise.all([
                    setPersistedSession({ ...persistedSession, AccessToken, RefreshToken }),
                    browserSessionStorage.setItems({ AccessToken, RefreshToken }),
                ]);
            }
        },
    })
);

const context = createWorkerContext({ api, status: WorkerStatus.IDLE });

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
            const BLOCKING = ['/dropdown.html', '/notification.html', '/popup.html'];
            const regex = new RegExp(`^(${BLOCKING.map((path) => browser.runtime.getURL(path)).join('|')})`);
            return await (status === 'complete' && regex.test(url ?? '') && browser.tabs.remove(tabId));
        } catch (_) {}
    });
}
