/* Handling multiple instances of the orchestrator being injected is
 * necessary to ensure that the content-scripts are properly loaded
 * and unloaded as needed. This can be particularly important during
 * updates or hot-reload scenarios, where multiple instances of the
 * orchestrator may be living simultaneously. By unloading the client
 * content-script when the frame becomes hidden, we can free up resources
 * on inactive tabs, further improving performance and minimizing the
 * impact on the user's experience */
import 'proton-pass-extension/lib/utils/polyfills';

import { createActivityProbe } from '@proton/pass/hooks/useActivityProbe';
import { contentScriptMessage, sendMessage } from '@proton/pass/lib/extension/message/send-message';
import { WorkerMessageType } from '@proton/pass/types';
import { waitForPageReady } from '@proton/pass/utils/dom/state';
import { asyncLock } from '@proton/pass/utils/fp/promises';
import { createListenerStore } from '@proton/pass/utils/listener/factory';
import { logger } from '@proton/pass/utils/logger';
import { wait } from '@proton/shared/lib/helpers/promise';
import debounce from '@proton/utils/debounce';

import { DOMCleanUp } from './injections/cleanup';

const probe = createActivityProbe();
const listeners = createListenerStore();

let clientLoaded: boolean = false;

/* The `unregister` function is responsible for removing all event listeners
 * that are associated with the orchestrator. This may occur when the extension
 * context is invalidated, such as when the registration or unregistration of the
 * client fails */
const unregister = (err: unknown) => {
    logger.warn(`[ContentScript::orchestrator] invalidation error`, err);
    listeners.removeAll();
    probe.cancel();
};

/* The `UNLOAD_CONTENT_SCRIPT` message is broadcasted to any client content-scripts
 * that may be running, instructing them to properly destroy themselves and free up
 * any resources they are using */
const unloadClient = async () => {
    probe.cancel();
    await sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));
};

const ping = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.PING }));

/** The `registerClient` function ensures that the client content-script is loaded
 * and started within the current frame. This prevents multiple injections of the
 * content-script when the user rapidly switches tabs by unloading it on visibility
 * change. To mitigate rapid tab switching, a debounce mechanism is employed to
 * regulate the execution frequency and avoid starting the script unnecessarily */
const registerClient = debounce(
    asyncLock(async () => {
        probe.start(ping, 25_000);

        clientLoaded = await Promise.resolve(
            clientLoaded ||
                sendMessage(contentScriptMessage({ type: WorkerMessageType.LOAD_CONTENT_SCRIPT }))
                    .then((res) => res.type === 'success')
                    .catch(() => false)
        );

        if (clientLoaded) return sendMessage(contentScriptMessage({ type: WorkerMessageType.START_CONTENT_SCRIPT }));
        else return unregister('Client could not load');
    }),
    1_000,
    { leading: true }
);

/* The `handleFrameVisibilityChange` function is registered as a listener for the
 * `visibilitychange` event on the `document` object. This ensures that resources
 * are freed up on inactive tabs, and that the content-script is properly re-registered
 * and initialized when the tab becomes active again */
const handleFrameVisibilityChange = () => {
    try {
        switch (document.visibilityState) {
            case 'visible':
                return registerClient();
            case 'hidden':
                registerClient.cancel();
                return unloadClient();
        }
    } catch (err: unknown) {
        unregister(err);
    }
};

/* This IIFE is responsible for handling every new content-script injection. It starts
 * by cleaning up the DOM (in case of concurrent scripts running) and unloading any client
 * content-scripts. Depending on the current visibility state, either the client content
 * script is registered again or unloaded. TODO: add extra heuristics steps before actually
 * loading the client content-script : This would allows us to perform additional checks to
 * determine whether or not the client should be injected, potentially saving resources and
 * improving performance (ie: run the form detection assessment here) */
void (async () => {
    try {
        /* Prevent injection on non-HTML documents, for example XML files */
        const documentElement = document.ownerDocument || document;
        if (!documentElement?.body) return;

        await waitForPageReady();

        /** In Firefox & Safari, stale content-scripts are automatically disabled
         * and new ones are re-injected as needed. Consequently, the destroy sequence
         * triggered by the disconnection of a stale port will not be executed */
        if (BUILD_TARGET === 'firefox' || BUILD_TARGET === 'safari') {
            DOMCleanUp({ root: '[data-protonpass-role="root"]', control: '[data-protonpass-role="icon"]' });
        }

        if (BUILD_TARGET === 'safari') {
            /** Perform a sanity check before initiating the client registration sequence.
             * If a critical error message is detected, introduce a brief delay to mitigate
             * a potential race condition in Safari's service worker registration process. */
            await ping().then<any>((res) => res.type === 'error' && res.critical && wait(1_000));
        }

        if (BUILD_TARGET === 'chrome' || BUILD_TARGET === 'safari') await unloadClient();

        listeners.addListener(document, 'visibilitychange', handleFrameVisibilityChange);
        await (document.visibilityState === 'visible' && registerClient());
    } catch (err) {
        unregister(err);
    }
})();
