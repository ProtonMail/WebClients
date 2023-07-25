/* Handling multiple instances of the orchestrator being injected is
 * necessary to ensure that the content-scripts are properly loaded
 * and unloaded as needed. This can be particularly important during
 * updates or hot-reload scenarios, where multiple instances of the
 * orchestrator may be living simultaneously. By unloading the client
 * content-script when the frame becomes hidden, we can free up resources
 * on inactive tabs, further improving performance and minimizing the
 * impact on the user's experience */
import { contentScriptMessage, sendMessage } from '@proton/pass/extension/message';
import { WorkerMessageType } from '@proton/pass/types';
import { isMainFrame } from '@proton/pass/utils/dom';
import { createListenerStore } from '@proton/pass/utils/listener';
import { logger } from '@proton/pass/utils/logger';

import { DOMCleanUp } from './injections/cleanup';

const listeners = createListenerStore();
let clientLoaded: boolean = false;

/* The `unregister` function is responsible for removing all event listeners
 * that are associated with the orchestrator. This may occur when the extension
 * context is invalidated, such as when the registration or unregistration of the
 * client fails */
const unregister = (err: unknown) => {
    logger.warn(`[ContentScript::orchestrator] invalidation error`, err);
    listeners.removeAll();
};

/* The `registerClient` function is responsible for ensuring that the client
 * content-script is loaded and started if it hasn't already been loaded in the
 * current frame. Once the client has been loaded, a `START_CONTENT_SCRIPT`
 * message is sent to the worker to start the script (used on visibilitychange) */
const registerClient = async () => {
    clientLoaded = await Promise.resolve(
        clientLoaded ||
            sendMessage(contentScriptMessage({ type: WorkerMessageType.LOAD_CONTENT_SCRIPT }))
                .then((res) => res.type === 'success')
                .catch(() => false)
    );

    await sendMessage(contentScriptMessage({ type: WorkerMessageType.START_CONTENT_SCRIPT }));
};

/* The `UNLOAD_CONTENT_SCRIPT` message is broadcasted to any client content-scripts
 * that may be running, instructing them to properly destroy themselves and free up
 * any resources they are using */
const unloadClient = () => sendMessage(contentScriptMessage({ type: WorkerMessageType.UNLOAD_CONTENT_SCRIPT }));

/* The `handleFrameVisibilityChange` function is registered as a listener for
 * the `visibilitychange` event on the `document` object. This ensures that resources
 * are freed up on inactive tabs, and that the content-script is properly re-registered
 * and initialized when the tab becomes active again */
const handleFrameVisibilityChange = () => {
    try {
        switch (document.visibilityState) {
            case 'visible':
                return registerClient();
            case 'hidden':
                return unloadClient();
        }
    } catch (err: unknown) {
        unregister(err);
    }
};

const loadCustomElements = async () =>
    new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('elements.js');

        script.addEventListener('load', () => {
            script.remove();
            resolve();
        });

        script.addEventListener('error', () => reject('Could not load custom elements'));

        (document.head || document.documentElement).appendChild(script);
    });

/* This IIFE is responsible for handling every new content-script injection. It starts
 * by cleaning up the DOM (in case of concurrent scripts running) and unloading any client
 * content-scripts. Depending on the current visibility state, either the client content
 * script is registered again or unloaded. TODO: add extra heuristics steps before actually
 * loading the client content-script : This would allows us to perform additional checks to
 * determine whether or not the client should be injected, potentially saving resources and
 * improving performance (ie: run the form detection assessment here) */
void (async () => {
    try {
        DOMCleanUp();
        await loadCustomElements();
        await unloadClient();

        if (!isMainFrame()) {
            /* FIXME: apply iframe specific heuristics here :
             * we want to avoid injecting into frames that have
             * an src element starting with "about:" or "javascript:"
             * + only one "iframe depth" should be supported */
        }
        listeners.addListener(document, 'visibilitychange', handleFrameVisibilityChange);
        await (document.visibilityState === 'visible' && registerClient());
    } catch (err) {
        unregister(err);
    }
})();
